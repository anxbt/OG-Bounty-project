import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { NetworkProvider } from './contexts/NetworkContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NetworkProvider defaultNetwork="MAINNET">
      <App />
    </NetworkProvider>
  </StrictMode>
);
