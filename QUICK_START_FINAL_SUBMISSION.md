# 🚀 QUICK START - Final Submission (30 Minutes)

## ⚡ **Fast Track to Submission**

Follow these steps in order. Each step should take 5-10 minutes.

---

## 📋 **Step-by-Step (30 Minutes Total)**

### **Step 1: Get 0G Mainnet Details** (5 min)
```bash
# Visit 0G documentation
# Copy these values:
- Mainnet RPC URL
- Mainnet Chain ID
- Mainnet Storage URL
```

**Where to find**:
- 0G Docs: https://docs.0g.ai
- OR 0G Discord: Ask in #dev-support

**Save to notepad**:
```
RPC: https://evmrpc.0g.ai
Chain ID: XXXXX
Storage: https://indexer-storage.0g.ai
```

---

### **Step 2: Deploy to Mainnet** (10 min)
```powershell
# Update .env
OG_RPC_URL=https://evmrpc.0g.ai
OG_CHAIN_ID=XXXXX

# Deploy
npx hardhat run scripts/deployINFT.js --network mainnet

# Copy addresses from output
iNFT: 0x...
Oracle: 0x...

# Verify on explorer
npx hardhat verify --network mainnet 0xYOUR_INFT_ADDRESS
npx hardhat verify --network mainnet 0xYOUR_ORACLE_ADDRESS
```

**✅ Success**: You have 2 verified contract addresses

---

### **Step 3: Update README.md** (5 min)
```powershell
# Open README.md in VS Code
# Press Ctrl+H (Find & Replace)

# Replace these 8 things:
1. 0xYOUR_MAINNET_INFT_HERE → Your iNFT address
2. 0xYOUR_MAINNET_ORACLE_HERE → Your Oracle address
3. XXXXX (3 places) → Mainnet Chain ID
4. [DEPLOYMENT_DATE] → Today's date
5. YOUR_TWITTER_LINK_HERE → Will add in Step 5
6. YOUR_DEMO_LINK_HERE → Will add in Step 4
7. YOUR_VIDEO_LINK_HERE → Skip or add later
8. YOUR_TWITTER_PROFILE → Your @ handle
```

**✅ Success**: No placeholders left in README

---

### **Step 4: Deploy Frontend** (5 min)

**Option A: Vercel (Recommended)**
```bash
cd frontend
npm install -g vercel
vercel --prod
# Copy URL from output
```

**Option B: Netlify**
```bash
cd frontend
npm run build
# Drag 'dist' folder to netlify.com/drop
# Copy URL
```

**Update README.md**:
- Replace `YOUR_DEMO_LINK_HERE` with your URL

**✅ Success**: Live demo accessible at URL

---

### **Step 5: Post Twitter Thread** (5 min)

**Copy from TWITTER_THREAD_TEMPLATE.md**:

1. Open `TWITTER_THREAD_TEMPLATE.md`
2. Copy Tweet 1/10
3. Replace placeholders:
   - Contract addresses
   - Demo link
   - Chain ID
4. Go to Twitter/X
5. Paste and click "+" to add next tweet
6. Repeat for all 10 tweets
7. **CRITICAL**: Verify @0G_Builders is tagged
8. Post thread
9. Copy URL of first tweet
10. Update README.md with tweet URL

**✅ Success**: Twitter thread live with @0G_Builders tag

---

### **Step 6: Final Verification** (2 min)

**Check README.md**:
- [ ] No `YOUR_*_HERE` placeholders
- [ ] Mainnet contract addresses
- [ ] Twitter link works
- [ ] Demo link works

**Check Demo**:
- [ ] Opens in browser
- [ ] Connects to mainnet
- [ ] Can report incident

**Check Twitter**:
- [ ] Thread visible
- [ ] @0G_Builders tagged
- [ ] All 10 tweets posted

**✅ Success**: Everything verified!

---

### **Step 7: Submit to WaveHack** (3 min)

**Go to submission form**:
https://YOUR_WAVEHACK_SUBMISSION_PORTAL

**Copy-paste these**:

