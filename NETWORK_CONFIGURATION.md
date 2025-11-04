# 0G Network Configuration Guide

## Overview

iSentinel supports both **0G Galileo Testnet** and **0G Mainnet**. This guide explains how to configure and switch between networks.

---

## Network Details

### 🟡 0G Galileo Testnet (Default)

| Property | Value |
|----------|-------|
| **Network Name** | 0G Galileo Testnet |
| **Chain ID** | `16602` |
| **Token Symbol** | 0G |
| **RPC URL** | `https://evmrpc-testnet.0g.ai` |
| **Storage Indexer** | `https://indexer-storage-testnet.0g.ai` |
| **Block Explorer** | `https://chainscan-galileo.0g.ai` |
| **Faucet** | `https://faucet.0g.ai` |

**Deployed Contracts (Testnet):**
- INFT Contract: `0xeB18a3f355EA68f303eB06E8d7527773aCa6b398`
- Oracle: `0x59bec759cbE4154626D98D86341E49759087b317`

### 🟢 0G Mainnet

| Property | Value |
|----------|-------|
| **Network Name** | 0G Mainnet |
| **Chain ID** | `16661` |
| **Token Symbol** | 0G |
| **RPC URL** | `https://evmrpc.0g.ai` |
| **Storage Indexer** | `https://indexer-storage-turbo.0g.ai` |
| **Block Explorer** | `https://chainscan.0g.ai` |

**Deployed Contracts (Mainnet):**
- INFT Contract: _Not deployed yet_
- Oracle: _Not deployed yet_

---

## Adding Networks to MetaMask

### Method 1: Automatic (Using iSentinel UI)

1. Open the iSentinel app
2. Click the **Network Indicator** in the top-right corner
3. If prompted, click **"Add Network"** or **"Switch Network"**
4. MetaMask will open and ask for confirmation

### Method 2: Manual Configuration

#### Add 0G Testnet to MetaMask

1. Open MetaMask
2. Click on the network dropdown (top of MetaMask)
3. Click "Add Network"
4. Click "Add a network manually"
5. Enter the following details:

```
Network Name: 0G Galileo Testnet
RPC URL: https://evmrpc-testnet.0g.ai
Chain ID: 16602
Currency Symbol: 0G
Block Explorer URL: https://chainscan-galileo.0g.ai
```

6. Click "Save"

#### Add 0G Mainnet to MetaMask

1. Follow the same steps as testnet
2. Use these details instead:

```
Network Name: 0G Mainnet
RPC URL: https://evmrpc.0g.ai
Chain ID: 16661
Currency Symbol: 0G
Block Explorer URL: https://chainscan.0g.ai
```

---

## Switching Networks in iSentinel

### Frontend Configuration

The active network is configured in `frontend/src/constants/index.ts`:

```typescript
// Select active network (change this to switch networks)
export const ACTIVE_NETWORK = NETWORKS.TESTNET; // or NETWORKS.MAINNET
```

**To switch to mainnet:**
```typescript
export const ACTIVE_NETWORK = NETWORKS.MAINNET;
```

### Backend Configuration

The backend automatically uses the network specified in `.env`:

```bash
# In .env file
NETWORK=testnet  # Change to 'mainnet' for mainnet

# Or set specific RPC directly
OG_RPC_URL=https://evmrpc-testnet.0g.ai  # Testnet
# OG_RPC_URL=https://evmrpc.0g.ai  # Mainnet
```

---

## Deploying to Mainnet

### Prerequisites

1. ✅ Sufficient 0G tokens for gas (see [MAINNET_COST_ANALYSIS.md](./MAINNET_COST_ANALYSIS.md))
2. ✅ Compiled contracts: `npx hardhat compile`
3. ✅ Tested on testnet
4. ✅ Private key in `.env` file

### Deployment Steps

1. **Set mainnet RPC in `.env`:**
   ```bash
   OG_RPC_URL=https://evmrpc.0g.ai
   PRIVATE_KEY=your_mainnet_private_key
   ```

2. **Deploy contracts:**
   ```bash
   node scripts/deployINFT.js --network og-mainnet
   ```

3. **Update contract addresses:**
   ```typescript
   // In frontend/src/constants/index.ts
   MAINNET: {
     contracts: {
       inft: '0xYOUR_DEPLOYED_ADDRESS',
       oracle: '0xYOUR_ORACLE_ADDRESS',
       legacy: ''
     }
   }
   ```

4. **Switch frontend to mainnet:**
   ```typescript
   export const ACTIVE_NETWORK = NETWORKS.MAINNET;
   ```

5. **Restart frontend:**
   ```bash
   cd frontend
   pnpm run dev
   ```

