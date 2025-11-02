import "dotenv/config";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

/**
 * Proper 0G Compute Network Integration following official SDK documentation
 * https://docs.0g.ai/developer-hub/building-on-0g/compute-network/sdk
 */

let broker = null;
let isInitialized = false;

/**
 * Initialize the 0G Compute Broker with proper setup
 */
async function initializeBroker() {
  if (isInitialized && broker) {
    console.log('✅ Broker already initialized');
    return broker;
  }

  try {
    const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const PRIVATE_KEY = process.env.PRIVATE_KEY;

    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not set in environment');
    }

    console.log('🔧 Initializing 0G Compute Broker...');
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Create broker instance
    broker = await createZGComputeNetworkBroker(wallet);
    console.log(`✅ Broker initialized for ${wallet.address}`);

    // Check balance
    const account = await broker.ledger.getLedger();
    const balance = ethers.formatEther(account.totalBalance);
    console.log(`💰 Account balance: ${balance} 0G`);

    // Discover available services
    console.log('🔍 Discovering available services...');
    const services = await broker.inference.listService();
    console.log(`   Found ${services.length} available services`);

    if (services.length > 0) {
      services.forEach((service, idx) => {
        console.log(`   [${idx}] ${service.model} @ ${service.provider.substring(0, 10)}...`);
      });
    }

    isInitialized = true;
    return broker;
  } catch (error) {
    console.error('❌ Broker initialization failed:', error.message);
    throw error;
  }
}

/**
 * Query the 0G Compute Network
 * Uses proper SDK flow: initialize → discover → acknowledge → request
 */
export async function queryComputeNetwork(prompt) {
  try {
    // Ensure broker is initialized
    if (!broker || !isInitialized) {
      await initializeBroker();
    }

    console.log('🤖 Querying 0G Compute Network...');

    // Get available services
    const services = await broker.inference.listService();
    if (services.length === 0) {
      throw new Error('No compute services available');
    }

    // Prefer the cheapest active service so we stay within faucet balances
    const sortedServices = [...services].sort((a, b) => {
      const priceA = BigInt(a.inputPrice || 0) + BigInt(a.outputPrice || 0);
      const priceB = BigInt(b.inputPrice || 0) + BigInt(b.outputPrice || 0);
      return priceA === priceB ? 0 : priceA < priceB ? -1 : 1;
    });

    const service = sortedServices[0];
    const providerAddress = service.provider;

    console.log(`   Selected provider: ${service.model} (${providerAddress.substring(0, 10)}...)`);
    console.log(`   Input price: ${ethers.formatEther(service.inputPrice)} 0G per token`);
    console.log(`   Output price: ${ethers.formatEther(service.outputPrice)} 0G per token`);

    // Acknowledge provider (required before first use)
    try {
      console.log('   Acknowledging provider...');
      await broker.inference.acknowledgeProviderSigner(providerAddress);
      console.log('   ✅ Provider acknowledged');
    } catch (ackErr) {
      if (ackErr.message.includes('already acknowledged')) {
        console.log('   ℹ️  Provider already acknowledged');
      } else {
        throw ackErr;
      }
    }

    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Model: ${model}`);

    // Prepare the request
    const messages = [{ role: "user", content: prompt }];
    
    // Get authenticated headers for this request
    console.log('   Generating request headers...');
    const headers = await broker.inference.getRequestHeaders(
      providerAddress,
      JSON.stringify(messages)
    );

    // Send request to the service
    console.log('   Sending request...');
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({
        messages: messages,
        model: model
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let combinedMessage = `Request failed: ${response.status}`;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed.error) {
          combinedMessage += ` ${parsed.error}`;
        } else {
          combinedMessage += ` ${errorText}`;
        }
      } catch {
        combinedMessage += ` ${errorText}`;
      }

      if (combinedMessage.includes('insufficient inference account balance')) {
        combinedMessage += ' — deposit more 0G to your inference ledger with broker.ledger.depositFund(amount) or pick a cheaper service.';
      }

      throw new Error(combinedMessage.trim());
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0]) {
      throw new Error('Invalid response format');
    }

    const answer = data.choices[0].message.content;
    const chatID = data.id;

    // Verify response (for verifiable services)
    if (service.verifiability === 'TeeML' && chatID) {
      console.log('   Verifying response (TeeML)...');
      try {
        const isValid = await broker.inference.processResponse(
          providerAddress,
          answer,
          chatID
        );
        console.log(`   ✅ Response verified: ${isValid}`);
      } catch (verifyErr) {
        console.warn('   ⚠️ Could not verify response:', verifyErr.message);
      }
    }

    console.log('✅ 0G Compute request successful');
    return answer;

  } catch (error) {
    console.error('❌ 0G Compute request failed:', error.message);
    throw error;
  }
}

/**
 * Parse JSON response from LLM
 */
export function parseAnalysis(response) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse response as JSON:', error);
    throw new Error(`Invalid JSON response: ${response.substring(0, 100)}`);
  }
}

/**
 * Check if broker is available
 */
export function isBrokerAvailable() {
  return !!broker && isInitialized;
}

export default {
  initializeBroker,
  queryComputeNetwork,
  parseAnalysis,
  isBrokerAvailable,
  getBroker: () => broker
};
