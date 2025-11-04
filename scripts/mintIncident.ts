import hre from "hardhat";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

// Mock storage: write files locally and create a file:// URI. Replace with 0G SDK upload later.
async function storeLocal(content: string, filename: string) {
  const outDir = path.join(process.cwd(), "out", "storage");
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, filename);
  fs.writeFileSync(filePath, content);
  return `file://${filePath.replace(/\\/g, "/")}`;
}

export async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", await signer.getAddress());

  // Parameters
  const incidentId = `incident-${Date.now()}`;
  const severity = 2; // 0 info,1 warning,2 critical
  
  // Require real logs from environment variable - NO MOCK DATA
  const rawLogs = process.env.INCIDENT_LOGS || process.env.INCIDENT_PAYLOAD;
  if (!rawLogs || rawLogs.trim() === '') {
    throw new Error('❌ Logs are required. Set INCIDENT_LOGS or INCIDENT_PAYLOAD environment variable with real incident data.');
  }

  // Compute hash of raw logs
  const logHashBytes = createHash("keccak256");
  // Node crypto doesn't have keccak256 alias in all versions; fallback to sha3-256
  // Try keccak256, else sha3-256
  let logHashHex: string;
  try {
    // @ts-ignore
    logHashBytes.update(rawLogs);
    // @ts-ignore Node may throw if unsupported
    logHashHex = "0x" + logHashBytes.digest("hex");
  } catch {
    const alt = createHash("sha3-256");
    alt.update(rawLogs);
    logHashHex = "0x" + alt.digest("hex");
  }

  // Store raw logs (mock storage). Replace with 0G storage upload.
  const logsUri = await storeLocal(rawLogs, `${incidentId}.log`);

  // Build metadata JSON
  const metadata = {
    name: `AI Incident ${incidentId}`,
    description: "Incident report (mock)",
    incidentId,
    severity: severity === 2 ? "critical" : severity === 1 ? "warning" : "info",
    logUri: logsUri,
    logHash: logHashHex,
    timestamp: Math.floor(Date.now() / 1000),
    attributes: [{ trait_type: "severity", value: severity }],
  };

  const metadataUri = await storeLocal(JSON.stringify(metadata, null, 2), `${incidentId}.json`);

  // Attach deployed IncidentNFT
  const contractAddr = process.env.INCIDENT_NFT_ADDRESS || "";
  if (!hre.ethers.isAddress(contractAddr)) {
    throw new Error("Set INCIDENT_NFT_ADDRESS in env to the deployed IncidentNFT address");
  }
  const incidentNft = await hre.ethers.getContractAt("IncidentNFT", contractAddr);

  // Mint
  const tx = await incidentNft.mintIncident(signer.address, incidentId, logHashHex as any, severity, metadataUri);
  const receipt = await tx.wait();
  console.log("Minted, tx:", receipt?.hash);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
