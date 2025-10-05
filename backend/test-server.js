import http from "http";

const PORT = 8787;

// In-memory storage for incidents
const incidentStore = new Map();

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => body += chunk.toString());
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/incident") {
    try {
      const incidentData = await parseBody(req);
      
      const timestamp = Date.now();
      const incidentId = `incident-${timestamp}`;
      
      const storedIncident = {
        incidentId,
        tokenId: timestamp, // Simple tokenId for testing
        timestamp,
        ...incidentData,
        created_at: new Date().toISOString()
      };
      
      incidentStore.set(incidentId, storedIncident);
      
      console.log(`📝 Stored incident:`, storedIncident);
      
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        ok: true, 
        incidentId,
        tokenId: timestamp,
        message: "Incident stored successfully (test mode)"
      }));
    } catch (error) {
      console.error("Error storing incident:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (req.method === "GET" && req.url === "/incidents") {
    const incidents = Array.from(incidentStore.values());
    console.log(`📋 Returning ${incidents.length} incidents`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(incidents));
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ 
    ok: true, 
    msg: "iSentinel test backend",
    endpoints: {
      "POST /incident": "Report new incident",
      "GET /incidents": "List all incidents"
    },
    storedCount: incidentStore.size
  }));
});

server.listen(PORT, () => {
  console.log(`🧪 Test backend listening on :${PORT}`);
  console.log(`📊 Ready to store incidents`);
});