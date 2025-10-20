/**
 * NFT Debugging Script
 * 
 * This script helps diagnose why previously minted NFTs aren't showing up
 * Run with: node scripts/debugNFTs.js
 */

import { ethers } from 'ethers';
import 'dotenv/config';

// Configuration
const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CONTRACT_ADDRESS = process.env.INFT_ADDRESS || '0x5Ea36756B36dd41622b9C41FcD1a137f96954A06';

// Minimal ABI for testing
const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getEncryptedURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

async function main() {
  console.log('🔍 NFT Debugging Tool\n');
  console.log('Configuration:');
  console.log(`  RPC URL: ${RPC_URL}`);
  console.log(`  Contract: ${CONTRACT_ADDRESS}\n`);

  // Connect to provider
  console.log('📡 Connecting to 0G testnet...');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Connected to chain ID: ${network.chainId}\n`);
  } catch (error) {
    console.error('❌ Failed to connect to RPC:', error.message);
    process.exit(1);
  }

  // Create contract instance
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  // Step 1: Get deployer address from env
  const privateKey = process.env.PRIVATE_KEY;
  let deployerAddress = 'unknown';
  if (privateKey) {
    const wallet = new ethers.Wallet(privateKey);
    deployerAddress = wallet.address;
  }
  console.log(`👤 Deployer Address: ${deployerAddress}`);

  // Step 2: Check balance
  try {
    console.log('\n📊 Checking NFT balance...');
    const balance = await contract.balanceOf(deployerAddress);
    console.log(`✅ Balance: ${balance.toString()} NFTs owned`);
    
    if (balance === 0n) {
      console.log('\n⚠️  No NFTs found for this address.');
      console.log('   This could mean:');
      console.log('   1. NFTs were minted to a different address');
      console.log('   2. NFTs haven\'t been minted yet');
      console.log('   3. Contract address is wrong');
    }
  } catch (error) {
    console.error('❌ Failed to get balance:', error.message);
  }

  // Step 3: Query Transfer events
  console.log('\n🔎 Querying Transfer events (minting)...');
  try {
    const latestBlock = await provider.getBlockNumber();
    console.log(`   Latest block: ${latestBlock}`);
    console.log(`   Querying blocks ${latestBlock - 300000} to ${latestBlock}`);
    console.log(`   (This may take a minute...)`);
    
    const filter = contract.filters.Transfer(ethers.ZeroAddress, null, null);
    const events = await contract.queryFilter(filter, -300000); // Last 300k blocks (~10 days)
    
    console.log(`✅ Found ${events.length} minting events\n`);
    
    if (events.length === 0) {
      console.log('⚠️  No Transfer events found.');
      console.log('   Possible reasons:');
      console.log('   1. Wrong contract address');
      console.log('   2. NFTs were minted >300k blocks ago (~10 days)');
      console.log('   3. No NFTs have been minted yet');
      return;
    }

    // Step 4: Analyze each NFT
    console.log('📋 NFT Details:\n');
    for (const event of events) {
      const [from, to, tokenId] = event.args;
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`🎫 Token ID: ${tokenId.toString()}`);
      console.log(`   Minted to: ${to}`);
      console.log(`   TX Hash: ${event.transactionHash}`);
      console.log(`   Block: ${event.blockNumber}`);
      
      // Get block timestamp
      try {
        const block = await event.getBlock();
        const date = new Date(block.timestamp * 1000);
        console.log(`   Date: ${date.toLocaleString()}`);
      } catch (err) {
        console.log(`   Date: Unable to fetch`);
      }

      // Check current owner
      try {
        const owner = await contract.ownerOf(tokenId);
        console.log(`   Current Owner: ${owner}`);
        
        if (owner.toLowerCase() !== to.toLowerCase()) {
          console.log(`   ⚠️  NFT was transferred!`);
        }
      } catch (err) {
        console.log(`   Current Owner: ❌ Unable to fetch (may be burned)`);
      }

      // Try to get tokenURI
      try {
        const tokenURI = await contract.tokenURI(tokenId);
        console.log(`   Token URI: ${tokenURI.substring(0, 60)}${tokenURI.length > 60 ? '...' : ''}`);
        
        if (tokenURI.startsWith('0g://')) {
          console.log(`   📦 Stored on 0G Storage`);
        }
      } catch (err) {
        console.log(`   Token URI: ❌ Unable to fetch`);
      }

      // Try to get encrypted URI (iNFT specific)
      try {
        const encryptedURI = await contract.getEncryptedURI(tokenId);
        if (encryptedURI) {
          console.log(`   🔐 Encrypted URI: ${encryptedURI.substring(0, 60)}${encryptedURI.length > 60 ? '...' : ''}`);
        }
      } catch (err) {
        // This is fine, old contracts don't have this
      }

      console.log();
    }

    // Step 5: Summary
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('\n📊 Summary:');
    console.log(`   Total NFTs minted: ${events.length}`);
    console.log(`   Contract Address: ${CONTRACT_ADDRESS}`);
    console.log(`   Latest Block: ${latestBlock}`);
    
    // Check if any were minted to the deployer
    const mintedToDeployer = events.filter(e => e.args[1].toLowerCase() === deployerAddress.toLowerCase());
    console.log(`   NFTs minted to you: ${mintedToDeployer.length}`);

  } catch (error) {
    console.error('\n❌ Error querying events:', error.message);
    console.error('   Full error:', error);
  }

  // Step 6: Frontend compatibility check
  console.log('\n🔧 Frontend Compatibility:');
  console.log('   Your frontend should:');
  console.log('   1. Query Transfer(address(0), null, null) events');
  console.log('   2. Use contract address: ' + CONTRACT_ADDRESS);
  console.log('   3. Call tokenURI(tokenId) for each NFT');
  console.log('   4. Download metadata from 0G Storage if URI starts with "0g://"');
  console.log('\n   Check browser console for errors when loading dashboard.');
}

main()
  .then(() => {
    console.log('\n✅ Debugging complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
