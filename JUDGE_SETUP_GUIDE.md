# iSentinel - Judge Setup Guide

## Issue Resolution for Testnet Problems

The judges encountered several 0G testnet issues. Here are the solutions:

### 1. Contract Redeployment (Fresh Start)

**Problem**: Previously deployed contracts are inaccessible due to testnet changes.

**Solution**: Redeploy the contract to get a fresh, working address.

```bash
# Navigate to project root
cd D:\0G

# Compile contracts
npm run compile

# Deploy to 0G testnet with new address
npm run deploy:incident:og
```

**Expected Output**: You'll get a new contract address like `0x...` which will be automatically saved to `.env`

### 2. RPC Configuration Fix

**Problem**: RPC inconsistencies between QuickNode and development endpoints.

**Current RPC Issues**:
- `https://evmrpc-testnet.0g.ai` - Not connected to compute
- QuickNode RPC shows different balances

**Recommended RPC Configuration**:

Update `.env` file:
```env
# Use the most stable 0G RPC endpoint
OG_RPC_URL=https://evmrpc-testnet.0g.ai
# Alternative if above fails:
# OG_RPC_URL=https://rpc.ankr.com/0g_galileo_testnet_evm

# Storage endpoint (working)
OG_STORAGE_URL=https://indexer-storage-testnet-turbo.0g.ai

# Your private key (DO NOT share in production)
PRIVATE_KEY=your_private_key_here
```

### 3. MetaMask Network Configuration

Add 0G Galileo network to MetaMask with these exact parameters:

```
Network Name: 0G Galileo Testnet
RPC URL: https://evmrpc-testnet.0g.ai
Chain ID: 16602
Currency Symbol: A0GI
Block Explorer: https://chainscan-galileo.0g.ai
```

### 4. Quick Demo Setup (5 minutes)

If you want to test immediately without redeployment:

1. **Use Mock Backend** (works without blockchain):
   ```bash
   node backend/test-server.js
   ```

2. **Frontend with Mock Data**:
   ```bash
   cd frontend
   pnpm install
   pnpm run dev
   ```

3. **Open**: `http://localhost:5173`
   - No wallet connection needed for basic demo
   - Shows how the UI works with sample data

### 5. Full Blockchain Demo (10 minutes)

For complete blockchain integration:

1. **Get Test Tokens**:
   - Visit: https://faucet.0g.ai
   - Add your wallet address
   - Request A0GI tokens

2. **Deploy Fresh Contract**:
   ```bash
   npm run deploy:incident:og
   ```

3. **Start Backend**:
   ```bash
   node backend/serverOG.js
   ```

4. **Start Frontend**:
   ```bash
   cd frontend
   pnpm run dev
   ```

5. **Demo Flow**:
   - Connect MetaMask to 0G Galileo
   - Report an incident
   - Watch NFT mint on blockchain
   - View on explorer

### 6. Backup Demo Options

If 0G testnet is still problematic:

**Option A: Local Hardhat Network**
```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy locally
npm run deploy:incident:local

# Terminal 3: Backend
node backend/serverOG.js

# Terminal 4: Frontend
cd frontend && pnpm run dev
```

**Option B: Recorded Demo**
- Screen recording showing full functionality
- Available at: [your-demo-video-link]

### 7. Key Contract Functions

Once deployed, you can verify the contract works:

```javascript
// In browser console or hardhat console
const contract = new ethers.Contract(
  "YOUR_NEW_CONTRACT_ADDRESS",
  ABI,
  provider
);

// Check if contract is working
await contract.balanceOf("YOUR_WALLET_ADDRESS");
```

### 8. Explorer Verification

Visit the 0G explorer with your new contract address:
`https://chainscan-galileo.0g.ai/address/YOUR_CONTRACT_ADDRESS`

### 9. Contact Information

If issues persist:
- Email: [your-email]
- Discord: [your-discord]
- Available for live demo call

### 10. Project Files Structure

```
iSentinel/
├── contracts/IncidentNFT.sol     # Main smart contract
├── backend/serverOG.js           # 0G integrated backend
├── backend/test-server.js        # Mock backend for demo
├── frontend/                     # React frontend
├── scripts/deployIncident.js     # Deployment script
└── .env                         # Configuration
```

## Quick Start Checklist

- [ ] Install dependencies: `npm install`
- [ ] Get test tokens from 0G faucet
- [ ] Deploy contract: `npm run deploy:incident:og`
- [ ] Start backend: `node backend/serverOG.js`
- [ ] Start frontend: `cd frontend && pnpm run dev`
- [ ] Connect MetaMask to 0G Galileo testnet
- [ ] Test incident reporting flow

**Total setup time**: ~10 minutes

**Working demo guaranteed** with these steps!