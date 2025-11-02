/**
 * Check 0G Compute Account Balance
 * Simple script to check current balance without making any transactions
 */

import "dotenv/config";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

async function checkBalance() {
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

    // Check wallet balance
    const walletBalance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet Balance: ${ethers.formatEther(walletBalance)} 0G`);

    console.log('\n🔧 Initializing 0G Compute Broker...');
    const broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Broker initialized');

    // Check compute account balance
    console.log('\n📊 Checking compute account status...');
    try {
      const account = await broker.ledger.getLedger();
      
      console.log('\n✅ Compute Account Details:');
      console.log(`   Address: ${account[0] || 'N/A'}`);
      
      // Parse balance
      let totalBalance = '0';
      let settledBalance = '0';
      
      if (account[1] !== undefined) {
        try {
          totalBalance = ethers.formatEther(account[1]);
        } catch {
          totalBalance = account[1].toString();
        }
      }
      
      if (account[2] !== undefined) {
        try {
          settledBalance = ethers.formatEther(account[2]);
        } catch {
          settledBalance = account[2].toString();
        }
      }
      
      console.log(`   Total Balance: ${totalBalance} 0G`);
      console.log(`   Settled Balance: ${settledBalance} 0G`);
      
      // Check if account has sufficient balance
      const balanceInWei = BigInt(account[1] || 0);
      const oneOGInWei = ethers.parseEther('1');
      
      if (balanceInWei >= oneOGInWei) {
        console.log('\n✅ Your compute account is funded and ready to use!');
        console.log('   You can start using 0G Compute Network.');
      } else {
        console.log('\n⚠️  Your compute account needs more funding');
        console.log(`   Current: ${totalBalance} 0G`);
        console.log(`   Recommended: At least 1.0 0G`);
        console.log(`   Shortfall: ${ethers.formatEther(oneOGInWei - balanceInWei)} 0G`);
      }

    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log('❌ No compute account found');
        console.log('   You need to create one first');
      } else {
        throw error;
      }
    }

    // List available services
    console.log('\n🔍 Available Compute Services:');
    const services = await broker.inference.listService();
    console.log(`   Found ${services.length} services\n`);

    if (services.length > 0) {
      // Sort by price (cheapest first)
      const sortedServices = [...services].sort((a, b) => {
        const priceA = BigInt(a.inputPrice || 0) + BigInt(a.outputPrice || 0);
        const priceB = BigInt(b.inputPrice || 0) + BigInt(b.outputPrice || 0);
        return priceA < priceB ? -1 : 1;
      });

      sortedServices.slice(0, 3).forEach((service, idx) => {
        console.log(`   [${idx + 1}] ${service.model}`);
        console.log(`       Provider: ${service.provider.substring(0, 10)}...`);
        console.log(`       Input: ${ethers.formatEther(service.inputPrice)} 0G/token`);
        console.log(`       Output: ${ethers.formatEther(service.outputPrice)} 0G/token`);
        console.log(`       Verifiable: ${service.verifiability || 'No'}`);
        console.log('');
      });
    }

    console.log('✅ Check complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

checkBalance();
