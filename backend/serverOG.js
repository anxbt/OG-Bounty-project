import "dotenv/config";
import http from "http";
import { spawn } from "child_process";
import OGStorageManager from "../lib/ogStorage.js";

const PORT = process.env.PORT || 8787;

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
    // Return stored incidents
    const incidents = Array.from(incidentStore.values());
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(incidents));
  } catch (error) {
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

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ 
    ok: true, 
    msg: "iSentinel backend with 0G Storage integration",
    endpoints: {
      "POST /incident": "Report new incident",
      "GET /incidents": "List all incidents", 
      "GET /download?uri=0g://...": "Download from 0G Storage"
    }
  }));
});

server.listen(PORT, () => {
  console.log(`🚀 iSentinel backend listening on :${PORT}`);
  console.log(`📡 0G Storage integration enabled`);
  console.log(`🎨 iNFT Contract: ${process.env.INFT_ADDRESS || 'Not set'}`);
  console.log(`📡 Oracle: ${process.env.ORACLE_ADDRESS || 'Not set'}`);
  if (process.env.INFT_ADDRESS) {
    console.log(`✨ Using advanced 0G iNFT with oracle verification`);
  }
});