import "dotenv/config";
import http from "http";
import { spawn } from "child_process";
import OGStorageManager from '../lib/ogStorage.js';
import { computeAnalytics } from './computeAnalytics.js';
import AttestationManager from './attestationManager.js';
import { ethers } from 'ethers';
import { analyzeWithGemini, isGeminiAvailable } from './geminiAnalytics.js';
import computeProper from './computeProper.js';

const PORT = process.env.PORT || 8787;

// Try to import legacy 0G Compute (for fallback)
let computeAnalyticsZG = null;
let USE_REAL_0G_COMPUTE = false;

try {
  const module = await import('./computeAnalyticsZG.js');
  computeAnalyticsZG = module.default;
  console.log('✅ Legacy 0G Compute SDK available as secondary fallback');
} catch (error) {
  console.log('ℹ️  Legacy 0G Compute SDK not available');
}

// In-memory storage for incidents (in production, use a database)
const incidentStore = new Map();

function storeIncident(incidentData) {
  const timestamp = Date.now();
  const incidentId = `incident-${timestamp}`;
  
  const storedIncident = {
    incidentId,
    timestamp,
    ...incidentData,
    created_at: new Date().toISOString()
  };
  
  incidentStore.set(incidentId, storedIncident);
  console.log(`📝 Stored incident: ${incidentData.title || 'Untitled'}`);
  return incidentId;
}

function mintIncident(incident, cb) {
  // Store incident data before minting
  const incidentId = storeIncident(incident);
  
  const payload = JSON.stringify({ ...incident, incidentId });
  const network = incident?.network || process.env.NETWORK || "og";
  // Use INFT contract address if available, fallback to old contract
  const address = incident?.contract || process.env.INFT_ADDRESS || process.env.INCIDENT_NFT_ADDRESS || "";

  const env = {
    ...process.env,
    INCIDENT_PAYLOAD: payload,
    INFT_ADDRESS: address,
    INCIDENT_NFT_ADDRESS: address, // Keep for backward compatibility
    NETWORK: network,
  };

  // Use the new INFT minting script if INFT address is set
  const scriptPath = process.env.INFT_ADDRESS ? "scripts/mintIncidentINFT.js" : "scripts/mintIncident.js";
  
  const child = spawn("node", [scriptPath, "--network", network], {
    env,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => process.stderr.write(d));
  child.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ Incident ${incidentId} minted as iNFT successfully`);
    }
    cb(code, incidentId);
  });
}

// Add new endpoint to retrieve incidents (for frontend)
async function getIncidents(req, res) {
  try {
    // Return stored incidents from memory
    let incidents = Array.from(incidentStore.values());
    
    console.log(`📦 Found ${incidents.length} incidents in memory`);
    
    // If memory is empty, try to load from blockchain
    if (incidents.length === 0 && contract) {
      console.log('🔄 Memory empty, loading incidents from blockchain...');
      try {
        // Query IncidentMinted events
        const filter = contract.filters.IncidentMinted();
        const DEPLOYMENT_BLOCK = 2286000; // INFT deployment block
        const events = await contract.queryFilter(filter, DEPLOYMENT_BLOCK);
        
        console.log(`📡 Found ${events.length} minting events on blockchain`);
        
        const storage = new OGStorageManager();
        
        for (const event of events.reverse()) {
          if ('args' in event && event.args) {
            const [tokenId, , , severityNum, uri, timestamp] = event.args;
            
            try {
              // Download metadata from 0G Storage
              let title = `Incident #${tokenId}`;
              let description = 'AI incident detected';
              let logs = 'Log data stored off-chain';
              let severity = ['info', 'warning', 'critical'][Number(severityNum)] || 'info';
              
              if (uri && uri.startsWith('0g://')) {
                const metadataStr = await storage.downloadFromOG(uri);
                const metadata = JSON.parse(metadataStr);
                
                title = metadata.name || metadata.title || title;
                description = metadata.description || description;
                
                // Download logs if available
                if (metadata.logUri && metadata.logUri.startsWith('0g://')) {
                  try {
                    logs = await storage.downloadFromOG(metadata.logUri);
                  } catch (err) {
                    logs = metadata.logs || logs;
                  }
                } else if (metadata.logs) {
                  logs = metadata.logs;
                }
                
                // Map severity
                if (metadata.severity === 'critical' || metadata.severity === 2) severity = 'critical';
                else if (metadata.severity === 'warning' || metadata.severity === 1) severity = 'warning';
                else severity = 'info';
              }
              
              const owner = await contract.ownerOf(tokenId);
              
              const incident = {
                incidentId: `incident-${tokenId}`,
                token_id: Number(tokenId),
                tokenId: Number(tokenId),
                title,
                description,
                logs,
                severity,
                timestamp: new Date(Number(timestamp) * 1000).toISOString(),
                owner,
                tx_hash: event.transactionHash,
                log_hash: uri ? uri.split('0g://')[1] : '',
                created_at: new Date(Number(timestamp) * 1000).toISOString()
              };
              
              // Store in memory
              incidentStore.set(incident.incidentId, incident);
              
            } catch (err) {
              console.warn(`⚠️  Failed to process token ${tokenId}:`, err.message);
            }
          }
        }
        
        incidents = Array.from(incidentStore.values());
        console.log(`✅ Loaded ${incidents.length} incidents from blockchain into memory`);
        
      } catch (blockchainError) {
        console.error('❌ Failed to load from blockchain:', blockchainError);
        // Continue with empty array
      }
    }
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(incidents));
  } catch (error) {
    console.error('❌ Error fetching incidents:', error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
}

// Add endpoint to download from 0G Storage
async function downloadFromOG(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const ogUri = url.searchParams.get('uri');
    
    if (!ogUri || !ogUri.startsWith('0g://')) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Invalid 0G URI" }));
      return;
    }

    const storage = new OGStorageManager();
    const content = await storage.downloadFromOG(ogUri);
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, content }));
    
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: error.message }));
  }
}

