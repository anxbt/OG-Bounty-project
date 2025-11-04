import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NETWORKS } from '../constants';

type NetworkType = 'TESTNET' | 'MAINNET';

interface NetworkContextType {
  activeNetwork: NetworkType;
  setActiveNetwork: (network: NetworkType) => void;
  networkConfig: typeof NETWORKS.TESTNET | typeof NETWORKS.MAINNET;
  isTestnet: boolean;
  isMainnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
  defaultNetwork?: NetworkType;
}

export function NetworkProvider({ children, defaultNetwork = 'MAINNET' }: NetworkProviderProps) {
  // Load from localStorage or use default
  const [activeNetwork, setActiveNetworkState] = useState<NetworkType>(() => {
    const saved = localStorage.getItem('activeNetwork');
    return (saved as NetworkType) || defaultNetwork;
  });

  // Update localStorage when network changes
  useEffect(() => {
    localStorage.setItem('activeNetwork', activeNetwork);
    console.log(`🌐 Network switched to: ${activeNetwork}`);
  }, [activeNetwork]);

  const setActiveNetwork = (network: NetworkType) => {
    setActiveNetworkState(network);
  };

  const networkConfig = NETWORKS[activeNetwork];
  const isTestnet = activeNetwork === 'TESTNET';
  const isMainnet = activeNetwork === 'MAINNET';

  const value: NetworkContextType = {
    activeNetwork,
    setActiveNetwork,
    networkConfig,
    isTestnet,
    isMainnet,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
