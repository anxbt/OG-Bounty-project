# VISA Feature - Quick Reference Card

## 🎯 30-Second Pitch

**VISA** auto-generates AI-verified attestations when incidents are reported:
- AI summary (via 0G Compute)
- Severity score (1-10)
- Cryptographic signature
- All stored decentralized
- Displayed instantly in UI

**Why it matters:** Judges see all 3 parts of 0G stack (Compute + Storage + Chain) in one feature.

---

## 📊 Decision Matrix

| Need | Approach | Time | Code | Best For |
|------|----------|------|------|----------|
| 🏃 Fast demo | **Option 2** | 8h | 550L | Days 1-2 |
| 🚀 Production | **Option 1** | 13h | 750L | Days 3-7 |
| 🏢 Enterprise | **Option 3** | 12h | 1050L | Mainnet |

**👉 Start with Option 2, upgrade to Option 1 if time permits**

---

## 📁 Three Guides (Pick One)

```
┌─────────────────────────────────────────────────┐
│         VISA_QUICK_START_TEMPLATE.md           │
│    Working code, copy-paste ready              │
│    Best for: Getting started immediately      │
│    Time: 30 min to read, 4-6 hours to code    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│      VISA_QUICK_DECISION_GUIDE.md             │
│    Compare approaches, see trade-offs          │
│    Best for: Choosing your strategy            │
│    Time: 15 min read                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│    VISA_IMPLEMENTATION_GUIDE.md (Detailed)     │
│    Complete architecture, all phases            │
│    Best for: Deep understanding                │
│    Time: 45 min read + planning                │
└─────────────────────────────────────────────────┘
```

---

## ⚡ Implementation at a Glance

### Smart Contract (1 hour)
```solidity
✅ Add event: AttestationCreated
✅ Add function: recordAttestation()
✅ Deploy & update .env
```

### Backend (3-4 hours)
```javascript
✅ computeAttestationZG.js - Query 0G Compute
✅ attestationManager.js - Core logic
✅ Modify POST /incident endpoint
✅ Add signing & storage upload
```

### Frontend (2 hours)
```typescript
✅ AttestationBadge.tsx component
✅ Add to IncidentDetailModal
✅ Display summary + score + verify button
```

### Testing (1 hour)
```bash
✅ test-visa.js script
✅ E2E workflow test
✅ Verify on-chain event
```

**Total: 8-10 hours for working demo**

---

## 🎬 Demo Flow (30 seconds)

```
1. Open app, click "Report Incident"
2. Fill form (title, severity, description, logs)
3. Click Submit
4. [Wait 10-15 seconds]
   Backend: Upload logs → Mint NFT → Query 0G Compute
5. Show VISA badge:
   "GPT-4 produced factually incorrect information"
   Score: 8.5/10
   Verified by 0G Network ✓
6. Click "Verify" to show signature
7. Point to explorer: Tx recorded on-chain
```

---

## 📊 Tech Stack Changes

```
Current (Wave 4):
├─ Smart Contract: iNFT (ERC721 + oracle)
├─ Backend: Node.js + 0G Storage + 0G Compute
└─ Frontend: React + TypeScript

New (Wave 5 with VISA):
├─ Smart Contract: iNFT + AttestationCreated event
├─ Backend: Same + Attestation Manager
│            + Attestation Signing
│            + Event Listener (optional for Option 1)
└─ Frontend: Same + AttestationBadge component
```

---

## 🔑 Key Files to Create

```
backend/
├─ computeAttestationZG.js        (NEW - 250 lines)
├─ attestationManager.js           (NEW - 300 lines)
├─ eventListener.js               (NEW - 100 lines, optional)
└─ serverOG.js                    (MODIFY +50 lines)

frontend/src/components/
├─ AttestationBadge.tsx           (NEW - 100 lines)
└─ IncidentDetailModal.tsx        (MODIFY +20 lines)

contracts/
└─ INFT.sol                       (MODIFY +50 lines)
```

---

## 💰 Resource Requirements

**Backend:**
- 0G Compute API access (free testnet account)
- 0G Storage access (included in testnet)
- ECDSA signing library (ethers.js has it)
- Optional: Redis/Bull for Option 3

**Frontend:**
- React components (already have)
- Ethers.js for verification (already have)
- Storage SDK for downloading attestations (already have)

**Testing:**
- Axios for HTTP tests
- Jest for unit tests (optional)

---

## 🧪 Quick Test

```bash
# 1. Create test incident
node test-visa.js

# 2. You should see:
# ✅ Token ID: 42
# ✅ Log URI: 0g://0xabc...
# ✅ Attestation Summary: "GPT-4 produced..."
# ✅ Severity Score: 8.5/10
# ✅ On-chain: Block 2847291
```

---

## ⚠️ Common Gotchas

