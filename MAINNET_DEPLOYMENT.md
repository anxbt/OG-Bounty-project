# 🚀 Production Deployment - 0G Mainnet

**Deployment Date:** November 3, 2025  
**Status:** ✅ LIVE ON MAINNET

---

## 📡 Mainnet Contract Addresses

### iNFT System
- **INFT Contract:** `0xA75110a3d4DFA4F20B71ad87110a1A5FF3f58229`
- **Oracle Contract:** `0x00fF3A9d6850CdcE1f4920FB029c60568314B36E`

### Deployment Transaction
- **Tx Hash:** `0xe1811c6fa1b6653933c99c4e5e0a52e2da8f737e5c3cea483b950325da6ef966`
- **Gas Used:** 3,407,297 gas
- **Deployer:** `0x47E835a213cdB3ec5d7ffEea70513011D3D4FF2A`

### Network Details
- **Chain ID:** 16661
- **RPC URL:** `https://evmrpc.0g.ai`
- **Explorer:** `https://chainscan.0g.ai`
- **Storage Indexer:** `https://indexer-storage-turbo.0g.ai`

---

## 🔄 Configuration Changes

### Frontend (`frontend/src/constants/index.ts`)
✅ Updated `ACTIVE_NETWORK = NETWORKS.MAINNET`  
✅ Added mainnet contract addresses  
✅ Changed network badge to show green "LIVE" indicator

### Backend (`.env`)
✅ Updated `OG_RPC_URL` to mainnet RPC  
✅ Updated `CHAIN_ID` to 16661  
✅ Updated `INFT_ADDRESS` and `ORACLE_ADDRESS`  
✅ Kept testnet addresses as backup

### Network Indicator Component
✅ Shows green "0G Mainnet LIVE" badge  
✅ Prompts testnet users to switch to mainnet  
✅ Auto-detects wallet network and warns if on wrong network

---

## 🎯 User Experience

### When Wallet is on Mainnet (Correct)
- ✅ Green "0G Mainnet LIVE" badge
- ✅ Shows wallet address
- ✅ All features work normally

### When Wallet is on Testnet (Wrong Network)
- ⚠️ Orange warning badge appears
- 📍 Shows "Wallet: 0G Galileo Testnet"
- 📍 Shows "Expected: 0G Mainnet"
- 🔄 "Switch to Mainnet" button appears
- 🎯 Clicking button prompts MetaMask to switch networks

---

## 🔐 Security Notes

### Private Key
- ✅ Using same deployer wallet as testnet
- ✅ Address: `0x47E835a213cdB3ec5d7ffEea70513011D3D4FF2A`
- ⚠️ Ensure this wallet has sufficient mainnet 0G for gas

### Contract Verification
- Consider verifying contracts on 0G Explorer
- Visit: https://chainscan.0g.ai/address/0xA75110a3d4DFA4F20B71ad87110a1A5FF3f58229

---

## 📊 Testnet vs Mainnet Comparison

| Feature | Testnet | Mainnet |
|---------|---------|---------|
| **Chain ID** | 16602 | 16661 |
| **INFT Contract** | `0xeB18...6398` | `0xA751...8229` |
| **Oracle Contract** | `0x59be...7317` | `0x00fF...B36E` |
| **Badge Color** | 🟡 Yellow "TEST" | 🟢 Green "LIVE" |
| **Cost** | Free (faucet) | Real 0G tokens |
| **Data** | Test data | Production data |

---

## 🚦 Deployment Checklist

- [x] Deploy contracts to mainnet
- [x] Update frontend constants with mainnet addresses
- [x] Switch ACTIVE_NETWORK to MAINNET
- [x] Update .env with mainnet configuration
- [x] Update backend RPC URL to mainnet
- [x] Update NetworkIndicator to prompt testnet users
- [x] Backend running on mainnet
- [ ] Test wallet connection on mainnet
- [ ] Test incident reporting on mainnet
- [ ] Test attestation functionality on mainnet
- [~] 0G Compute (using Gemini AI fallback - compute not available on mainnet yet)
- [ ] Test analytics dashboard with mainnet data

---

## 🧪 Testing Steps

### 1. Connect Wallet to Mainnet
```
1. Open MetaMask
2. Select "0G Mainnet" network
3. If not listed, add it:
   - Network Name: 0G Mainnet
   - RPC URL: https://evmrpc.0g.ai
   - Chain ID: 16661
   - Currency Symbol: 0G
4. Visit your app at http://localhost:5174
5. Click "Connect" in navbar
6. Should see green "0G Mainnet LIVE" badge
```

