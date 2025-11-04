import { NETWORKS } from '../constants';
import { useNetwork } from '../contexts/NetworkContext';
import { Wifi, WifiOff, Power, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NetworkIndicator() {
  const { networkConfig } = useNetwork();
  const [isConnected, setIsConnected] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');

  useEffect(() => {
    checkConnection();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        checkConnection();
      });
      
      window.ethereum.on('accountsChanged', () => {
        checkConnection();
      });
    }
  }, []);

  const checkConnection = async () => {
    if (!window.ethereum) {
      setIsConnected(false);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      setIsConnected(accounts.length > 0);
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        setWalletAddress('');
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdNum = parseInt(chainId, 16);
      setCurrentChainId(chainIdNum);
      
      // Check if on wrong network
      setIsWrongNetwork(chainIdNum !== networkConfig.chainId);
    } catch (error) {
      console.error('Failed to check connection:', error);
      setIsConnected(false);
      setWalletAddress('');
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this feature');
      return;
    }

    try {
      console.log('🔌 Attempting to connect wallet...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('✅ Wallet connected:', accounts[0]);
      await checkConnection();
      console.log('📊 Current chain ID:', currentChainId);
      console.log('🎯 Expected chain ID:', networkConfig.chainId);
    } catch (error) {
      console.error('❌ Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setCurrentChainId(null);
    // Note: MetaMask doesn't have a programmatic disconnect, 
    // but we can clear our state
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${networkConfig.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${networkConfig.chainId.toString(16)}`,
                chainName: networkConfig.name,
                nativeCurrency: {
                  name: networkConfig.symbol,
                  symbol: networkConfig.symbol,
                  decimals: 18,
                },
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
    }
  };

  const isTestnet = networkConfig.chainId === NETWORKS.TESTNET.chainId;
  const isMainnet = !isTestnet; // If not testnet, it's mainnet

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown';
    if (chainId === NETWORKS.TESTNET.chainId) return NETWORKS.TESTNET.name;
    if (chainId === NETWORKS.MAINNET.chainId) return NETWORKS.MAINNET.name;
    return `Chain ${chainId}`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Expected Network badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all ${
          isTestnet
            ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
            : 'bg-green-50 border-green-400 text-green-800'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${
            isTestnet ? 'bg-yellow-500' : 'bg-green-500'
          }`}
        />
        <span className="font-semibold text-sm">
          {networkConfig.name}
        </span>
        {isTestnet && (
          <span className="ml-1 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full font-bold">
            TEST
          </span>
        )}
        {isMainnet && (
          <span className="ml-1 px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-bold">
            LIVE
          </span>
        )}
      </div>

      {/* Wallet Connection Status */}
      {!isConnected ? (
        <button
          onClick={connectWallet}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-white/30 bg-white/10 hover:bg-white/20 text-white transition-all font-medium"
        >
          <Wallet className="w-4 h-4" />
          <span className="text-sm">Connect</span>
        </button>
      ) : (
        <>
          {/* Current Network (if different from expected) */}
          {isWrongNetwork && currentChainId && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-orange-400 bg-orange-50 text-orange-800">
              <WifiOff className="w-4 h-4" />
              <div className="flex flex-col">
                <span className="text-xs font-medium">
                  Wallet: {getNetworkName(currentChainId)}
                </span>
                <span className="text-xs opacity-75">
                  Expected: {networkConfig.name}
                </span>
              </div>
              <button
                onClick={switchNetwork}
                className="ml-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors font-medium"
              >
                Switch to {networkConfig.name.includes('Mainnet') ? 'Mainnet' : 'Testnet'}
              </button>
            </div>
          )}

          {/* Connected Status with Address */}
          {!isWrongNetwork && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-white/30 bg-white/10 text-white">
              <Wifi className="w-4 h-4" />
              {walletAddress && (
                <span className="font-mono text-xs">
                  {formatAddress(walletAddress)}
                </span>
              )}
            </div>
          )}

          {/* Disconnect Button */}
          <button
            onClick={disconnectWallet}
            className="p-1.5 rounded-lg border-2 border-white/30 bg-white/10 hover:bg-red-500/80 text-white transition-all"
            title="Disconnect Wallet"
          >
            <Power className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
