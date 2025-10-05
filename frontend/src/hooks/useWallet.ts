import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CHAIN_ID, RPC_URL } from '../constants';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  provider: ethers.BrowserProvider | null;
  isCorrectNetwork: boolean;
  isLoading: boolean;
}

// 0G Galileo testnet configuration
const OG_NETWORK = {
  chainId: `0x${CHAIN_ID.toString(16)}`, // 0x40DA (16602 in hex)
  chainName: '0G-Galileo-Testnet',
  nativeCurrency: {
    name: '0G',
    symbol: 'OG',
    decimals: 18,
  },
  rpcUrls: [RPC_URL],
  blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
};

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    provider: null,
    isCorrectNetwork: false,
    isLoading: false,
  });

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const network = await provider.getNetwork();
          const isCorrectNetwork = Number(network.chainId) === CHAIN_ID;
          
          setWallet({
            isConnected: true,
            address: accounts[0].address,
            provider,
            isCorrectNetwork,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install MetaMask to connect your wallet.');
      return false;
    }

    try {
      setWallet(prev => ({ ...prev, isLoading: true }));

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Check if we're on the correct network
      const network = await provider.getNetwork();
      const isCorrectNetwork = Number(network.chainId) === CHAIN_ID;

      setWallet({
        isConnected: true,
        address: accounts[0].address,
        provider,
        isCorrectNetwork,
        isLoading: false,
      });

      // If not on correct network, prompt to switch
      if (!isCorrectNetwork) {
        await switchToOGNetwork();
      }

      return true;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setWallet(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const switchToOGNetwork = async () => {
    if (typeof window.ethereum === 'undefined') return false;

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OG_NETWORK.chainId }],
      });

      // Update state after successful switch
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const isCorrectNetwork = Number(network.chainId) === CHAIN_ID;

      setWallet(prev => ({
        ...prev,
        isCorrectNetwork,
        provider,
      }));

      return true;
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [OG_NETWORK],
          });
          return true;
        } catch (addError) {
          console.error('Error adding network:', addError);
          return false;
        }
      }
      console.error('Error switching network:', switchError);
      return false;
    }
  };

  const disconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      provider: null,
      isCorrectNetwork: false,
      isLoading: false,
    });
  };

  // Listen for account/network changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          checkConnection();
        }
      };

      const handleChainChanged = () => {
        checkConnection();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    ...wallet,
    connectWallet,
    switchToOGNetwork,
    disconnectWallet,
  };
};