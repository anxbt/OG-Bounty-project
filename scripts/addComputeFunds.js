/**
 * Add Funds to 0G Compute Account (Testnet)
 * Adds 0.5 OG to your compute account for more queries
 */

import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import dotenv from 'dotenv';

dotenv.config();

const TESTNET_RPC = 'https://evmrpc-testnet.0g.ai';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const AMOUNT_TO_ADD = 0.5; // 0G tokens to add

async function addFunds() {
  console.log('\n💰 Adding Funds to Compute Account\n');
  console.log('='.repeat(60));

  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file');
    process.exit(1);
  }

  try {
    const provider = new ethers.JsonRpcProvider(TESTNET_RPC);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📍 Wallet: ${wallet.address}`);
    
    // Check wallet balance first
    const balance = await provider.getBalance(wallet.address);
    const balanceInOG = parseFloat(ethers.formatEther(balance));
    console.log(`💵 Wallet Balance: ${balanceInOG.toFixed(4)} 0G`);
    
    if (balanceInOG < AMOUNT_TO_ADD) {
      console.error(`\n❌ Insufficient wallet balance!`);
      console.log(`   Need: ${AMOUNT_TO_ADD} 0G`);
      console.log(`   Have: ${balanceInOG.toFixed(4)} 0G`);
      console.log(`\n💡 Get testnet tokens from: https://faucet.0g.ai`);
      process.exit(1);
    }
    
    console.log('\n🔧 Initializing compute broker...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Broker initialized');
    
    // Check current balance
    let currentBalance = 0;
    try {
      const account = await broker.ledger.getLedger();
      currentBalance = parseFloat(ethers.formatEther(account.totalBalance));
      console.log(`📊 Current Compute Balance: ${currentBalance.toFixed(4)} 0G`);
    } catch (error) {
      if (error.message.includes('Account does not exist')) {
        console.log('📝 Account does not exist yet, will create it...');
      } else {
        throw error;
      }
    }
    
    // Add funds
    console.log(`\n💸 Adding ${AMOUNT_TO_ADD} 0G to compute account...`);
    console.log('⏳ Please wait, this may take 10-30 seconds...');
    
    await broker.ledger.addLedger(AMOUNT_TO_ADD);
    
    // Check new balance
    const newAccount = await broker.ledger.getLedger();
    const newBalance = parseFloat(ethers.formatEther(newAccount.totalBalance));
    
    console.log('\n✅ Funds added successfully!');
    console.log(`📊 New Balance: ${newBalance.toFixed(4)} 0G`);
    console.log(`📈 Added: ${(newBalance - currentBalance).toFixed(4)} 0G`);
    
    // Estimate queries
    const estimatedQueries = Math.floor(newBalance * 1000);
    console.log(`🎯 Estimated Queries: ~${estimatedQueries} queries`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All done! Your compute account is funded.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('could not decode result data')) {
      console.log('\n💡 You might be on mainnet. Compute only works on testnet.');
      console.log('   Switch to testnet using the UI Mode button.');
    } else if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Get more testnet 0G from: https://faucet.0g.ai');
    }
    
    process.exit(1);
  }
}

console.log('⚠️  WARNING: This will add 0.5 0G to your compute account on TESTNET');
console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  addFunds();
}, 3000);
