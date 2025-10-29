# Where to Find the VISA Feature in the UI

## 🎯 Quick Guide

### Step 1: Open Dashboard
Navigate to the main dashboard where you see all incidents

### Step 2: Click Any Incident
Click on any incident card to open the detail modal

### Step 3: Look for "AI Verification" Section
Scroll down in the modal. You'll see sections in this order:
1. Incident ID / Token ID / Transaction Hash
2. Description
3. **🆕 AI Verification** ← NEW SECTION HERE
4. Logs
5. Action buttons

### Step 4: Click "Explain & Verify"
In the AI Verification section, you'll see a button:
```
┌────────────────────────────────────┐
│  Explain & Verify                  │
└────────────────────────────────────┘
```

### Step 5: Wait for Attestation
After clicking:
- Button changes to "Generating Attestation..."
- Backend queries 0G Compute (15-30 seconds)
- Signs the result
- Stores on 0G Storage
- Records on-chain

### Step 6: View Result
Once complete, you'll see:
```
┌────────────────────────────────────┐
│  ✅ Verified Explanation           │
├────────────────────────────────────┤
│  "GPT-4 produced false financial   │
│   information during customer      │
│   support interaction..."          │
│                                    │
│  Severity: 8.5/10                  │
│  Signed by: 0x47E835...            │
│  [Copy Signature]                  │
└────────────────────────────────────┘
```

## 📍 Exact Location in Code

**File:** `frontend/src/components/IncidentDetailModal.tsx`

**Line:** Around line 191

```tsx
{incident.token_id && (
  <div>
    <div className="text-sm font-medium text-gray-700 mb-2">
      AI Verification
    </div>
    <AttestationCard tokenId={incident.token_id} />
  </div>
)}
```

## 🎬 Demo Flow

1. **Start backend**: `node backend/serverOG.js`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Open browser**: http://localhost:5173
4. **Click any incident** in the dashboard
5. **Scroll down** to "AI Verification"
6. **Click "Explain & Verify"**
7. **Wait ~20 seconds**
8. **See the verified summary** with signature

## 🐛 Troubleshooting

### "Attestation Manager not initialized"
- Make sure backend is running
- Check `.env` has `PRIVATE_KEY` set
- Verify contract address is correct

### "Not authorized to attest"
- Run: `node scripts/authorizeAttestor.js`
- This authorizes your wallet to create attestations

### Button doesn't appear
- Make sure incident has a `token_id`
- Only NFT-minted incidents can have attestations
- Check browser console for errors

### Takes too long
- 0G Compute queries can take 15-30 seconds
- This is normal for AI inference
- Backend will show progress in terminal

## 🎨 UI States

### State 1: Initial (Button)
```
┌────────────────────────────────────┐
│  Explain & Verify                  │
└────────────────────────────────────┘
```

### State 2: Loading
```
┌────────────────────────────────────┐
│  Generating Attestation...         │
│  (Spinner animation)               │
└────────────────────────────────────┘
```

### State 3: Success
```
┌────────────────────────────────────┐
│  🤖 AI Attestation                 │
│  ✅ Verified                       │
├────────────────────────────────────┤
│  Summary text here...              │
│  Score: 8.5/10                     │
│  Signed by: 0x...                  │
│  [Copy Signature]                  │
└────────────────────────────────────┘
```

### State 4: Error
```
┌────────────────────────────────────┐
│  ❌ Attestation Failed             │
│  Error message here                │
│  [Try Again]                       │
└────────────────────────────────────┘
```

## 🔗 Related Components

- `AttestationCard.tsx` - The VISA UI component
- `IncidentDetailModal.tsx` - Where it's displayed
- `backend/serverOG.js` - Backend endpoints
- `backend/attestationManager.js` - Signing logic
- `contracts/INFT.sol` - Smart contract with attestation storage

## 📊 What Happens Behind the Scenes

1. **Frontend** → POST `/api/incident/:id/attest`
2. **Backend** → Query 0G Compute for AI summary
3. **Backend** → Sign result with private key
4. **Backend** → Upload to 0G Storage
5. **Backend** → Call `contract.addAttestation()`
6. **Frontend** → Poll GET `/api/attest/:jobId`
7. **Frontend** → Display verified result
