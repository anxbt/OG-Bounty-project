/**
 * Mainnet Gas Cost Estimation for iSentinel Deployment
 * 
 * This script estimates the total gas costs for deploying
 * the full iSentinel system on Ethereum mainnet or 0G mainnet
 */

import "dotenv/config";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Gas price assumptions (in Gwei)
const GAS_PRICES = {
  ethereum: {
    low: 15,      // Off-peak hours
    medium: 30,   // Normal conditions
    high: 50,     // Peak/congested
    extreme: 100  // Network congestion
  },
  og: {
    low: 0.001,   // 0G network (much cheaper)
    medium: 0.01,
    high: 0.1,
    extreme: 1
  }
};

// ETH price assumption (USD)
const ETH_PRICE_USD = 2000;

// Contract bytecode sizes (approximate)
function getContractSizes() {
  try {
    const oraclePath = path.join(process.cwd(), "artifacts", "contracts", "MockOracle.sol", "MockOracle.json");
    const inftPath = path.join(process.cwd(), "artifacts", "contracts", "INFT.sol", "INFT.json");
    
    const oracleArtifact = JSON.parse(fs.readFileSync(oraclePath, "utf8"));
    const inftArtifact = JSON.parse(fs.readFileSync(inftPath, "utf8"));
    
    const oracleBytecodeLength = oracleArtifact.bytecode.length / 2 - 1; // Remove '0x' and divide by 2
    const inftBytecodeLength = inftArtifact.bytecode.length / 2 - 1;
    
    return {
      oracle: oracleBytecodeLength,
      inft: inftBytecodeLength
    };
  } catch (error) {
    console.log("⚠️  Could not read compiled artifacts, using estimates");
    return {
      oracle: 300,    // ~300 bytes for MockOracle
      inft: 15000     // ~15KB for INFT contract
    };
  }
}

// Estimated gas costs for each operation
function getGasEstimates(bytecodeSize) {
  return {
    // Contract deployments
    deployOracle: 21000 + (200 * bytecodeSize.oracle) + 50000,  // Base + creation + storage
    deployINFT: 21000 + (200 * bytecodeSize.inft) + 300000,     // Larger contract with more storage
    
    // Setup operations
    setAttestor: 50000,           // Update mapping + emit event
    authorizeAttestor: 50000,     // Same as above
    
    // Per-incident operations (for reference)
    mintIncident: 150000,         // Mint NFT + store metadata hash + URI
    addAttestation: 100000,       // Add attestation to array + emit event
    transferNFT: 80000,           // ERC721 transfer
    
    // Total for full deployment
    get fullDeployment() {
      return this.deployOracle + this.deployINFT + (this.setAttestor * 2); // Deploy + setup 2 attestors
    }
  };
}

function calculateCosts(gasAmount, network = 'ethereum') {
  const prices = GAS_PRICES[network];
  const results = {};
  
  Object.keys(prices).forEach(scenario => {
    const gasPriceGwei = prices[scenario];
    const gasPriceWei = gasPriceGwei * 1e9;
    const costEth = (gasAmount * gasPriceWei) / 1e18;
    const costUsd = costEth * ETH_PRICE_USD;
    
    results[scenario] = {
      gasPriceGwei,
      costEth: costEth.toFixed(6),
      costUsd: costUsd.toFixed(2)
    };
  });
  
  return results;
}

function formatTable(title, data) {
  console.log(`\n${title}`);
  console.log("=".repeat(80));
  console.log("Scenario        Gas Price       ETH Cost        USD Cost");
  console.log("-".repeat(80));
  
  Object.keys(data).forEach(scenario => {
    const d = data[scenario];
    const scenarioName = scenario.padEnd(15);
    const gasPrice = `${d.gasPriceGwei} Gwei`.padEnd(15);
    const ethCost = `${d.costEth} ETH`.padEnd(15);
    const usdCost = `$${d.costUsd}`;
    
    console.log(`${scenarioName} ${gasPrice} ${ethCost} ${usdCost}`);
  });
}

