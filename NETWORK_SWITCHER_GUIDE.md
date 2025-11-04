# 🔄 Dynamic Network Switcher

## Overview

Your app now supports **dynamic network switching** between 0G Testnet and Mainnet without code changes! This is perfect for demos where you want to showcase different features.

---

## 🎯 Why Dynamic Switching?

### Current Status:
- **0G Blockchain**: ✅ Deployed on both Testnet & Mainnet
- **0G Storage**: ⚠️ Only on Testnet
- **0G Compute**: ⚠️ Only on Testnet

### Use Cases:
1. **Mainnet Mode**: Show production blockchain with real transactions
2. **Testnet Mode**: Show full 0G stack (Storage + Compute + Blockchain)

---

## 🎮 How to Use

### In the UI

1. **Look for the "Mode" button** in the navbar (gear icon ⚙️)
2. **Click to open network selector dropdown**
3. **Choose network:**
   - **0G Mainnet (LIVE)**: Production blockchain, Storage/Compute on testnet
   - **0G Galileo Testnet (TEST)**: Full stack on testnet
4. **Page reloads automatically** with new network settings

### Visual Indicators

**Network Badge (in navbar):**
- 🟢 Green "0G Mainnet LIVE" = Mainnet mode
- 🟡 Yellow "0G Galileo Testnet TEST" = Testnet mode

**Settings remembers your choice** (stored in localStorage)

---

## 📊 Network Comparison

| Feature | Testnet Mode | Mainnet Mode |
|---------|-------------|--------------|
| **Blockchain** | Testnet (16602) | Mainnet (16661) |
| **INFT Contract** | `0xeB18...6398` | `0xA751...8229` |
| **Oracle** | `0x59be...7317` | `0x00fF...B36E` |
| **Storage** | Testnet | Testnet* |
| **Compute** | Testnet | Testnet (fallback)* |
| **Tokens** | Free (faucet) | Real 0G |
| **Explorer** | chainscan-galileo | chainscan |

\* *Storage and Compute use testnet in both modes (mainnet not available yet)*

---

## 🔧 Technical Details

### How It Works

1. **NetworkProvider** wraps the entire app (in `main.tsx`)
2. **localStorage** saves the selected network
3. **useNetwork() hook** provides network config to components
4. **NetworkSwitcher** component lets users switch networks
5. **Page reload** applies changes throughout the app

### Code Structure

```
frontend/src/
├── contexts/
│   └── NetworkContext.tsx       # Context provider & hook
├── components/
│   ├── NetworkSwitcher.tsx      # UI to switch networks
│   └── NetworkIndicator.tsx     # Shows current network badge
├── constants/
│   └── index.ts                 # Network configurations
└── main.tsx                     # NetworkProvider wrapper
```

### Using in Your Components

```typescript
import { useNetwork } from '../contexts/NetworkContext';

function MyComponent() {
  const { networkConfig, isTestnet, isMainnet } = useNetwork();
  
  // Access current network config
  console.log(networkConfig.chainId);    // 16602 or 16661
  console.log(networkConfig.rpcUrl);     // Current RPC URL
  console.log(networkConfig.contracts);  // Contract addresses
  
  // Check network type
  if (isTestnet) {
    // Do testnet-specific stuff
  }
  
  if (isMainnet) {
    // Do mainnet-specific stuff
  }
}
```

---

## 🎬 Demo Scenarios

### Scenario 1: Full Feature Demo (Use Testnet)
```
1. Switch to "0G Galileo Testnet"
2. Show incident reporting (blockchain ✅)
3. Show 0G Storage uploads (storage ✅)
4. Show AI analytics (compute ✅)
```

### Scenario 2: Production Blockchain (Use Mainnet)
```
1. Switch to "0G Mainnet"
2. Show real mainnet transactions
3. Show mainnet contract addresses
4. Emphasize production readiness
```

### Scenario 3: Quick Switch Demo
```
1. Start in Mainnet mode
2. Show production contracts
3. Click "Mode" → Switch to Testnet
4. Page reloads
5. Show full stack capabilities
```

---

## ⚙️ Configuration

### Change Default Network

In `frontend/src/main.tsx`:
```typescript
<NetworkProvider defaultNetwork="MAINNET">  // or "TESTNET"
  <App />
</NetworkProvider>
```

### Reset User's Choice

Clear localStorage:
```javascript
localStorage.removeItem('activeNetwork');
```

Or set programmatically:
```javascript
localStorage.setItem('activeNetwork', 'TESTNET'); // or 'MAINNET'
```

---

## 🔄 Wallet Network Mismatch

### What Happens:
- Orange warning appears if wallet network ≠ app network
- Shows: "Wallet: [wallet network]" vs "Expected: [app network]"
- "Switch to [Network]" button appears

### Example:
```
App Mode: 0G Mainnet (LIVE)
Wallet: Connected to Testnet
Result: ⚠️ Orange warning + "Switch to Mainnet" button
```

---

## 📝 Key Files Modified

1. **`frontend/src/contexts/NetworkContext.tsx`** - Network state management
2. **`frontend/src/components/NetworkSwitcher.tsx`** - Network selector UI
3. **`frontend/src/components/NetworkIndicator.tsx`** - Updated to use context
4. **`frontend/src/components/WalletConnection.tsx`** - Updated to use context
5. **`frontend/src/constants/index.ts`** - Added getActiveNetwork() helper
6. **`frontend/src/main.tsx`** - Wrapped app in NetworkProvider
7. **`frontend/src/App.tsx`** - Added NetworkSwitcher to navbar

---

## 🎯 Best Practices

### For Demos:
1. **Start with explanation** of which network you're on
2. **Show the switcher** to audience
3. **Explain trade-offs** (mainnet contracts vs full stack)
4. **Switch live** if needed to show different features

### For Development:
1. **Use testnet** for active development
2. **Use mainnet** for production testing
3. **Test both** before important demos
4. **Remember**: Settings persist across page reloads

---

## 🐛 Troubleshooting

### Network switcher not appearing
- Check navbar is rendered (not on landing page)
- Look for gear icon (⚙️) next to network badge

### Switch doesn't work
- Check browser console for errors
- Try clearing localStorage: `localStorage.clear()`
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)

### Wrong contracts after switching
- Page should reload automatically
- If not, manually refresh (F5)
- Check localStorage: `localStorage.getItem('activeNetwork')`

### Wallet won't connect
- Make sure MetaMask is installed
- Check if wallet is on correct network
- Use "Switch to [Network]" button if warning appears

---

## ✅ Testing Checklist

- [ ] Network switcher visible in navbar
- [ ] Click "Mode" opens dropdown
- [ ] Select Testnet → Page reloads
- [ ] Badge shows "0G Galileo Testnet TEST" (yellow)
- [ ] Select Mainnet → Page reloads
- [ ] Badge shows "0G Mainnet LIVE" (green)
- [ ] Connect wallet on testnet - works
- [ ] Connect wallet on mainnet - works
- [ ] Wrong network warning appears when mismatched
- [ ] "Switch to [Network]" button works
- [ ] Settings persist after page reload

---

## 🚀 You're Ready!

Your app now has **dynamic network switching** perfect for:
- 🎬 Live demos
- 🧪 Testing both networks
- 📊 Showing different features
- 🎯 Production readiness

**Tip**: Practice switching between networks before your demo to get comfortable with the flow!
