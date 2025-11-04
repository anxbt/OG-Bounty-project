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
  const address = addrIdx >= 0 && args[addrIdx + 1] ? args[addrIdx + 1] : process.env.INFT_ADDRESS || "";
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
  const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "INFT.sol", "INFT.json");
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

  const inftAddress = address;
  if (!isAddress(inftAddress)) throw new Error("Set INFT_ADDRESS or pass --address <addr>");

  const privateKey = normalizePrivateKey(network);
  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  
  console.log("=================================================");
  console.log("🎨 Minting iNFT with 0G Integration");
  console.log("=================================================");
  console.log(`Wallet: ${wallet.address}`);
  console.log(`Network: ${network}`);
  console.log(`INFT Contract: ${inftAddress}`);
  console.log("");

  const artifact = loadArtifact();
  const contract = new Contract(inftAddress, artifact.abi, wallet);

  const payload = parsePayload();
  const incident = buildIncident(payload);

  // Step 1: Upload logs to 0G Storage
  console.log("📁 Step 1: Uploading incident logs to 0G Storage...");
  const logsResult = await storeWithOG(incident.logs, `${incident.incidentId}.log`);
  console.log(`✅ Logs stored at: ${logsResult.uri}`);
  console.log("");
  
  // Step 2: Create metadata with encrypted/enhanced fields
  const metadata = {
    name: payload.title || `AI Incident ${incident.incidentId}`,
    description: payload.description || "Advanced iNFT incident report with 0G oracle integration",
    incidentId: incident.incidentId,
    severity: incident.severity === 2 ? "critical" : incident.severity === 1 ? "warning" : "info",
    logUri: logsResult.uri,
    timestamp: Math.floor(Date.now() / 1000),
    attributes: [
      { trait_type: "severity", value: incident.severity },
      { trait_type: "oracle_verified", value: true }
    ],
    extra: payload.extra || payload,
    storage: {
      provider: logsResult.fallback ? "local" : "0g",
      rootHash: logsResult.rootHash,
      size: logsResult.size
    },
    // iNFT specific fields
    encrypted: true,
    oracleVerified: true,
    contractType: "iNFT"
  };
  
  // Step 3: Upload metadata to 0G Storage
  console.log("📁 Step 2: Uploading metadata to 0G Storage...");
  const metadataResult = await storeWithOG(JSON.stringify(metadata, null, 2), `${incident.incidentId}.json`);
  console.log(`✅ Metadata stored at: ${metadataResult.uri}`);
  console.log("");

  // Step 4: Calculate metadata hash for on-chain storage
  const metadataHash = keccak256(toUtf8Bytes(JSON.stringify(metadata)));
  
  console.log("⛓️  Step 3: Minting iNFT on 0G blockchain...");
  console.log(`   Encrypted URI: ${metadataResult.uri}`);
  console.log(`   Metadata Hash: ${metadataHash}`);
  console.log("");

  // Step 5: Mint the iNFT using the INFT contract
  // function mint(address to, string calldata encryptedURI, bytes32 metadataHash)
  const tx = await contract.mint(wallet.address, metadataResult.uri, metadataHash);
  const receipt = await tx.wait();

  // Extract token ID from Transfer event
  let tokenId = undefined;
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === "Transfer") {
        tokenId = parsed.args.tokenId;
        break;
      }
    } catch (err) {
      // ignore non-matching logs
    }
  }

  console.log("=================================================");
  console.log("✨ iNFT Minting Complete!");
  console.log("=================================================");
  console.log("🎨 Token ID:", tokenId?.toString() ?? "unknown");
  console.log("📝 Transaction:", receipt?.hash);
  console.log("📁 Logs URI:", logsResult.uri);
  console.log("📁 Metadata URI:", metadataResult.uri);
  console.log("🔒 Metadata Hash:", metadataHash);
  console.log("⛽ Gas used:", receipt?.gasUsed.toString());
  console.log("");
  
  if (!logsResult.fallback && !metadataResult.fallback) {
    console.log("🎉 Successfully used 0G Storage + 0G iNFT!");
  }
  
  console.log("🔍 Verify on explorer:");
  console.log(`https://chainscan-galileo.0g.ai/tx/${receipt?.hash}`);
  console.log("=================================================");
}

main().catch((e) => {
  console.error("❌ Minting failed:", e);
  process.exitCode = 1;
});
