import { Wallet, AlertTriangle, ExternalLink, Power } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { EXPLORER_URL } from '../constants';

export default function WalletConnection() {
  const { 
    isConnected, 
    address, 
    isCorrectNetwork, 
    isLoading,
    connectWallet, 
    switchToOGNetwork,
    disconnectWallet 
  } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-blue-700">Connecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span className="text-orange-700 text-sm">Wrong Network</span>
        </div>
        <button
          onClick={switchToOGNetwork}
          className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Switch to 0G
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Connected Status */}
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="text-green-700 text-sm font-medium">0G Testnet</span>
      </div>

      {/* Address Display */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
        <Wallet className="w-4 h-4 text-gray-600" />
        <span className="text-gray-700 font-mono text-sm">
          {formatAddress(address!)}
        </span>
        <a
          href={`${EXPLORER_URL}/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnectWallet}
        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Disconnect Wallet"
      >
        <Power className="w-4 h-4" />
      </button>
    </div>
  );
}