function main() {
  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║         iSentinel Mainnet Deployment Gas Estimation                  ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");
  
  const bytecodeSize = getContractSizes();
  const gasEstimates = getGasEstimates(bytecodeSize);
  
  console.log("📊 Contract Sizes:");
  console.log(`   MockOracle: ${bytecodeSize.oracle.toLocaleString()} bytes`);
  console.log(`   INFT Contract: ${bytecodeSize.inft.toLocaleString()} bytes`);
  
  console.log("\n⛽ Estimated Gas Usage:");
  console.log("-".repeat(80));
  console.log(`   Deploy MockOracle:        ${gasEstimates.deployOracle.toLocaleString()} gas`);
  console.log(`   Deploy INFT Contract:     ${gasEstimates.deployINFT.toLocaleString()} gas`);
  console.log(`   Set Attestor (x2):        ${(gasEstimates.setAttestor * 2).toLocaleString()} gas`);
  console.log("-".repeat(80));
  console.log(`   TOTAL DEPLOYMENT:         ${gasEstimates.fullDeployment.toLocaleString()} gas`);
  
  console.log("\n💡 Per-Operation Costs (for reference):");
  console.log(`   Mint Incident NFT:        ${gasEstimates.mintIncident.toLocaleString()} gas`);
  console.log(`   Add Attestation:          ${gasEstimates.addAttestation.toLocaleString()} gas`);
  console.log(`   Transfer NFT:             ${gasEstimates.transferNFT.toLocaleString()} gas`);
  
  // Ethereum Mainnet Costs
  const ethCosts = calculateCosts(gasEstimates.fullDeployment, 'ethereum');
  formatTable("💰 ETHEREUM MAINNET DEPLOYMENT COSTS", ethCosts);
  
  // 0G Mainnet Costs
  const ogCosts = calculateCosts(gasEstimates.fullDeployment, 'og');
  formatTable("💰 0G MAINNET DEPLOYMENT COSTS", ogCosts);
  
  // Operational costs (100 incidents as example)
  const operationalGas = (gasEstimates.mintIncident + gasEstimates.addAttestation) * 100;
  console.log(`\n\n📈 OPERATIONAL COSTS (100 Incidents):`);
  console.log("=".repeat(80));
  console.log(`Total Gas: ${operationalGas.toLocaleString()} gas\n`);
  
  const ethOpCosts = calculateCosts(operationalGas, 'ethereum');
  console.log("On Ethereum:");
  Object.keys(ethOpCosts).forEach(scenario => {
    const d = ethOpCosts[scenario];
    console.log(`  ${scenario}: ${d.costEth} ETH ($${d.costUsd})`);
  });
  
  const ogOpCosts = calculateCosts(operationalGas, 'og');
  console.log("\nOn 0G Network:");
  Object.keys(ogOpCosts).forEach(scenario => {
    const d = ogOpCosts[scenario];
    console.log(`  ${scenario}: ${d.costEth} OG ($${d.costUsd})`);
  });
  
  // Summary
  console.log("\n\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║                          RECOMMENDATIONS                              ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");
  
  console.log("🎯 For Ethereum Mainnet:");
  console.log(`   • Deployment Budget: $${ethCosts.medium.costUsd} - $${ethCosts.high.costUsd} (at current gas prices)`);
  console.log("   • Deploy during off-peak hours to save ~50% on gas");
  console.log("   • Consider L2 solutions (Arbitrum, Optimism) for 10-100x savings");
  
  console.log("\n🎯 For 0G Mainnet (RECOMMENDED):");
  console.log(`   • Deployment Budget: $${ogCosts.medium.costUsd} (99% cheaper than Ethereum!)`);
  console.log("   • Native 0G Storage integration (no IPFS costs)");
  console.log("   • Native 0G Compute integration");
  console.log("   • Much lower operational costs for scaling");
  
  console.log("\n💡 Additional Considerations:");
  console.log("   • 0G Storage costs: ~$0.001 per incident (logs + metadata)");
  console.log("   • 0G Compute costs: ~$0.001-0.01 per AI inference");
  console.log("   • Backend hosting: ~$20-50/month (VPS/cloud)");
  console.log("   • Domain + SSL: ~$15/year");
  
  console.log("\n📝 Assumptions:");
  console.log(`   • ETH Price: $${ETH_PRICE_USD}`);
  console.log("   • Gas prices are estimates; check current rates before deploying");
  console.log("   • Actual costs may vary ±20% based on network conditions");
  console.log("   • 0G prices are testnet-based estimates; mainnet may differ");
  
  console.log("\n✅ Ready to deploy? Run:");
  console.log("   Ethereum: npx hardhat run scripts/deployINFT.js --network mainnet");
  console.log("   0G:       node scripts/deployINFT.js --network og");
  console.log("=".repeat(80));
  console.log("");
}

main();
