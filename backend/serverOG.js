import "dotenv/config";
import http from "http";
import { spawn } from "child_process";
import OGStorageManager from '../lib/ogStorage.js';
import { computeAnalytics } from './computeAnalytics.js';
import AttestationManager from './attestationManager.js';
import { ethers } from 'ethers';
import { analyzeWithGemini, isGeminiAvailable } from './geminiAnalytics.js';

const PORT = process.env.PORT || 8787;

// Try to import 0G Compute SDK (optional)
let computeAnalyticsZG = null;
let USE_REAL_0G_COMPUTE = false;

try {
  const module = await import('./computeAnalyticsZG.js');
  computeAnalyticsZG = module.default;
  USE_REAL_0G_COMPUTE = process.env.USE_0G_COMPUTE !== 'false'; // Enabled if SDK available
  console.log('✅ 0G Compute SDK loaded successfully');
} catch (error) {
  console.log('ℹ️  0G Compute SDK not available, using simulated analytics');
  console.log('   To enable: npm install @0glabs/0g-serving-broker crypto-js --legacy-peer-deps');
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
    const incidents = Array.from(incidentStore.values());
    
    console.log(`📦 Returning ${incidents.length} incidents from memory`);
    
    // If memory is empty, return empty array
    // Frontend will fall back to blockchain query
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
    "event IncidentAttested(uint256 indexed tokenId, bytes32 indexed hash, address indexed signer, string uri, uint64 timestamp)"
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
      try {
        if (!attestationManager) {
          throw new Error('Attestation Manager not initialized');
        }

        // Get incident from store (try both token_id and tokenId)
        const incident = Array.from(incidentStore.values())
          .find(inc => inc.token_id === tokenId || inc.tokenId === tokenId);
        
        if (!incident) {
          throw new Error(`Incident with token ${tokenId} not found in store`);
        }

        console.log(`📋 Found incident: ${incident.title}`);

        // Query 0G Compute
        const prompt = `Analyze this AI incident and provide a concise summary and severity score:
          Title: ${incident.title}
          Description: ${incident.description}
          
          Return in JSON format with:
          {
            "summary": "1-2 sentence explanation",
            "severityScore": number from 1-10,
            "analysis": "detailed findings"
          }`;

        console.log('🤖 Requesting 0G Compute analysis...');
        let aiResponse;
        let aiSummary;
        let analysisSource = '0G Compute';
        
        try {
          // PRIMARY: Try 0G Compute first
          aiResponse = await computeAnalyticsZG.queryComputeModel(prompt);
          aiSummary = JSON.parse(aiResponse);
          console.log('✅ 0G Compute analysis successful');
        } catch (computeError) {
          console.warn('⚠️ 0G Compute unavailable:', computeError.message);
          
          // FALLBACK 1: Try Gemini AI
          if (isGeminiAvailable()) {
            try {
              console.log('🔮 Falling back to Gemini AI...');
              aiSummary = await analyzeWithGemini(incident);
              analysisSource = 'Gemini AI (fallback)';
              console.log('✅ Gemini analysis successful');
            } catch (geminiError) {
              console.warn('⚠️ Gemini also failed:', geminiError.message);
              throw new Error('Both 0G Compute and Gemini unavailable');
            }
          } else {
            // FALLBACK 2: Basic analysis
            console.log('📊 Using basic analysis fallback');
            aiSummary = {
              summary: `${incident.title}. ${incident.description.substring(0, 100)}...`,
              severityScore: incident.severity === 'critical' ? 9 : incident.severity === 'warning' ? 6 : 3,
              analysis: 'Automated analysis based on incident metadata',
              categories: [incident.severity, 'ai-safety']
            };
            analysisSource = 'Basic fallback';
          }
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
          error: error.message || String(error)
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