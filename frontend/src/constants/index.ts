export const CONTRACT_ADDRESS = '0x455163a08a8E786730607C5B1CC4E587837a1F57';
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
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "getIncident",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "incidentId", "type": "string"},
          {"internalType": "bytes32", "name": "logHash", "type": "bytes32"},
          {"internalType": "uint8", "name": "severity", "type": "uint8"},
          {"internalType": "uint64", "name": "timestamp", "type": "uint64"}
        ],
        "internalType": "struct IncidentNFT.Incident",
        "name": "",
        "type": "tuple"
      },
      {"internalType": "string", "name": "", "type": "string"}
    ],
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
      {"indexed": false, "internalType": "string", "name": "incidentId", "type": "string"},
      {"indexed": false, "internalType": "string", "name": "logHash", "type": "string"},
      {"indexed": false, "internalType": "uint8", "name": "severity", "type": "uint8"},
      {"indexed": false, "internalType": "string", "name": "tokenURI", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "IncidentMinted",
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
