import hre from "hardhat";
import fs from "fs/promises";
import path from "path";
import { ethers as ethersLib } from "ethers";

async function loadArtifact(contractName) {
  const candidates = [
    path.join("artifacts", "contracts", `${contractName}.sol`, `${contractName}.json`),
    path.join("artifacts", `${contractName}.json`),
  ];

  for (const p of candidates) {
    try {
      const content = await fs.readFile(p, "utf8");
      return JSON.parse(content);
    } catch (e) {
      // continue
    }
  }
  throw new Error(`Artifact for ${contractName} not found`);
}

async function deployWithEthers(artifact, signer, constructorArgs = []) {
  const factory = new ethersLib.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy(...constructorArgs);
  if (typeof contract.waitForDeployment === "function") {
    await contract.waitForDeployment();
  } else if (contract.deployTransaction) {
    await contract.deployTransaction.wait(1);
  }
  return contract;
}

async function main() {
  const hreEthers = hre.ethers;
  let signer, provider;

  if (hreEthers && typeof hreEthers.getSigners === "function") {
    const [deployer] = await hreEthers.getSigners();
    signer = deployer;
    provider = hreEthers.provider;
    console.log("Using Hardhat HRE ethers for deployment");
  } else {
    const rpc = process.env.OG_RPC_URL || process.env.RPC_URL || "http://localhost:8545";
    provider = new ethersLib.JsonRpcProvider(rpc);
    const pk = process.env.PRIVATE_KEY;
    if (!pk) throw new Error("PRIVATE_KEY not set in environment for fallback deploy");
    signer = new ethersLib.Wallet(pk, provider);
    console.log("Using ethers.js fallback for deployment");
  }

  const deployerAddress = signer.address || (await signer.getAddress());
  console.log("Deploying contracts with account:", deployerAddress);

  const mockArtifact = await loadArtifact("MockOracle");
  const mockContract = await deployWithEthers(mockArtifact, signer, []);

  const inftArtifact = await loadArtifact("INFT");
  const oracleAddress = mockContract.address || (await mockContract.getAddress?.());
  const inftContract = await deployWithEthers(inftArtifact, signer, ["AI Agent NFTs", "AINFT", oracleAddress]);

  const inftAddress = inftContract.address || (await inftContract.getAddress?.());

  console.log("Oracle deployed to:", oracleAddress);
  console.log("INFT deployed to:", inftAddress);

  try {
    if (hre.network && hre.network.name && hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("Attempting contract verification (if configured)...");
      await hre.run("verify:verify", { address: oracleAddress, constructorArguments: [] }).catch(() => {});
      await hre.run("verify:verify", { address: inftAddress, constructorArguments: ["AI Agent NFTs", "AINFT", oracleAddress] }).catch(() => {});
    }
  } catch (e) {
    console.log("Verification skipped or failed:", e.message || e);
  }
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