| Issue | Fix |
|-------|-----|
| 0G Compute not initializing | Check PRIVATE_KEY, balance > 0.01 OG |
| Signature fails | Ensure consistent message formatting |
| Event not emitted | Check contract address in .env |
| Storage upload fails | Test with small file first |
| AI response is invalid JSON | Use fallback (already in template) |
| Token doesn't exist | Verify tokenId from mint is correct |

---

## 🎯 Success Criteria

✅ User reports incident  
✅ NFT mints in <15 seconds  
✅ AI summary appears within 30 seconds  
✅ Severity score visible (1-10)  
✅ Signature copyable for verification  
✅ Event logged on-chain  
✅ Attestation downloadable from storage  

---

## 📈 Improvement Path

**After getting it working:**
1. ✅ Get option 2 working (sync)
2. ✅ Record demo video
3. ✅ Get feedback
4. ⬜ Upgrade to Option 1 (events)
5. ⬜ Add job queue for scale (Option 3)
6. ⬜ Add batch processing
7. ⬜ Add WebSocket real-time updates

---

## 🎓 Learning Path

```
Read QUICK_DECISION_GUIDE (15 min)
    ↓
Pick an option (5 min decision)
    ↓
Read relevant QUICK_START or IMPLEMENTATION guide
    ↓
Copy template code (1 hour)
    ↓
Customize for your incident (1 hour)
    ↓
Test locally with test-visa.js (30 min)
    ↓
Deploy to Galileo testnet (30 min)
    ↓
Record demo (30 min)
    ↓
Celebrate! 🎉
```

**Total: 1 full day of focused work**

---

## 🚀 Launch Checklist

**Before Demo:**
- [ ] All three files read
- [ ] Option chosen
- [ ] Smart contract deployed
- [ ] Backend code integrated
- [ ] Frontend component added
- [ ] test-visa.js runs successfully
- [ ] 5+ test incidents created
- [ ] Demo script practiced
- [ ] Video recorded

**During Demo:**
- [ ] Show incident submission form
- [ ] Click submit
- [ ] Explain what's happening (15s wait)
- [ ] Show VISA badge appear
- [ ] Display signature
- [ ] Show on-chain verification
- [ ] Explain judge why this matters

---

## 💡 Why This Matters

| Stakeholder | Why VISA Matters |
|-------------|-----------------|
| **Judges** | See complete 0G stack in action |
| **Users** | AI-verified incident summaries instant |
| **Enterprises** | Cryptographic proof for compliance |
| **Researchers** | Dataset of AI failures + scores |
| **You** | Demonstrates advanced integration skills |

---

## 🎯 What Judges Will Notice

✨ **"They used real AI, not simulated!"**  
✨ **"All 3 0G components working together"**  
✨ **"Production-grade crypto implementation"**  
✨ **"Clean UI for complex workflow"**  
✨ **"Demonstrates deep 0G understanding"**  

---

## 📞 Help Resources

**If stuck:**
1. Check VISA_QUICK_START_TEMPLATE.md troubleshooting
2. Check VISA_IMPLEMENTATION_GUIDE.md troubleshooting
3. Check test-visa.js for example workflow
4. Check existing code in backend/computeAnalyticsZG.js for patterns

**If need help:**
- Look at gpt-oss-120b examples in computeAnalyticsZG.js
- Check ethers.js docs for signing
- Check 0G Storage SDK examples

---

## 🎉 Expected Result

```
User clicks "Report Incident"
    ↓
Fills form with incident details
    ↓
Hits submit
    ↓
[Backend churning...]
    ↓
NFT appears on dashboard
    ↓
🎯 VISA Attestation badge shows:
   "GPT-4 generated false financial information
    during customer support interaction. System
    confidence abnormally low at 0.23."
   
   Severity: 8.5/10 ✓
   Verified by 0G Network ✓
   Signature: 0x5678... [Copy] [Verify]
    ↓
Judge: "Wow, that's incredible!"
```

---

## 📋 Files You Need to Read

1. **VISA_README.md** ← You're reading this now ✓
2. **VISA_QUICK_DECISION_GUIDE.md** ← Read next (15 min)
3. **VISA_QUICK_START_TEMPLATE.md** ← Copy from this (4-6 hours)

OR

3. **VISA_IMPLEMENTATION_GUIDE.md** ← Deep dive (45 min + planning)

---

## ⏱️ Timeline

| Time | Task |
|------|------|
| Day 1 Morning | Read guides + decide |
| Day 1 Afternoon | Implement smart contract + backend |
| Day 2 Morning | Implement frontend + test |
| Day 2 Afternoon | Polish + demo practice |
| Day 3 | Record final demo |

---

**Start with VISA_QUICK_DECISION_GUIDE.md next →**

*Good luck with your implementation! You've got all the resources needed.* 🚀
