import "dotenv/config";
import { ContractFactory, JsonRpcProvider, Wallet } from "ethers";
import fs from "fs";
import path from "path";

function parseArgs() {
  const args = process.argv.slice(2);
  const networkIndex = args.indexOf("--network");
  return networkIndex >= 0 && args[networkIndex + 1] ? args[networkIndex + 1] : process.env.NETWORK || "og";
}

function normalizePrivateKey(pk, network) {
  if (!pk && (network === "localhost" || network === "hardhat")) {
    pk = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  }
  if (!pk) throw new Error("Set PRIVATE_KEY in .env or environment");
  return pk.startsWith("0x") ? pk : `0x${pk}`;
}

function resolveRpc(network) {
  if (network === "og") return process.env.OG_RPC_URL;
  if (network === "localhost" || network === "hardhat") return process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
  if (network.startsWith("http")) return network;
  const envKey = `${network.toUpperCase()}_RPC_URL`;
  return process.env[envKey];
}

async function main() {
  const network = parseArgs();
  const rpcUrl = resolveRpc(network);
  if (!rpcUrl) throw new Error(`Missing RPC url for network ${network}`);
  const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY || process.env.LOCAL_PRIVATE_KEY || "", network);

  const provider = new JsonRpcProvider(rpcUrl);
  const wallet = new Wallet(privateKey, provider);
  
  console.log("=================================================");
  console.log("🚀 Deploying 0G iNFT System");
  console.log("=================================================");
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Network: ${network}`);
  console.log(`RPC: ${rpcUrl}`);
  console.log("");

  // Step 1: Deploy MockOracle
  console.log("📡 Step 1: Deploying MockOracle...");
  const oraclePath = path.join(process.cwd(), "artifacts", "contracts", "MockOracle.sol", "MockOracle.json");
  const oracleArtifact = JSON.parse(fs.readFileSync(oraclePath, "utf8"));
  
  const oracleFactory = new ContractFactory(oracleArtifact.abi, oracleArtifact.bytecode, wallet);
  const oracle = await oracleFactory.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  
  console.log("✅ MockOracle deployed at:", oracleAddress);
  console.log("");

  // Step 2: Deploy INFT with Oracle
  console.log("🎨 Step 2: Deploying INFT contract...");
  const inftPath = path.join(process.cwd(), "artifacts", "contracts", "INFT.sol", "INFT.json");
  const inftArtifact = JSON.parse(fs.readFileSync(inftPath, "utf8"));

  const inftFactory = new ContractFactory(inftArtifact.abi, inftArtifact.bytecode, wallet);
  const inft = await inftFactory.deploy(
    "iSentinel Incident iNFT",  // name
    "iSNTL",                      // symbol
    oracleAddress                 // oracle address
  );
  await inft.waitForDeployment();
  const inftAddress = await inft.getAddress();
  
  const receipt = await inft.deploymentTransaction()?.wait();
  
  console.log("✅ INFT deployed at:", inftAddress);
  if (receipt) {
    console.log("📝 Deployment tx:", receipt.hash);
    console.log("⛽ Gas used:", receipt.gasUsed.toString());
  }
  console.log("");

  // Summary
  console.log("=================================================");
  console.log("✨ Deployment Complete!");
  console.log("=================================================");
  console.log("📡 MockOracle:", oracleAddress);
  console.log("🎨 INFT Contract:", inftAddress);
  console.log("");
  console.log("📋 Next Steps:");
  console.log("1. Update .env with:");
  console.log(`   ORACLE_ADDRESS=${oracleAddress}`);
  console.log(`   INFT_ADDRESS=${inftAddress}`);
  console.log("2. Run: node scripts/mintIncidentINFT.js --network og");
  console.log("=================================================");
}

main().catch((e) => {
  console.error("❌ Deployment failed:", e);
  process.exitCode = 1;
});
