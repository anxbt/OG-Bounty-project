import "dotenv/config";
import http from "http";
import { spawn } from "child_process";

const PORT = process.env.PORT || 8787;

function mintIncident(incident, cb) {
  const payload = JSON.stringify(incident ?? {});
  const network = incident?.network || process.env.NETWORK || "og";
  const address = incident?.contract || process.env.INCIDENT_NFT_ADDRESS || "";

  const env = {
    ...process.env,
    INCIDENT_PAYLOAD: payload,
    INCIDENT_NFT_ADDRESS: address,
    NETWORK: network,
  };

  const child = spawn("node", ["scripts/mintIncident.js", "--network", network], {
    env,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (d) => process.stdout.write(d));
  child.stderr.on("data", (d) => process.stderr.write(d));
  child.on("close", (code) => cb(code));
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/incident") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const incident = body ? JSON.parse(body) : {};
        mintIncident(incident, (code) => {
          res.writeHead(code === 0 ? 200 : 500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: code === 0 }));
        });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, msg: "iSentinel mock backend" }));
});

server.listen(PORT, () => console.log(`Mock backend listening on :${PORT}`));