---

## Network Indicator Features

The **Network Indicator** (top-right corner) shows:

- 🟡 Yellow badge = Testnet (with "TEST" label)
- 🟢 Green badge = Mainnet (with "LIVE" label)
- ✅ Blue badge = Wallet connected
- ❌ Red badge = Wrong network (click to switch)
- ℹ️ Info button = Network details tooltip

### Indicator States

| Badge | Meaning | Action |
|-------|---------|--------|
| 🟡 TEST | On testnet | Normal operation |
| 🟢 LIVE | On mainnet | **Use caution - real funds!** |
| ❌ Wrong Network | Wallet on different chain | Click to switch networks |
| ⚡ Connected | Wallet connected | Click info for details |

---

## Troubleshooting

### "Wrong Network" Warning

**Problem:** Wallet is connected to a different network than the app expects.

**Solution:**
1. Click the red "Wrong Network" badge
2. Click "Switch Network" when prompted
3. Approve in MetaMask

### "Network Not Found" Error

**Problem:** 0G network not added to MetaMask.

**Solution:**
1. Click the network indicator
2. Click "Add Network" in MetaMask popup
3. Or manually add using instructions above

### Can't Connect to RPC

**Problem:** Unable to connect to 0G RPC endpoint.

**Solutions:**
1. Check your internet connection
2. Try alternative RPC endpoints (if available)
3. Check 0G network status: https://status.0g.ai
4. Clear browser cache and reload

### Contract Not Found on Mainnet

**Problem:** Trying to use app on mainnet before deployment.

**Solution:**
1. Deploy contracts to mainnet first (see Deployment Steps above)
2. Or switch back to testnet:
   ```typescript
   export const ACTIVE_NETWORK = NETWORKS.TESTNET;
   ```

---

## Best Practices

### For Development
- ✅ Always use **Testnet** for development and testing
- ✅ Get free testnet tokens from the faucet
- ✅ Test all features thoroughly before mainnet
- ✅ Use separate wallet for testnet (never use mainnet wallet on testnet)

### For Production
- ⚠️ Deploy to **Mainnet** only when fully tested
- ⚠️ Double-check all contract addresses
- ⚠️ Start with small transactions to verify
- ⚠️ Monitor gas costs (see [MAINNET_COST_ANALYSIS.md](./MAINNET_COST_ANALYSIS.md))
- ⚠️ Keep private keys secure (never commit to git)

---

## Environment Variables Reference

```bash
# Network Selection
NETWORK=testnet                              # or 'mainnet'

# Testnet Configuration
OG_TESTNET_RPC_URL=https://evmrpc-testnet.0g.ai
OG_TESTNET_CHAIN_ID=16602
TESTNET_INFT_ADDRESS=0xeB18a3f355EA68f303eB06E8d7527773aCa6b398
TESTNET_ORACLE_ADDRESS=0x59bec759cbE4154626D98D86341E49759087b317

# Mainnet Configuration
OG_MAINNET_RPC_URL=https://evmrpc.0g.ai
OG_MAINNET_CHAIN_ID=16661
MAINNET_INFT_ADDRESS=                        # Set after deployment
MAINNET_ORACLE_ADDRESS=                      # Set after deployment

# Active (automatically selected based on NETWORK)
OG_RPC_URL=${NETWORK === 'mainnet' ? OG_MAINNET_RPC_URL : OG_TESTNET_RPC_URL}
INFT_ADDRESS=${NETWORK === 'mainnet' ? MAINNET_INFT_ADDRESS : TESTNET_INFT_ADDRESS}

# Wallet
PRIVATE_KEY=your_private_key_here            # KEEP SECRET!
```

---

## Quick Commands

```bash
# Check current network configuration
node -e "console.log('Network:', process.env.NETWORK || 'testnet')"

# Deploy to testnet
node scripts/deployINFT.js --network og-testnet

# Deploy to mainnet
node scripts/deployINFT.js --network og-mainnet

# Mint test incident (testnet)
node scripts/mintIncidentINFT.js --network og-testnet

# Check gas costs for mainnet
node scripts/estimateMainnetGas.js

# Start frontend (auto-detects network from constants)
cd frontend && pnpm run dev

# Start backend (reads from .env NETWORK variable)
pnpm nodemon backend/serverOG.js
```

---

## Support

- 📖 [0G Documentation](https://docs.0g.ai)
- 💬 [0G Discord](https://discord.gg/0glabs)
- 🐦 [0G Twitter](https://twitter.com/0G_labs)
- 🌐 [0G Website](https://0g.ai)

---

**Last Updated:** November 3, 2025  
**Version:** 1.0
