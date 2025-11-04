/**
 * Network Configuration Helper
 * Quick script to check and manage network settings
 */

import dotenv from "dotenv";
dotenv.config();

const NETWORKS = {
  testnet: {
    name: "0G Galileo Testnet",
    chainId: 16602,
    rpcUrl: "https://evmrpc-testnet.0g.ai",
    explorerUrl: "https://chainscan-galileo.0g.ai",
    storageIndexer: "https://indexer-storage-testnet.0g.ai",
    symbol: "0G",
    faucet: "https://faucet.0g.ai"
  },
  mainnet: {
    name: "0G Mainnet",
    chainId: 16661,
    rpcUrl: "https://evmrpc.0g.ai",
    explorerUrl: "https://chainscan.0g.ai",
    storageIndexer: "https://indexer-storage-turbo.0g.ai",
    symbol: "0G",
    faucet: null
  }
};

function displayNetworkInfo() {
  const selectedNetwork = (process.env.NETWORK || "testnet").toLowerCase();
  const network = NETWORKS[selectedNetwork] || NETWORKS.testnet;

  console.log("\n╔════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    iSentinel Network Configuration                    ║");
  console.log("╚════════════════════════════════════════════════════════════════════════╝\n");

  console.log(`🌐 Active Network: ${network.name}`);
  console.log(`   ${selectedNetwork === 'mainnet' ? '🟢 LIVE (Mainnet)' : '🟡 TEST (Testnet)'}`);
  console.log("");

  console.log("📋 Network Details:");
  console.log("-".repeat(80));
  console.log(`   Network Name:      ${network.name}`);
  console.log(`   Chain ID:          ${network.chainId}`);
  console.log(`   Token Symbol:      ${network.symbol}`);
  console.log(`   RPC URL:           ${network.rpcUrl}`);
  console.log(`   Storage Indexer:   ${network.storageIndexer}`);
  console.log(`   Block Explorer:    ${network.explorerUrl}`);
  if (network.faucet) {
    console.log(`   Faucet:            ${network.faucet}`);
  }
  console.log("");

  console.log("📝 Environment Variables:");
  console.log("-".repeat(80));
  console.log(`   NETWORK:           ${process.env.NETWORK || 'testnet'}`);
  console.log(`   OG_RPC_URL:        ${process.env.OG_RPC_URL || 'Not set'}`);
  console.log(`   INFT_ADDRESS:      ${process.env.INFT_ADDRESS || 'Not set'}`);
  console.log(`   ORACLE_ADDRESS:    ${process.env.ORACLE_ADDRESS || 'Not set'}`);
  console.log(`   PRIVATE_KEY:       ${process.env.PRIVATE_KEY ? '✅ Set (hidden)' : '❌ Not set'}`);
  console.log("");

  if (selectedNetwork === 'testnet') {
    console.log("✅ TESTNET MODE - Safe for Development");
    console.log("   • Use free testnet tokens from faucet");
    console.log("   • No risk of losing real funds");
    console.log("   • Perfect for testing and demos");
    console.log("");
    console.log(`   Get testnet tokens: ${network.faucet}`);
  } else {
    console.log("⚠️  MAINNET MODE - Production Environment");
    console.log("   • Uses real 0G tokens");
    console.log("   • Transactions cost real money");
    console.log("   • Deploy only when fully tested");
    console.log("");
    console.log("   💡 Make sure contracts are deployed to mainnet!");
  }

  console.log("\n🔗 Quick Links:");
  console.log("-".repeat(80));
  console.log(`   Explorer:   ${network.explorerUrl}`);
  console.log(`   RPC:        ${network.rpcUrl}`);
  if (process.env.INFT_ADDRESS) {
    console.log(`   Contract:   ${network.explorerUrl}/address/${process.env.INFT_ADDRESS}`);
  }
  console.log("");

  console.log("🛠️  Quick Commands:");
  console.log("-".repeat(80));
  console.log(`   Deploy:     node scripts/deployINFT.js --network ${selectedNetwork === 'mainnet' ? 'og-mainnet' : 'og-testnet'}`);
  console.log(`   Mint NFT:   node scripts/mintIncidentINFT.js --network ${selectedNetwork === 'mainnet' ? 'og-mainnet' : 'og-testnet'}`);
  console.log(`   Start App:  pnpm nodemon backend/serverOG.js`);
  console.log("");

  console.log("💡 To Switch Networks:");
  console.log("-".repeat(80));
  if (selectedNetwork === 'testnet') {
    console.log("   Edit .env: NETWORK=mainnet");
    console.log("   Update frontend: ACTIVE_NETWORK = NETWORKS.MAINNET");
  } else {
    console.log("   Edit .env: NETWORK=testnet");
    console.log("   Update frontend: ACTIVE_NETWORK = NETWORKS.TESTNET");
  }
  console.log("   Then restart backend and frontend");
  console.log("\n" + "=".repeat(80) + "\n");
}

function validateConfiguration() {
  const issues = [];
  const selectedNetwork = process.env.NETWORK || "testnet";

  if (!process.env.PRIVATE_KEY) {
    issues.push("❌ PRIVATE_KEY not set in .env");
  }

  if (!process.env.OG_RPC_URL) {
    issues.push("⚠️  OG_RPC_URL not set (will use default)");
  }

  if (selectedNetwork === 'mainnet') {
    if (!process.env.MAINNET_INFT_ADDRESS) {
      issues.push("⚠️  MAINNET_INFT_ADDRESS not set - deploy contracts first!");
    }
    if (!process.env.MAINNET_ORACLE_ADDRESS) {
      issues.push("⚠️  MAINNET_ORACLE_ADDRESS not set - deploy contracts first!");
    }
  } else {
    if (!process.env.TESTNET_INFT_ADDRESS && !process.env.INFT_ADDRESS) {
      issues.push("⚠️  TESTNET_INFT_ADDRESS not set");
    }
  }

  if (issues.length > 0) {
    console.log("\n⚠️  Configuration Issues Found:");
    console.log("-".repeat(80));
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log("");
    return false;
  }

  console.log("\n✅ Configuration Valid!");
  return true;
}

// Main execution
console.clear();
displayNetworkInfo();
validateConfiguration();

export { NETWORKS, displayNetworkInfo, validateConfiguration };