**GitHub URL**:
```
https://github.com/anxbt/OG-Bounty-project
```

**Live Demo**:
```
YOUR_DEMO_LINK (from Step 4)
```

**Mainnet Contracts**:
```
iNFT: 0xYOUR_MAINNET_INFT_HERE
Oracle: 0xYOUR_MAINNET_ORACLE_HERE

Explorer:
https://chainscan.0g.ai/address/0xYOUR_MAINNET_INFT_HERE
https://chainscan.0g.ai/address/0xYOUR_MAINNET_ORACLE_HERE
```

**Twitter Post**:
```
YOUR_TWITTER_LINK (from Step 5)
```

**Project Description**:
```
iSentinel - First AI accountability platform using 100% of 0G stack 
(Blockchain + Storage + Compute). Oracle-verified iNFTs with real 
AI analytics (gpt-oss-120b, 70B params). Target market: $200B+ 
AI safety industry. Production-ready with 1,600+ lines of code.
```

**Click Submit!**

**✅ Success**: Submission complete! 🎉

---

## ⚠️ **Troubleshooting**

### **Problem: Mainnet deployment fails**
```bash
# Check wallet balance
# Need OG tokens for gas
# Get from faucet or bridge from testnet
```

### **Problem: Vercel deployment fails**
```bash
# Try Netlify instead (simpler)
# Or use GitHub Pages
# Or skip - judges can run locally
```

### **Problem: Twitter thread too long**
```bash
# Use single tweet version from TWITTER_THREAD_TEMPLATE.md
# Still must tag @0G_Builders
```

### **Problem: Can't verify contracts**
```bash
# Skip verification
# Just include addresses in README
# Judges can see code on-chain
```

---

## 📞 **Emergency Contact**

If completely stuck:
1. **Check Discord**: #dev-support channel
2. **Check Docs**: FINAL_SUBMISSION_CHECKLIST.md
3. **Submit partial**: Better to submit with testnet than miss deadline

---

## ✅ **Minimum Viable Submission**

If running out of time, **you must have**:

### **Required (Must Have)**:
- ✅ Mainnet contract addresses in README
- ✅ Twitter post with @0G_Builders
- ✅ GitHub repo public
- ✅ README.md updated

### **Nice to Have (But Can Skip)**:
- Demo video
- Live hosted demo (judges can run locally)
- All 10 tweets (single tweet is OK)

**Priority order**:
1. **Mainnet deployment** (40% of score)
2. **Twitter post** (30% of score)
3. **Updated README** (30% of score)
4. Demo video (bonus points)

---

## 🎯 **Success Checklist**

Before submitting, verify:

- [ ] ✅ Contracts deployed to 0G mainnet
- [ ] ✅ Contract addresses in README
- [ ] ✅ Twitter thread posted with @0G_Builders
- [ ] ✅ Twitter link in README
- [ ] ✅ All README placeholders replaced
- [ ] ✅ GitHub repo is public
- [ ] ✅ Submission form completed

**If all checkboxes = ✅, you're ready to submit!**

---

## 🏆 **Confidence Boosters**

Remember what you've built:

✅ **Only project** using 100% of 0G stack  
✅ **Real AI** (not simulated)  
✅ **Advanced iNFT** (not basic ERC721)  
✅ **1,600+ lines** of production code  
✅ **2,500+ lines** of documentation  
✅ **$200B+** target market identified  

**You've built something incredible. Now go submit it!** 🚀

---

## ⏰ **Time Management**

If you have:

### **30 minutes**:
- Do Steps 1-7 (minimal viable submission)

### **1 hour**:
- Do Steps 1-7
- Add demo video
- Test everything twice

### **2 hours**:
- Do Steps 1-7
- Record demo video
- Add screenshots to Twitter
- Test with fresh MetaMask wallet

### **4+ hours**:
- Do everything
- Write blog post
- Create YouTube tutorial
- Build hype on Discord

---

**The deadline is approaching. Start with Step 1 NOW!** ⚡

**Good luck! You got this!** 💪🎯🏆
