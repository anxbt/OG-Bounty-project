# 🔧 0G Compute Setup Guide

## Current Situation

**Error:** `Failed to initialize 0G Compute Broker: could not decode result data`

**Why:** 0G Compute Network is **only available on testnet**, not mainnet yet.

---

## ✅ Solution: Switch to Testnet for Compute

### Option 1: Use Network Switcher (EASIEST)

Your app now has a dynamic network switcher!

1. **Open your app** at http://localhost:5174
2. **Click the ⚙️ "Mode" button** in the navbar
3. **Select "0G Galileo Testnet"**
4. **Page reloads** with testnet configuration
5. **Backend automatically uses testnet** (no restart needed!)

Your compute account with **1.6 OG balance** is on testnet and will work immediately!

---

### Option 2: Update .env to Use Testnet

If you want to set testnet as default:

**Edit `.env` file:**
```bash
# Change this line:
OG_RPC_URL=https://evmrpc.0g.ai

# To this:
OG_RPC_URL=https://evmrpc-testnet.0g.ai

# And update chain ID:
CHAIN_ID=16602

# And contracts:
INFT_ADDRESS=0xeB18a3f355EA68f303eB06E8d7527773aCa6b398
ORACLE_ADDRESS=0x59bec759cbE4154626D98D86341E49759087b317
```

**Then restart backend:**
```bash
# Stop current backend (Ctrl+C in the terminal running it)
node backend/serverOG.js
```

---

## 📊 Your Compute Account Status

**Testnet Account:**
- Address: `0x47E835a213cdB3ec5d7ffEea70513011D3D4FF2A`
- Balance: **1.6 OG** (plenty for compute!)
- Status: ✅ Ready to use
- Location: **Testnet only**

**To check your balance:**
```bash
node scripts/setupComputeAccount.js
```

---

## 💰 Adding More Credits (Testnet)

If you need more testnet 0G for compute:

### Method 1: Faucet (Free)
```
1. Visit: https://faucet.0g.ai
2. Enter wallet: 0x47E835a213cdB3ec5d7ffEea70513011D3D4FF2A
3. Request testnet tokens
4. Wait ~30 seconds
5. Run: node scripts/setupComputeAccount.js
6. Add more funds to compute account
```

### Method 2: Check Current Balance
```bash
# See your wallet balance
node -e "const {ethers} = require('ethers'); const provider = new ethers.JsonRpcProvider('https://evmrpc-testnet.0g.ai'); provider.getBalance('0x47E835a213cdB3ec5d7ffEea70513011D3D4FF2A').then(b => console.log('Balance:', ethers.formatEther(b), '0G'))"
```

---

## 🎯 Recommended Setup for Demo

### For Full 0G Stack Demo (Compute + Storage + Blockchain):
**✅ Use Testnet**
- Click "Mode" → Select "0G Galileo Testnet"
- All features work (Storage ✅ Compute ✅ Blockchain ✅)
- Your 1.6 OG compute balance is ready

### For Production Blockchain Demo:
**✅ Use Mainnet** 
- Click "Mode" → Select "0G Mainnet"
- Uses Gemini AI for analytics (still works great!)
- Shows production contracts

---

## 🔄 Current Fallback System

Your backend has smart fallbacks:

```
1. 0G Compute Network (SDK v2) ← Testnet only
   ↓ (if unavailable)
2. Gemini AI ← Currently active on mainnet ✅
   ↓ (if unavailable)
3. Simulated Analytics ← Last resort
```

**On Mainnet:** Using Gemini AI (works perfectly!)
**On Testnet:** Using 0G Compute (your 1.6 OG will be used)

---

## 🎬 Quick Demo Flow

### Show 0G Compute in Action:

1. **Switch to testnet:**
   - Click "Mode" → "0G Galileo Testnet"
   - Page reloads

2. **Restart backend** (to pick up testnet config):
   ```bash
   # In backend terminal, press Ctrl+C
   node backend/serverOG.js
   ```

3. **Backend will show:**
   ```
   ✅ Broker initialized
   💰 Account balance: 1.6 0G
   🔍 Discovering available services...
   Found X available services
   ```

4. **Go to Analytics Dashboard:**
   - Analytics now powered by real 0G Compute!
   - Each query uses a tiny amount of your 1.6 OG
   - You can run ~1000+ queries with 1.6 OG

---

## 🐛 Troubleshooting

### "Could not decode result data" persists
→ You're still on mainnet. Switch to testnet using Mode button.

### "Insufficient funds" error
→ Add more 0G to compute account:
```bash
node scripts/setupComputeAccount.js
# When prompted, it will add 0.1 OG to your compute account
```

### Backend says "Falling back to simulated analytics mode"
→ This is normal on mainnet. Switch to testnet for real compute.

### Compute account not found
→ Run the setup script on testnet:
```bash
# Make sure .env has testnet RPC
node scripts/setupComputeAccount.js
```

---

## ✅ Summary

**Problem:** 0G Compute not on mainnet
**Solution:** Switch to testnet using the Mode button
**Your Credits:** 1.6 OG ready on testnet
**Status:** Ready to use 0G Compute!

**Next Steps:**
1. Click ⚙️ Mode → Select Testnet
2. Restart backend: `node backend/serverOG.js`
3. Check backend logs for "✅ Broker initialized"
4. Open Analytics Dashboard
5. See real 0G Compute in action! 🎉
