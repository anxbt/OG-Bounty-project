// 0G iNFT Contract (with Oracle integration)
export const INFT_CONTRACT_ADDRESS = '0x5Ea36756B36dd41622b9C41FcD1a137f96954A06';
export const ORACLE_ADDRESS = '0x84c8542d439dA3cA5CaBE76b303444f66f190Db5';

// Legacy contract (standard ERC721)
export const LEGACY_CONTRACT_ADDRESS = '0x455163a08a8E786730607C5B1CC4E587837a1F57';

// Use iNFT by default
export const CONTRACT_ADDRESS = INFT_CONTRACT_ADDRESS;

export const RPC_URL = 'https://evmrpc-testnet.0g.ai';
export const CHAIN_ID = 16602;
export const EXPLORER_URL = 'https://chainscan-galileo.0g.ai';

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
