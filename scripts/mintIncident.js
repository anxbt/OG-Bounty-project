import "dotenv/config";
import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes, isAddress } from "ethers";
import fs from "fs";
import path from "path";
import OGStorageManager from "../lib/ogStorage.js";

const severityMap = {
  info: 0,
  warning: 1,
  critical: 2,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--network");
  const network = idx >= 0 && args[idx + 1] ? args[idx + 1] : process.env.NETWORK || "og";
  const addrIdx = args.indexOf("--address");
  const address = addrIdx >= 0 && args[addrIdx + 1] ? args[addrIdx + 1] : process.env.INCIDENT_NFT_ADDRESS || "";
  return { network, address };
}

function resolveRpc(network) {
  if (network === "og") return process.env.OG_RPC_URL;
  if (network === "localhost" || network === "hardhat") return process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
  if (network.startsWith("http")) return network;
  const envKey = `${network.toUpperCase()}_RPC_URL`;
  return process.env[envKey];
}

function normalizePrivateKey(network) {
  let pk = process.env.PRIVATE_KEY || process.env.LOCAL_PRIVATE_KEY || "";
  if (!pk && (network === "localhost" || network === "hardhat")) {
    pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }
  if (!pk) throw new Error("Set PRIVATE_KEY (or LOCAL_PRIVATE_KEY) in environment");
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function loadArtifact() {
  const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "IncidentNFT.sol", "IncidentNFT.json");
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

function parsePayload() {
  const raw = process.env.INCIDENT_PAYLOAD;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn("Failed to parse INCIDENT_PAYLOAD JSON, falling back to defaults:", err.message);
    return {};
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function storeWithOG(content, filename) {
  const storage = new OGStorageManager();
  return await storage.uploadToOG(content, filename);
}

function buildIncident(payload) {
  const now = new Date();
  const incidentId = payload.incidentId || `incident-${now.getTime()}`;
  const severityInput = payload.severity ?? "critical";
  const severityKey = typeof severityInput === "number" ? severityInput : severityInput.toString().toLowerCase();
  const severity = typeof severityKey === "number"
    ? Math.max(0, Math.min(2, severityKey))
    : severityMap[severityKey] ?? 2;
  
  // Require real logs - NO MOCK DATA
  const logs = payload.logs || payload.message;
  if (!logs || logs.trim() === '') {
    throw new Error('❌ Logs are required. Please provide real incident logs or error details.');
  }

  return { incidentId, severity, logs };
}

async function main() {
  const { network, address } = parseArgs();
  const rpcUrl = resolveRpc(network);
  if (!rpcUrl) throw new Error(`Missing RPC url for network ${network}`);

  const nftAddress = address;
  if (!isAddress(nftAddress)) throw new Error("Set INCIDENT_NFT_ADDRESS or pass --address <addr>");

  const privateKey = normalizePrivateKey(network);
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  console.log(`Minting incident from ${wallet.address} on ${network} (${rpcUrl})`);

  const artifact = loadArtifact();
  const contract = new Contract(nftAddress, artifact.abi, wallet);

  const payload = parsePayload();
  const incident = buildIncident(payload);

  const logHash = keccak256(toUtf8Bytes(incident.logs));
  
  // Upload logs to 0G Storage
  console.log("📁 Uploading incident logs to 0G Storage...");
  const logsResult = await storeWithOG(incident.logs, `${incident.incidentId}.log`);
  
  const metadata = {
    name: payload.title || `AI Incident ${incident.incidentId}`,
    description: payload.description || "Incident report (0G Storage)",
    incidentId: incident.incidentId,
    severity: incident.severity === 2 ? "critical" : incident.severity === 1 ? "warning" : "info",
    logUri: logsResult.uri,
    logHash,
    timestamp: Math.floor(Date.now() / 1000),
    attributes: [{ trait_type: "severity", value: incident.severity }],
    extra: payload.extra || payload,
    storage: {
      provider: logsResult.fallback ? "local" : "0g",
      rootHash: logsResult.rootHash,
      size: logsResult.size
    }
  };
  
  // Upload metadata to 0G Storage
  console.log("📁 Uploading incident metadata to 0G Storage...");
  const metadataResult = await storeWithOG(JSON.stringify(metadata, null, 2), `${incident.incidentId}.json`);

  const tx = await contract.mintIncident(wallet.address, incident.incidentId, logHash, incident.severity, metadataResult.uri);
  const receipt = await tx.wait();

  let tokenId = undefined;
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "IncidentMinted") {
        tokenId = parsed.args.tokenId;
        break;
      }
    } catch (err) {
      // ignore non-matching logs
    }
  }

  console.log("✅ Minted incident token", tokenId?.toString() ?? "unknown", "tx:", receipt?.hash);
  console.log("📁 Logs stored at:", logsResult.uri);
  console.log("📁 Metadata stored at:", metadataResult.uri);
  if (!logsResult.fallback && !metadataResult.fallback) {
    console.log("🎉 Successfully used 0G Storage for all data!");
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