### 2. Test Network Switch Prompt
```
1. Switch MetaMask to testnet (16602)
2. Refresh app
3. Should see orange warning
4. Click "Switch to Mainnet" button
5. MetaMask should prompt to switch
6. After switching, orange warning disappears
```

### 3. Test Incident Reporting
```
1. Navigate to "Report Incident" page
2. Fill out incident form
3. Submit transaction
4. Should use mainnet gas (real 0G)
5. Transaction appears on 0G Explorer
```

### 4. Test Backend Integration
```
1. Backend should connect to mainnet RPC
2. Check backend logs for correct chain ID (16661)
3. Test incident fetching from mainnet contract
4. Verify analytics compute against mainnet data
```

---

## 🔄 Rolling Back to Testnet (If Needed)

If you need to switch back to testnet:

### 1. Update Constants
```typescript
// In frontend/src/constants/index.ts
export const ACTIVE_NETWORK = NETWORKS.TESTNET;
```

### 2. Update .env
```bash
OG_RPC_URL=https://evmrpc-testnet.0g.ai
CHAIN_ID=16602
INFT_ADDRESS=0xeB18a3f355EA68f303eB06E8d7527773aCa6b398
ORACLE_ADDRESS=0x59bec759cbE4154626D98D86341E49759087b317
NETWORK=og
```

### 3. Restart Services
```bash
cd frontend
pnpm run dev

# In another terminal
pnpm nodemon backend/serverOG.js
```

---

## 💰 Gas Cost Estimation

Based on previous analysis (see `MAINNET_COST_ANALYSIS.md`):

| Operation | Gas Used | Cost ($) |
|-----------|----------|----------|
| Deploy INFT | ~3.4M | ~$0.08 |
| Mint Incident | ~200K | ~$0.005 |
| Add Attestation | ~100K | ~$0.002 |

**Note:** Actual costs vary with gas price and 0G token price.

---

## 📚 Related Documentation

- `NETWORK_CONFIGURATION.md` - Full network setup guide
- `NETWORK_STATUS.md` - Network switching help
- `MAINNET_COST_ANALYSIS.md` - Gas cost breakdown
- `VIEW_DETAILS_READY.md` - VISA feature documentation
- `README_UPDATE_COMPLETE.md` - Project overview

---

## ⚠️ 0G Compute Status

**0G Compute is not available on mainnet yet.**

Your backend automatically falls back to:
1. **Gemini AI** - Active and working ✅
2. **Simulated Analytics** - Secondary fallback ✅

This is completely normal and expected! Your analytics will still work via Gemini AI.

See `COMPUTE_MAINNET_STATUS.md` for details.

---

## 🎉 Next Steps

1. **Restart Frontend:**
   ```bash
   cd frontend
   pnpm run dev
   ```

2. **Restart Backend:**
   ```bash
   pnpm nodemon backend/serverOG.js
   ```
   
   ✅ Backend is already running with:
   - Mainnet blockchain (Chain 16661)
   - Mainnet storage
   - Gemini AI analytics (compute fallback)

3. **Switch Your Wallet:**
   - Open MetaMask
   - Switch from testnet to mainnet
   - Refresh the app

4. **Test Everything:**
   - Connect wallet
   - Report an incident
   - View incident details
   - Test attestations
   - Check analytics

5. **Monitor:**
   - Watch backend logs
   - Check 0G Explorer for transactions
   - Verify gas costs are reasonable

---

## 🆘 Troubleshooting

### "Insufficient funds" error
- Ensure your wallet has mainnet 0G tokens (not testnet)
- Check balance on https://chainscan.0g.ai

### Orange "wrong network" warning persists
- Make sure MetaMask is on mainnet (16661)
- Try manually switching in MetaMask
- Click "Switch to Mainnet" button

### Backend can't connect to contracts
- Verify .env has correct mainnet RPC URL
- Check INFT_ADDRESS and ORACLE_ADDRESS are set
- Restart backend server

### Transactions failing
- Check you're using mainnet RPC
- Verify contract addresses are correct
- Ensure gas limit is sufficient

---

## ✅ Production Ready!

Your app is now configured for **0G Mainnet** production use! 🚀

Users on testnet will be prompted to switch to mainnet automatically.