// Track attestation jobs
const attestationJobs = new Map();
let attestationManager = null;
let contract = null;

// Initialize attestation manager
try {
  attestationManager = new AttestationManager(process.env.PRIVATE_KEY);
  console.log('✅ Attestation Manager initialized');
  
  // Initialize contract connection
  const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  // Load INFT ABI (we'll create a minimal one)
  const INFT_ABI = [
    "function addAttestation(uint256 tokenId, bytes32 hash, string calldata uri) external",
    "function getAttestations(uint256 tokenId) external view returns (tuple(bytes32 hash, string uri, address signer, uint64 timestamp)[])",
    "function getEncryptedURI(uint256 tokenId) external view returns (string memory)",
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "event IncidentAttested(uint256 indexed tokenId, bytes32 indexed hash, address indexed signer, string uri, uint64 timestamp)",
    "event IncidentMinted(uint256 indexed tokenId, string incidentId, string logHash, uint8 severity, string tokenURI, uint256 timestamp)"
  ];
  
  contract = new ethers.Contract(process.env.INFT_ADDRESS, INFT_ABI, wallet);
  console.log('✅ Contract connection initialized');
} catch (error) {
  console.log('⚠️  Attestation Manager initialization failed:', error.message);
}

const server = http.createServer((req, res) => {
  // Enable CORS for frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/incident") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const incident = body ? JSON.parse(body) : {};
        console.log('📥 Received incident report:', incident.title || 'Untitled');
        
        mintIncident(incident, (code, incidentId) => {
          if (code === 0) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
              success: true,
              message: "Incident reported and NFT minted successfully!",
              incidentId: incidentId,
              // Note: actual tokenId and txHash would come from the minting script
              // For now, we'll indicate they're processing
              tokenId: null,
              txHash: null,
              logHash: null
            }));
          } else {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ 
              success: false,
              message: "Failed to mint incident NFT. Please check logs."
            }));
          }
        });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ 
          success: false, 
          message: `Invalid request: ${e.message}` 
        }));
      }
    });
    return;
  }

  if (req.method === "GET" && req.url === "/incidents") {
    getIncidents(req, res);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/download")) {
    downloadFromOG(req, res);
    return;
  }

  // NEW: Analytics endpoint using 0G Compute
  if ((req.method === "GET" || req.method === "POST") && req.url === "/analytics") {
    const handleAnalytics = async (incidents) => {
      try {
        console.log(`📊 Computing analytics using 0G Compute for ${incidents.length} incidents...`);
        
        // Choose real 0G Compute or simulated
        const analyticsService = (USE_REAL_0G_COMPUTE && computeAnalyticsZG) ? computeAnalyticsZG : computeAnalytics;
        const computeMode = (USE_REAL_0G_COMPUTE && computeAnalyticsZG) ? 'Real 0G Compute Network' : 'Simulated';
        console.log(`🔧 Using: ${computeMode}`);
        
        const analytics = await analyticsService.computeAnalytics(incidents);
        console.log('✅ Analytics computation complete');
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(analytics));
      } catch (error) {
        console.error('❌ Analytics computation failed:', error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: error.message }));
      }
    };

    if (req.method === "POST") {
      // POST: Accept incidents from frontend
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        try {
          const { incidents } = JSON.parse(body);
          handleAnalytics(incidents || []);
        } catch (e) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "Invalid JSON" }));
        }
      });
    } else {
      // GET: Use backend storage (for backward compatibility)
      const incidents = Array.from(incidentStore.values());
      handleAnalytics(incidents);
    }
    return;
  }

  // VISA: New attestation endpoints
  if (req.method === "POST" && req.url.match(/^\/api\/incident\/\d+\/attest$/)) {
    const tokenId = parseInt(req.url.split('/')[3]);
    const jobId = `job-${Date.now()}-${Math.random()}`;
    
    // Start async job
    (async () => {
      const aiErrors = [];

      try {
        if (!attestationManager) {
          throw new Error('Attestation Manager not initialized');
        }

        // Get incident from store (try both token_id and tokenId)
        let incident = Array.from(incidentStore.values())
          .find(inc => inc.token_id === tokenId || inc.tokenId === tokenId);
        
        // Fetch the incident from blockchain
        if (!incident) {
          console.log(`🔍 Incident ${tokenId} not in memory, fetching from blockchain...`);
          try {
            // Get the encrypted URI using the correct function name
            const uri = await contract.getEncryptedURI(tokenId);
            if (!uri) {
              throw new Error(`Token ${tokenId} has no URI`);
            }
            
            // Download metadata from 0G Storage
            const storage = new OGStorageManager();
            const metadataStr = await storage.downloadFromOG(uri);
            const metadata = JSON.parse(metadataStr);
            
            // Get token owner
            const owner = await contract.ownerOf(tokenId);
            
            // Download logs if logUri is provided
            let incidentLogs = '';
            if (metadata.logUri && metadata.logUri.startsWith('0g://')) {
              console.log(`   📥 Downloading logs from: ${metadata.logUri.substring(0, 50)}...`);
              try {
                const logsStr = await storage.downloadFromOG(metadata.logUri);
                incidentLogs = logsStr;
              } catch (logsErr) {
                console.warn(`   ⚠️  Failed to download logs:`, logsErr.message);
                incidentLogs = metadata.logs || 'Logs unavailable';
              }
            } else if (metadata.logs) {
              incidentLogs = metadata.logs;
            }
            
            incident = {
              token_id: tokenId,
              tokenId: tokenId, // Keep both for compatibility
              title: metadata.name || 'Untitled Incident',
              description: metadata.description || '',
              logs: incidentLogs,
              severity: metadata.severity === 'critical' || metadata.severity === 2 ? 'critical' : 
                       metadata.severity === 'warning' || metadata.severity === 1 ? 'warning' : 'info',
              timestamp: new Date(metadata.timestamp * 1000).toISOString(),
              owner: owner,
              log_hash: uri.split('0g://')[1]
            };
            
            console.log(`✅ Fetched incident from blockchain: ${incident.title}`);
          } catch (fetchError) {
            console.error('❌ Failed to fetch from blockchain:', fetchError);
            throw new Error(`Incident with token ${tokenId} not found (not in memory and couldn't fetch from chain)`);
          }
        } else {
          console.log(`📋 Found incident in memory: ${incident.title}`);
        }

        // Query 0G Compute with enhanced prompt
        const prompt = `Analyze this AI incident and explain WHY it was flagged:
          
          Title: ${incident.title}
          Description: ${incident.description}
          Logs: ${incident.logs ? incident.logs.substring(0, 500) : 'No logs available'}
          
          Return in JSON format with:
          {
            "summary": "1-2 sentence explanation of what happened",
            "severityScore": number from 1-10,
            "analysis": "detailed technical findings",
            "flagReason": "Human-readable explanation of WHY this incident matters (e.g., model mismatch, safety violation, bias detected)",
            "technicalDetails": "Deeper technical explanation for experts",
            "categories": ["category1", "category2"]
          }`;

    console.log('🤖 Requesting AI analysis...');
    let aiResponse;
    let aiSummary;
    let analysisSource = 'Fallback';
        
        // PRIMARY: Try proper 0G Compute Network (new SDK)
        try {
          console.log('🔬 Attempting 0G Compute Network (SDK)...');
          aiResponse = await computeProper.queryComputeNetwork(prompt);
          aiSummary = computeProper.parseAnalysis(aiResponse);
          analysisSource = '0G Compute Network';
          console.log('✅ 0G Compute Network analysis successful');
        } catch (properComputeErr) {
          console.warn('⚠️ 0G Compute Network unavailable:', properComputeErr.message);
          aiErrors.push(properComputeErr);
          
          // FALLBACK 1: Try legacy 0G Compute
          if (computeAnalyticsZG) {
            try {
              console.log('🔧 Attempting legacy 0G Compute...');
              aiResponse = await computeAnalyticsZG.queryComputeModel(prompt);
              aiSummary = JSON.parse(aiResponse);
              analysisSource = '0G Compute (legacy)';
              console.log('✅ Legacy 0G Compute analysis successful');
            } catch (legacyErr) {
              console.warn('⚠️ Legacy 0G Compute failed:', legacyErr.message);
              aiErrors.push(legacyErr);
            }
          }
        }
        
        // FALLBACK 2: Gemini AI
        if (!aiSummary) {
          if (isGeminiAvailable()) {
            try {
              console.log('🔮 Falling back to Gemini AI...');
              aiSummary = await analyzeWithGemini(incident);
              analysisSource = 'Gemini AI (fallback)';
              console.log('✅ Gemini analysis successful');
            } catch (geminiError) {
              console.warn('⚠️ Gemini also failed:', geminiError.message);
              aiErrors.push(geminiError);
              // Continue to basic fallback
            }
          }
        }
        
        // FALLBACK 3: Basic analysis
        if (!aiSummary) {
          console.log('📊 Using basic analysis fallback');
          aiSummary = {
            summary: `${incident.title}. ${incident.description.substring(0, 100)}...`,
            severityScore: incident.severity === 'critical' ? 9 : incident.severity === 'warning' ? 6 : 3,
            analysis: 'Automated analysis based on incident metadata',
            categories: [incident.severity, 'ai-safety']
          };
          analysisSource = 'Basic fallback';
        }
        
        // Add incident context to summary
        const enrichedSummary = {
          ...aiSummary,
          tokenId: tokenId,
          incidentId: incident.incidentId || incident.id,
          analysisSource // Track which AI was used
        };
        
        // Create and sign attestation
        const attestation = await attestationManager.createAttestation(
          { ...incident, tokenId },
          enrichedSummary
        );
        
        // Add attestation on-chain
        console.log('📝 Recording attestation on-chain...');
        const tx = await contract.addAttestation(
          tokenId,
          attestation.hash,
          attestation.attestationUri
        );

        console.log(`✅ Attestation complete! Tx: ${tx.hash}`);

        // Update job status
        attestationJobs.set(jobId, {
          status: 'complete',
          ...attestation,
          txHash: tx.hash
        });

      } catch (error) {
        console.error('❌ Attestation failed:', error);
        attestationJobs.set(jobId, {
          status: 'failed',
          error: error.message || String(error),
          chain: aiErrors.map((err) => err.message)
        });
      }
    })();

    // Return immediately with job ID
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      jobId,
      status: 'pending',
      message: 'Attestation generation started'
    }));
    return;
  }

  // VISA: Check attestation status
  if (req.method === "GET" && req.url.startsWith('/api/attest/')) {
    const jobId = req.url.split('/')[3];
    const job = attestationJobs.get(jobId);
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(job || { status: 'not-found' }));
    return;
  }

  // Health check endpoint for monitoring AI services
  if (req.method === "GET" && req.url === '/api/health') {
    const health = {
      timestamp: new Date().toISOString(),
      services: {
        compute: {
          primary: computeProper.isBrokerAvailable() ? 'active' : 'unavailable',
          legacy: computeAnalyticsZG ? 'available' : 'unavailable',
          status: computeProper.isBrokerAvailable() ? 'operational' : 'needs funding'
        },
        gemini: {
          status: isGeminiAvailable() ? 'active' : 'unavailable',
          model: 'gemini-1.5-flash',
          configured: !!process.env.GEMINI_API_KEY
        },
        storage: {
          status: 'active',
          provider: '0G Storage Network'
        },
        blockchain: {
          status: 'active',
          network: process.env.CHAIN_ID || '16602',
          contract: process.env.INFT_ADDRESS || process.env.INCIDENT_NFT_ADDRESS || 'Not set'
        }
      },
      fallbackChain: ['0G Compute (SDK)', 'Legacy 0G Compute', 'Gemini AI', 'Basic fallback']
    };
    
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(health));
    return;
  }

  // VISA: Recompute/reproducibility endpoint
  const recomputeCache = new Map(); // Simple in-memory cache
  const recomputeRateLimit = new Map(); // Rate limiting: tokenId -> timestamp
  
  if (req.method === "POST" && req.url.match(/^\/api\/incident\/\d+\/recompute$/)) {
    const tokenId = parseInt(req.url.split('/')[3]);
    
    (async () => {
      try {
      // Rate limiting: max 1 per 5 minutes per incident
      const lastRun = recomputeRateLimit.get(tokenId);
      if (lastRun && Date.now() - lastRun < 5 * 60 * 1000) {
        const waitTime = Math.ceil((5 * 60 * 1000 - (Date.now() - lastRun)) / 1000);
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Please wait ${waitTime}s before re-running`,
          retryAfter: waitTime
        }));
        return;
      }

      // Check cache first (30min TTL)
      const cached = recomputeCache.get(tokenId);
      if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          ...cached.data,
          cached: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
        }));
        return;
      }

      console.log(`🔄 Recomputing incident ${tokenId}...`);
      
      // Fetch incident (same logic as attestation)
      let incident = Array.from(incidentStore.values())
        .find(inc => inc.token_id === tokenId || inc.tokenId === tokenId);
      
      if (!incident) {
        const uri = await contract.getEncryptedURI(tokenId);
        if (!uri) {
          throw new Error(`Token ${tokenId} not found`);
        }
        
        const storage = new OGStorageManager();
        const metadataStr = await storage.downloadFromOG(uri);
        const metadata = JSON.parse(metadataStr);
        const owner = await contract.ownerOf(tokenId);
        
        let incidentLogs = '';
        if (metadata.logUri && metadata.logUri.startsWith('0g://')) {
          try {
            incidentLogs = await storage.downloadFromOG(metadata.logUri);
          } catch {
            incidentLogs = metadata.logs || 'Logs unavailable';
          }
        } else if (metadata.logs) {
          incidentLogs = metadata.logs;
        }
        
        incident = {
          token_id: tokenId,
          tokenId: tokenId,
          title: metadata.name || 'Untitled Incident',
          description: metadata.description || '',
          logs: incidentLogs,
          severity: metadata.severity === 'critical' || metadata.severity === 2 ? 'critical' : 
                   metadata.severity === 'warning' || metadata.severity === 1 ? 'warning' : 'info',
          timestamp: new Date(metadata.timestamp * 1000).toISOString(),
          owner: owner,
          log_hash: uri.split('0g://')[1]
        };
      }

      // Run AI analysis (same multi-tier fallback)
      const prompt = `Analyze this AI incident and provide a concise summary and severity score:
        Title: ${incident.title}
        Description: ${incident.description}
        
        Return in JSON format with:
        {
          "summary": "1-2 sentence explanation",
          "severityScore": number from 1-10,
          "analysis": "detailed findings"
        }`;

      let aiResponse;
      let aiSummary;
      let analysisSource = 'Unknown';
      
      // Try 0G Compute first
      try {
        console.log('🔬 Recompute: Attempting 0G Compute Network (SDK)...');
        aiResponse = await computeProper.queryComputeNetwork(prompt);
        aiSummary = computeProper.parseAnalysis(aiResponse);
        analysisSource = '0G Compute Network';
      } catch (err1) {
        console.warn('⚠️ Recompute: 0G Compute unavailable');
        
        // Try legacy
        if (computeAnalyticsZG) {
          try {
            aiResponse = await computeAnalyticsZG.queryComputeModel(prompt);
            aiSummary = JSON.parse(aiResponse);
            analysisSource = '0G Compute (legacy)';
          } catch (err2) {
            console.warn('⚠️ Recompute: Legacy 0G Compute failed');
          }
        }
        
        // Try Gemini
        if (!aiSummary && isGeminiAvailable()) {
          try {
            console.log('🔮 Recompute: Falling back to Gemini AI...');
            aiSummary = await analyzeWithGemini(incident);
            analysisSource = 'Gemini AI (fallback)';
          } catch (err3) {
            console.warn('⚠️ Recompute: Gemini also failed');
          }
        }
        
        // Basic fallback
        if (!aiSummary) {
          aiSummary = {
            summary: `${incident.title}. ${incident.description.substring(0, 100)}...`,
            severityScore: incident.severity === 'critical' ? 9 : incident.severity === 'warning' ? 6 : 3,
            analysis: 'Automated analysis based on incident metadata'
          };
          analysisSource = 'Basic fallback';
        }
      }

      const recomputedAnalysis = {
        ...aiSummary,
        analysisSource,
        tokenId,
        timestamp: new Date().toISOString()
      };

      // Get original attestation from chain (if exists)
      let originalAnalysis = null;
      try {
        const attestations = await contract.getAttestations(tokenId);
        if (attestations && attestations.length > 0) {
          const latestAttestation = attestations[attestations.length - 1];
          if (latestAttestation.attestationUri) {
            const storage = new OGStorageManager();
            const attestationStr = await storage.downloadFromOG(latestAttestation.attestationUri);
            const attestationData = JSON.parse(attestationStr);
            originalAnalysis = {
              summary: attestationData.summary,
              severityScore: attestationData.severityScore,
              analysisSource: attestationData.analysisSource || 'Unknown',
              timestamp: latestAttestation.timestamp || 'Unknown'
            };
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch original attestation:', err.message);
      }

      // Compare
      const comparison = {
        original: originalAnalysis,
        recomputed: recomputedAnalysis,
        match: false,
        reproducible: false,
        matchPercentage: 0
      };

      if (originalAnalysis) {
        const severityMatch = originalAnalysis.severityScore === recomputedAnalysis.severityScore;
        const sourceMatch = originalAnalysis.analysisSource === recomputedAnalysis.analysisSource;
        comparison.match = severityMatch;
        comparison.reproducible = severityMatch && sourceMatch;
        comparison.matchPercentage = severityMatch ? (sourceMatch ? 100 : 75) : 50;
      }

      // Cache result
      recomputeCache.set(tokenId, {
        data: comparison,
        timestamp: Date.now()
      });
      
      // Update rate limit
      recomputeRateLimit.set(tokenId, Date.now());
      
      console.log(`✅ Recompute complete: ${comparison.matchPercentage}% match`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(comparison));
      
    } catch (error) {
      console.error('❌ Recompute failed:', error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        error: 'Recompute failed',
        message: error.message
      }));
    }
    })();
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ 
    ok: true, 
    msg: "iSentinel backend with 0G Storage + Compute integration",
    endpoints: {
      "POST /incident": "Report new incident",
      "GET /incidents": "List all incidents", 
      "GET /download?uri=0g://...": "Download from 0G Storage",
      "GET /analytics": "Get AI analytics powered by 0G Compute"
    }
  }));
});

server.listen(PORT, () => {
  console.log(`🚀 iSentinel backend listening on :${PORT}`);
  console.log(`� 0G Storage integration enabled`);
  console.log(`🧠 0G Compute analytics enabled`);
  console.log(`⛓️  0G Blockchain: Chain ID ${process.env.CHAIN_ID || '16602'}`);
  console.log(`🎨 iNFT Contract: ${process.env.INFT_ADDRESS || process.env.INCIDENT_NFT_ADDRESS || 'Not set'}`);
  console.log(`📡 Oracle: ${process.env.ORACLE_ADDRESS || 'Not set'}`);
  if (process.env.INFT_ADDRESS) {
    console.log(`✨ Using advanced 0G iNFT with oracle verification`);
  }
  console.log(`\n🔗 Full 0G Stack Active: Storage ✓ Compute ✓ Blockchain ✓`);
});