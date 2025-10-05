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
  console.log(`Deploying IncidentNFT with ${wallet.address} on ${network} (${rpcUrl})`);

  const artifactPath = path.join(process.cwd(), "artifacts", "contracts", "IncidentNFT.sol", "IncidentNFT.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const factory = new ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  const receipt = await contract.deploymentTransaction()?.wait();
  const address = await contract.getAddress();
  console.log("IncidentNFT deployed at:", address);
  if (receipt) console.log("Deployment tx:", receipt.hash);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
