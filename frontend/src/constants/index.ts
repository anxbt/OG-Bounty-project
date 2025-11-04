// Network configuration
export const NETWORKS = {
  TESTNET: {
    name: '0G Galileo Testnet',
    chainId: 16602,
    rpcUrl: 'https://evmrpc-testnet.0g.ai',
    explorerUrl: 'https://chainscan-galileo.0g.ai',
    storageIndexer: 'https://indexer-storage-testnet.0g.ai',
    symbol: '0G',
    // Testnet contracts
    contracts: {
      inft: '0xeB18a3f355EA68f303eB06E8d7527773aCa6b398',
      oracle: '0x59bec759cbE4154626D98D86341E49759087b317',
      legacy: '0x455163a08a8E786730607C5B1CC4E587837a1F57'
    }
  },
  MAINNET: {
    name: '0G Mainnet',
    chainId: 16661,
    rpcUrl: 'https://evmrpc.0g.ai',
    explorerUrl: 'https://chainscan.0g.ai',
    storageIndexer: 'https://indexer-storage-turbo.0g.ai',
    symbol: '0G',
    // Mainnet contracts (Deployed Nov 3, 2025)
    contracts: {
      inft: '0xA75110a3d4DFA4F20B71ad87110a1A5FF3f58229',
      oracle: '0x00fF3A9d6850CdcE1f4920FB029c60568314B36E',
      legacy: ''
    }
  }
} as const;

// Default network (for fallback and initial load)
// Components should use useNetwork() hook for dynamic network selection
export const ACTIVE_NETWORK = NETWORKS.MAINNET; // Default: Mainnet

// Helper function to get network config (for use in components without context)
export function getActiveNetwork(): typeof NETWORKS.TESTNET | typeof NETWORKS.MAINNET {
  const saved = localStorage.getItem('activeNetwork');
  if (saved === 'TESTNET') return NETWORKS.TESTNET;
  if (saved === 'MAINNET') return NETWORKS.MAINNET;
  return ACTIVE_NETWORK; // fallback to default
}

// Backwards compatibility exports (use default/fallback values)
// Note: For dynamic values, components should use useNetwork() hook
const activeNetwork = getActiveNetwork();
export const INFT_CONTRACT_ADDRESS = activeNetwork.contracts.inft;
export const ORACLE_ADDRESS = activeNetwork.contracts.oracle;
export const LEGACY_CONTRACT_ADDRESS = activeNetwork.contracts.legacy;
export const CONTRACT_ADDRESS = INFT_CONTRACT_ADDRESS;
export const RPC_URL = activeNetwork.rpcUrl;
export const CHAIN_ID = activeNetwork.chainId;
export const EXPLORER_URL = activeNetwork.explorerUrl;

export const BACKEND_API_URL = 'http://localhost:8787';

export const SEVERITY_COLORS = {
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-500',
    badge: 'bg-red-600',
  },
  warning: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-500',
    badge: 'bg-orange-600',
  },
  info: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-500',
    badge: 'bg-blue-600',
  },
} as const;

export const CONTRACT_ABI = [
  // iNFT specific functions
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getMetadataHash",
    "outputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getEncryptedURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "executor", "type": "address"}
    ],
    "name": "UsageAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"indexed": false, "internalType": "bytes32", "name": "newHash", "type": "bytes32"}
    ],
    "name": "MetadataUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
      {"indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256"}
    ],
    "name": "Transfer",
    "type": "event"
  }
] as const;
