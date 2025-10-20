#!/usr/bin/env node
/**
 * Test script to verify metadata and logs can be fetched from 0G Storage
 */

require('dotenv').config();
const { ethers } = require('ethers');

// Import ES module dynamically
let OGStorageManager;

const CONTRACT_ADDRESS = process.env.INFT_ADDRESS || process.env.INCIDENT_NFT_ADDRESS;
const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';

// Minimal ABI for testing
const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getEncryptedURI(uint256 tokenId) view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

async function testMetadataFetch() {
  console.log('\n🧪 Testing Metadata & Logs Fetch from 0G Storage\n');
  console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);
  console.log(`🌐 RPC: ${RPC_URL}\n`);

  try {
    // Import the ES module
    const { default: OGStorageManagerClass } = await import('../lib/ogStorage.js');
    
    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const storage = new OGStorageManagerClass();

    // Get latest block
    const latestBlock = await provider.getBlockNumber();
    console.log(`📊 Latest block: ${latestBlock}`);

    // Query Transfer events (mints)
    const filter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
    console.log('🔍 Querying last 50,000 blocks for minted NFTs...\n');
    
    const events = await contract.queryFilter(filter, -50000);
    console.log(`✅ Found ${events.length} minted NFTs\n`);

    if (events.length === 0) {
      console.log('⚠️  No NFTs found. Try minting one first.');
      return;
    }

    // Test the first NFT
    const event = events[0];
    const [, to, tokenId] = event.args;
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎫 Testing Token ID: ${tokenId}`);
    console.log(`   Minted to: ${to}`);
    console.log(`   Block: ${event.blockNumber}\n`);

    // Get metadata URI
    let metadataURI;
    try {
      // Try encryptedURI first (iNFT)
      metadataURI = await contract.getEncryptedURI(tokenId);
      console.log(`� encryptedURI: ${metadataURI.substring(0, 70)}...`);
    } catch (err) {
      try {
        metadataURI = await contract.tokenURI(tokenId);
        console.log(`� tokenURI: ${metadataURI.substring(0, 70)}...`);
      } catch (err2) {
        console.log('❌ Could not fetch URI');
        return;
      }
    }

    if (!metadataURI.startsWith('0g://')) {
      console.log('⚠️  URI is not from 0G Storage');
      return;
    }

    // Download metadata
    console.log('\n📥 Downloading metadata from 0G Storage...');
    const metadataContent = await storage.downloadFromOG(metadataURI);
    const metadata = JSON.parse(metadataContent);
    
    console.log('✅ Metadata downloaded successfully!\n');
    console.log('📋 Metadata Contents:');
    console.log(`   Title: ${metadata.name || 'N/A'}`);
    console.log(`   Description: ${metadata.description || 'N/A'}`);
    console.log(`   Severity: ${metadata.severity || 'N/A'}`);
    console.log(`   Incident ID: ${metadata.incidentId || 'N/A'}`);
    console.log(`   Oracle Verified: ${metadata.oracleVerified || false}`);
    console.log(`   Log URI: ${metadata.logUri ? metadata.logUri.substring(0, 50) + '...' : 'N/A'}`);

    // Download logs if available
    if (metadata.logUri && metadata.logUri.startsWith('0g://')) {
      console.log('\n📥 Downloading logs from 0G Storage...');
      const logsContent = await storage.downloadFromOG(metadata.logUri);
      
      console.log('✅ Logs downloaded successfully!\n');
      console.log('📝 Logs Preview (first 500 chars):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(logsContent.substring(0, 500));
      if (logsContent.length > 500) {
        console.log('\n... (' + (logsContent.length - 500) + ' more characters)');
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      console.log('\n✅ SUCCESS: Both metadata and logs fetched successfully!');
      console.log('   Frontend should now display:');
      console.log(`   - Title: "${metadata.name}"`);
      console.log(`   - Description: "${metadata.description}"`);
      console.log(`   - Logs: ${logsContent.length} bytes of error details`);
    } else if (metadata.logs) {
      console.log('\n📝 Logs (embedded in metadata):');
      console.log(metadata.logs.substring(0, 500));
    } else {
      console.log('\n⚠️  No logs found in metadata');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

testMetadataFetch();
