import { NETWORKS } from '../constants';

export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  storageIndexer: string;
  symbol: string;
}

/**
 * Add 0G network to MetaMask
 */
export async function addNetworkToWallet(network: NetworkConfig): Promise<boolean> {
  if (!window.ethereum) {
    console.error('MetaMask is not installed');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${network.chainId.toString(16)}`,
          chainName: network.name,
          nativeCurrency: {
            name: network.symbol,
            symbol: network.symbol,
            decimals: 18,
          },
          rpcUrls: [network.rpcUrl],
          blockExplorerUrls: [network.explorerUrl],
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('Failed to add network:', error);
    return false;
  }
}

/**
 * Switch to specific 0G network
 */
export async function switchToNetwork(network: NetworkConfig): Promise<boolean> {
  if (!window.ethereum) {
    console.error('MetaMask is not installed');
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${network.chainId.toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      return await addNetworkToWallet(network);
    }
    console.error('Failed to switch network:', switchError);
    return false;
  }
}

/**
 * Get current network from wallet
 */
export async function getCurrentNetwork(): Promise<number | null> {
  if (!window.ethereum) return null;

  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Failed to get current network:', error);
    return null;
  }
}

/**
 * Check if wallet is on correct network
 */
export async function isOnCorrectNetwork(expectedChainId: number): Promise<boolean> {
  const currentChainId = await getCurrentNetwork();
  return currentChainId === expectedChainId;
}

/**
 * Add all 0G networks to wallet (both testnet and mainnet)
 */
export async function addAllNetworks(): Promise<void> {
  console.log('Adding 0G networks to wallet...');
  
  // Add Testnet
  const testnetAdded = await addNetworkToWallet(NETWORKS.TESTNET);
  if (testnetAdded) {
    console.log('✅ 0G Testnet added to wallet');
  }
  
  // Add Mainnet
  const mainnetAdded = await addNetworkToWallet(NETWORKS.MAINNET);
  if (mainnetAdded) {
    console.log('✅ 0G Mainnet added to wallet');
  }
}

/**
 * Format network details for display
 */
export function formatNetworkDetails(network: NetworkConfig): string {
  return `
Network Name: ${network.name}
Chain ID: ${network.chainId}
Token Symbol: ${network.symbol}
RPC URL: ${network.rpcUrl}
Storage Indexer: ${network.storageIndexer}
Block Explorer: ${network.explorerUrl}
  `.trim();
}
