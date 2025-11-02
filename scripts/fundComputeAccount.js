/**
 * Fund 0G Compute Account Script
 * 
 * This script adds funds to your 0G Compute ledger account
 * so you can use the 0G Compute Network services.
 */

import "dotenv/config";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

async function fundAccount() {
  try {
    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    if (!PRIVATE_KEY) {
      throw new Error('❌ PRIVATE_KEY not set in .env file');
    }

    console.log('🔧 Connecting to 0G Network...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`📍 Wallet Address: ${wallet.address}`);

    // Check wallet balance first
    const walletBalance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet Balance: ${ethers.formatEther(walletBalance)} 0G`);

    if (walletBalance < ethers.parseEther('2')) {
      console.log('⚠️  Warning: Low wallet balance. You need at least 2 OG to fund the compute account.');
      console.log('   Get testnet tokens from: https://faucet.0g.ai/');
    }

    console.log('\n🔧 Initializing 0G Compute Broker...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Broker initialized');

    // Check if account exists
    console.log('\n📊 Checking current compute account status...');
    try {
      const account = await broker.ledger.getLedger();
      console.log(`✅ Compute Account exists`);
      console.log(`   Account data:`, account);
      
      // Parse balance - it might be in different formats
      let currentBalance = '0';
      if (account.totalBalance) {
        try {
          currentBalance = ethers.formatEther(account.totalBalance);
        } catch {
          currentBalance = account.totalBalance.toString();
        }
      }
      console.log(`   Current Balance: ${currentBalance} 0G`);

      // Ask to deposit more
      const depositAmount = 1.5; // 1.5 OG (staying under wallet balance)
      console.log(`\n💳 Depositing ${depositAmount} 0G to compute account...`);
      console.log('   This may take a few seconds...');
      
      try {
        const tx = await broker.ledger.depositFund(depositAmount);
        console.log(`   Transaction submitted:`, tx.hash || tx);
        
        console.log('   Waiting for confirmation (15 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Check new balance
        const updatedAccount = await broker.ledger.getLedger();
        let newBalance = '0';
        if (updatedAccount.totalBalance) {
          try {
            newBalance = ethers.formatEther(updatedAccount.totalBalance);
          } catch {
            newBalance = updatedAccount.totalBalance.toString();
          }
        }
        console.log(`\n✅ Deposit successful!`);
        console.log(`   New Balance: ${newBalance} 0G`);
      } catch (depositErr) {
        console.error(`   ❌ Deposit failed:`, depositErr.message);
        throw depositErr;
      }

    } catch (error) {
      // Account doesn't exist, create it
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log('ℹ️  No existing compute account found');
        
        const initialAmount = 1.5; // 1.5 OG
        console.log(`\n💳 Creating new compute account with ${initialAmount} 0G...`);
        console.log('   This may take a few seconds...');
        
        try {
          const tx = await broker.ledger.addLedger(initialAmount);
          console.log(`   Transaction submitted:`, tx.hash || tx);
          
          console.log('   Waiting for confirmation (15 seconds)...');
          await new Promise(resolve => setTimeout(resolve, 15000));

          // Check new account
          const newAccount = await broker.ledger.getLedger();
          let balance = '0';
          if (newAccount.totalBalance) {
            try {
              balance = ethers.formatEther(newAccount.totalBalance);
            } catch {
              balance = newAccount.totalBalance.toString();
            }
          }
          console.log(`\n✅ Account created successfully!`);
          console.log(`   Balance: ${balance} 0G`);
        } catch (createErr) {
          console.error(`   ❌ Account creation failed:`, createErr.message);
          throw createErr;
        }
      } else {
        console.error('   Error details:', error);
        throw error;
      }
    }

    // List available services
    console.log('\n🔍 Discovering available compute services...');
    const services = await broker.inference.listService();
    console.log(`   Found ${services.length} services:\n`);

    services.forEach((service, idx) => {
      console.log(`   [${idx}] ${service.model}`);
      console.log(`       Provider: ${service.provider}`);
      console.log(`       Input Price: ${ethers.formatEther(service.inputPrice)} 0G per token`);
      console.log(`       Output Price: ${ethers.formatEther(service.outputPrice)} 0G per token`);
      console.log(`       Verifiability: ${service.verifiability || 'None'}`);
      console.log('');
    });

    console.log('\n✅ All done! Your 0G Compute account is funded and ready to use.');
    console.log('   Restart your backend to start using 0G Compute Network.\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('insufficient funds')) {
      const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
      const PRIVATE_KEY = process.env.PRIVATE_KEY;
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      
      console.log('\n💡 Solution: Get more testnet tokens from https://faucet.0g.ai/');
      console.log(`   Your wallet address: ${wallet.address}`);
      console.log(`   Request at least 2 OG tokens`);
    }
    
    process.exit(1);
  }
}

// Run the script
fundAccount();
