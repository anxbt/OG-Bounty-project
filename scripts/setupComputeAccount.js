/**
 * Setup 0G Compute Account
 * This script creates your account and adds funds to use 0G Compute
 */

import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

async function setupAccount() {
  console.log('\n🔧 Setting up 0G Compute Account...\n');

  if (!PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not found in .env file');
    console.log('   Please add your private key to .env:');
    console.log('   PRIVATE_KEY=your_private_key_here');
    process.exit(1);
  }

  try {
    // Initialize wallet and provider
    console.log('📡 Connecting to 0G Network...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`   Wallet Address: ${wallet.address}`);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    const balanceInOG = ethers.formatEther(balance);
    console.log(`   Wallet Balance: ${balanceInOG} OG\n`);
    
    if (parseFloat(balanceInOG) < 0.1) {
      console.log('⚠️  Warning: Low wallet balance!');
      console.log('   You need OG tokens to create an account and add funds.');
      console.log('   Get testnet OG from: https://faucet.0g.ai');
      console.log('   Or ask in Discord: https://discord.gg/0glabs\n');
    }

    // Initialize broker
    console.log('🔧 Initializing 0G Compute Broker...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Broker initialized\n');

    // Check if account exists
    console.log('📊 Checking account status...');
    try {
      const account = await broker.ledger.getLedger();
      const computeBalance = ethers.formatEther(account.totalBalance);
      
      console.log('✅ Account already exists!');
      console.log(`   Compute Balance: ${computeBalance} OG`);
      
      if (parseFloat(computeBalance) < 0.01) {
        console.log('\n💰 Adding funds to compute account...');
        await broker.ledger.addLedger(0.1);  // Add 0.1 OG token
        
        const newAccount = await broker.ledger.getLedger();
        const newBalance = ethers.formatEther(newAccount.totalBalance);
        console.log(`✅ Added funds! New balance: ${newBalance} OG`);
      }
      
    } catch (error) {
      if (error.message.includes('Account does not exist')) {
        console.log('📝 Account does not exist yet. Creating...\n');
        
        // Add funds will automatically create the account
        console.log('💰 Creating account by adding 0.1 OG...');
        await broker.ledger.addLedger(0.1);  // Add 0.1 OG (enough for ~100 queries)
        
        const account = await broker.ledger.getLedger();
        const computeBalance = ethers.formatEther(account.totalBalance);
        
        console.log('✅ Account created successfully!');
        console.log(`   Compute Balance: ${computeBalance} OG`);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Setup Complete!');
    console.log('\nNext steps:');
    console.log('1. Restart your backend: node backend/serverOG.js');
    console.log('2. Check for: "✅ 0G Compute Broker initialized"');
    console.log('3. Open Analytics Dashboard and see real AI insights!\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution:');
      console.log('   Get testnet OG tokens from: https://faucet.0g.ai');
      console.log('   You need at least 0.1 OG to create a compute account');
    } else if (error.message.includes('nonce')) {
      console.log('\n💡 Solution:');
      console.log('   Wait a few seconds and try again');
    } else {
      console.log('\n💡 For help:');
      console.log('   Join Discord: https://discord.gg/0glabs');
    }
    
    process.exit(1);
  }
}

setupAccount();
