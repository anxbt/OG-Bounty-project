import { CHAIN_ID, RPC_URL } from '../constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const connectWallet = async (): Promise<string | null> => {
  if (typeof window.ethereum === 'undefined') {
    alert('Please install MetaMask to connect your wallet');
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    await switchToZGNetwork();

    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
};

export const switchToZGNetwork = async (): Promise<boolean> => {
  if (typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${CHAIN_ID.toString(16)}`,
              chainName: '0G-Galileo-Testnet',
              nativeCurrency: {
                name: '0G',
                symbol: 'OG',
                decimals: 18,
              },
              rpcUrls: [RPC_URL],
              blockExplorerUrls: ['https://chainscan-galileo.0g.ai'],
            },
          ],
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

export const getConnectedAccount = async (): Promise<string | null> => {
  if (typeof window.ethereum === 'undefined') {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting account:', error);
    return null;
  }
};

export const truncateAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
