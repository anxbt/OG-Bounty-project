/**
 * Find Token IDs by trying sequential IDs
 * Since we know balance is 2, we can find which tokens are owned
 */

import { ethers } from 'ethers';
import 'dotenv/config';

const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CONTRACT_ADDRESS = process.env.INFT_ADDRESS || '0x5Ea36756B36dd41622b9C41FcD1a137f96954A06';

const ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getEncryptedURI(uint256 tokenId) view returns (string)"
];

async function main() {
  console.log('🔍 Finding Token IDs...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
  
  const privateKey = process.env.PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey);
  const targetAddress = wallet.address;
  
  console.log(`👤 Looking for NFTs owned by: ${targetAddress}\n`);
  console.log('🔎 Checking token IDs 0-100...\n');
  
  const ownedTokens = [];
  
  for (let tokenId = 0; tokenId <= 100; tokenId++) {
    try {
      const owner = await contract.ownerOf(tokenId);
      
      if (owner.toLowerCase() === targetAddress.toLowerCase()) {
        console.log(`✅ Found Token ID ${tokenId}`);
        console.log(`   Owner: ${owner}`);
        
        // Try to get tokenURI
        try {
          const uri = await contract.tokenURI(tokenId);
          console.log(`   Token URI: ${uri.substring(0, 80)}${uri.length > 80 ? '...' : ''}`);
        } catch (err) {
          console.log(`   Token URI: Unable to fetch`);
        }
        
        // Try encrypted URI
        try {
          const encUri = await contract.getEncryptedURI(tokenId);
          if (encUri) {
            console.log(`   Encrypted URI: ${encUri.substring(0, 80)}${encUri.length > 80 ? '...' : ''}`);
          }
        } catch (err) {
          // Ignore
        }
        
        console.log();
        ownedTokens.push(tokenId);
      }
    } catch (err) {
      // Token doesn't exist or error, skip
      if (!err.message.includes('nonexistent') && !err.message.includes('invalid')) {
        // console.log(`   Token ${tokenId}: ${err.message}`);
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Found ${ownedTokens.length} NFTs: ${ownedTokens.join(', ')}`);
  
  if (ownedTokens.length === 0) {
    console.log('\n⚠️  No tokens found in range 0-100');
    console.log('   Try expanding the search range or checking contract address');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
