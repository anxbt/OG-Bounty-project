# Network Configuration Status

## Current Situation

### Your Wallet Settings
- **Connected to:** 0G Mainnet
- **Chain ID:** 16661

### App Configuration
- **Configured for:** 0G Galileo Testnet
- **Chain ID:** 16602

## ⚠️ This is a MISMATCH!

The app is looking for Testnet (16602) but your wallet is on Mainnet (16661).

---

## Solutions

### ✅ Option 1: Switch Wallet to Testnet (RECOMMENDED)

**Why:** The app's contracts are deployed on testnet, not mainnet yet.

**Steps:**
1. Click the **"Switch to Testnet"** button in the navbar
2. MetaMask will prompt you to switch networks
3. Approve the switch
4. Your wallet will now be on 0G Galileo Testnet (16602)

**OR manually in MetaMask:**
1. Open MetaMask
2. Click network dropdown at top
3. Select "0G Galileo Testnet"
4. If not listed, add it manually:
   - Network Name: `0G Galileo Testnet`
   - RPC URL: `https://evmrpc-testnet.0g.ai`
   - Chain ID: `16602`
   - Currency Symbol: `0G`
   - Explorer: `https://chainscan-galileo.0g.ai`

---

### 🔧 Option 2: Configure App for Mainnet

**Why:** You want to use mainnet instead of testnet.

**Prerequisites:**
- You must deploy contracts to mainnet first
- You need mainnet 0G tokens (not testnet tokens)

**Steps:**

1. **Deploy contracts to mainnet:**
   ```bash
   node scripts/deployINFT.js --network og-mainnet
   ```

2. **Update frontend config:**
   ```typescript
   // In frontend/src/constants/index.ts
   export const ACTIVE_NETWORK = NETWORKS.MAINNET; // Change from TESTNET
   ```

3. **Update mainnet contract addresses:**
   ```typescript
   MAINNET: {
     contracts: {
       inft: '0xYOUR_DEPLOYED_ADDRESS',
       oracle: '0xYOUR_ORACLE_ADDRESS',
       legacy: ''
     }
   }
   ```

4. **Restart frontend:**
   ```bash
   cd frontend
   pnpm run dev
   ```

---

## Understanding the Navbar

### Network Badge (Yellow/Green)
Shows what network the **app expects**:
- 🟡 Yellow "TEST" = App expects Testnet (16602)
- 🟢 Green "LIVE" = App expects Mainnet (16661)

### Wallet Status
Shows your **actual wallet connection**:
- 🔵 "Connect" button = Not connected yet
- 🟢 Green with address = Connected to correct network
- 🟠 Orange warning = Connected to WRONG network

---

## Current Status Check

**What you see now:**
- Network badge shows: 🟡 "0G Galileo Testnet" (app expects this)
- Wallet shows: 🟠 Orange warning saying "Wallet: 0G Mainnet" (you're on wrong network)
- Button says: "Switch to Testnet"

**What should happen:**
1. Click "Connect" button
2. You'll see orange warning (because you're on mainnet)
3. Click "Switch to Testnet" 
4. Your wallet switches to testnet
5. Orange warning turns green ✅
6. App works normally

---

## Testing Connect Wallet

**To verify it's working:**

1. Open browser console (F12)
2. Click "Connect" button
3. You should see logs:
   ```
   🔌 Attempting to connect wallet...
   ✅ Wallet connected: 0x47e8...ff2a
   📊 Current chain ID: 16661
   🎯 Expected chain ID: 16602
   ```

4. If you see these logs, **the connect function IS working!**
5. The orange warning appears because: 16661 ≠ 16602

---

## Quick Fix (1 minute)

**Just click the "Switch to Testnet" button** in the navbar when you see the orange warning. 

That's it! Your wallet will switch from mainnet to testnet and everything will work.

---

## Why Testnet for Now?

1. ✅ Free testnet tokens from faucet
2. ✅ Contracts already deployed on testnet  
3. ✅ No risk of losing real money
4. ✅ Perfect for development and demos
5. ✅ Switch to mainnet later when ready to launch

---

## Need Help?

**Connect wallet not working at all?**
- Check if MetaMask is installed
- Check console for error messages
- Make sure MetaMask is unlocked
- Try refreshing the page

**Switch network not working?**
- MetaMask might not have 0G Testnet added
- Add it manually using the steps above
- Or the "Switch to Testnet" button will add it for you

**Want to use mainnet anyway?**
- Follow "Option 2: Configure App for Mainnet" above
- Deploy contracts first
- Update configuration
- Restart app
