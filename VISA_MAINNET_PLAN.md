# VISA Mainnet Enhancement Plan
**Target**: Transform incident viewer into full production-ready VISA pipeline  
**Deadline**: Final wave submission  
**Stack**: 0G Blockchain + Storage + Compute, React/TypeScript frontend, Node/Express backend

---

## 🎯 Feature Breakdown & Implementation Strategy

### 1. Traceable Proof Link (ZK or 0G Verify Hash)
**Goal**: Each verified incident shows clickable hash → 0G Storage proof/metadata JSON  
**Why**: Trustless proof-of-verification, judges can inspect raw attestation data

#### Implementation Steps:
1. **Backend** (`attestationManager.js`):
   - ✅ Already returns `attestationUri` (0g://... format)
   - Add `metadataUri` field pointing to full incident JSON
   - Store both URIs in attestation record

2. **Smart Contract** (`INFT.sol`):
   - ✅ Already stores `attestationUri` in `addAttestation`
   - Verify we emit event with both hash + URI for indexing

3. **Frontend** (`AttestationCard.tsx`):
   - Add "View Proof" button below verification badge
   - Button opens modal or new tab with:
     - Attestation hash (copy button)
     - Direct 0G Storage link (`https://gateway.0g.ai/<hash>`)
     - JSON viewer showing full attestation structure
   - Add "Download Metadata" option (triggers backend `/download?uri=...`)

4. **Verification Flow**:
   ```
   User clicks "View Proof" → 
   Fetch attestationUri from contract → 
   Download JSON from 0G Storage → 
   Display formatted proof with signature verification status
   ```

#### Success Criteria:
- [ ] Every attestation card shows "View Proof" link
- [ ] Clicking opens modal with full JSON + 0G Storage hash
- [ ] External users can verify proof independently via 0G gateway
- [ ] Console logs show: `✅ Proof fetched from 0g://<hash>`

---

### 2. Gemini API Health Monitoring
**Goal**: Add console logs proving Gemini fallback works (not rate-limited)  
**Why**: Transparency for judges/debugging, shows robust fallback system

#### Implementation Steps:
1. **Backend** (`serverOG.js`):
   - Add detailed logging in `analyzeWithGemini()`:
     ```javascript
     console.log('🔮 Gemini API Request:', {
       model: 'gemini-1.5-flash',
       promptLength: prompt.length,
       timestamp: new Date().toISOString()
     });
     
     // After response
     console.log('✅ Gemini API Response:', {
       status: 'success',
       tokensUsed: result.usageMetadata,
       responseTime: `${Date.now() - startTime}ms`,
       rateLimitRemaining: response.headers['x-ratelimit-remaining']
     });
     ```
   - Catch rate limit errors explicitly:
     ```javascript
     if (error.status === 429) {
       console.error('🚫 Gemini Rate Limited:', {
         retryAfter: error.headers['retry-after'],
         dailyQuota: error.details
       });
     }
     ```

2. **Status Endpoint**:
   - Add `/api/health` endpoint:
     ```json
     {
       "compute": { "primary": "unavailable", "legacy": "active" },
       "gemini": { "status": "active", "lastUsed": "2025-10-30T..." },
       "storage": { "status": "active" }
     }
     ```

#### Success Criteria:
- [ ] Backend logs show Gemini API calls with token counts
- [ ] 429 errors are caught and logged with retry-after time
- [ ] Health endpoint returns real-time AI service status
- [ ] Console shows: `✅ Gemini API Response: { tokensUsed: 234 }`

---

### 3. Reproducibility Layer (Re-run Inference)
**Goal**: "Re-run Inference" button → recompute incident analysis → compare results  
**Why**: Proves AI output is verifiable/reproducible (production-ready signal)

#### Implementation Steps:
1. **Backend** (`serverOG.js`):
   - New endpoint: `POST /api/incident/:tokenId/recompute`
   - Fetch incident from chain (same as attest flow)
   - Run AI analysis (0G Compute → Gemini → basic fallback)
   - Return comparison:
     ```json
     {
       "original": { "summary": "...", "severityScore": 9 },
       "recomputed": { "summary": "...", "severityScore": 9 },
       "match": true,
       "reproducible": true
     }
     ```

2. **Frontend** (`IncidentDetailModal.tsx`):
   - Add button next to "Explain & Verify": "🔄 Re-run Inference"
   - Show loading spinner during recompute (can take 10-30s)
   - Display comparison table:
     ```
     Original Analysis    | Re-run Analysis     | Match
     --------------------------------------------------
     Severity: 9/10       | Severity: 9/10      | ✓
     Summary: AI fail...  | Summary: AI fail... | ✓
     Source: Gemini AI    | Source: Gemini AI   | ✓
     ```
   - If mismatch, highlight differences in yellow
   - Add tooltip: "Reproducibility proves AI analysis is deterministic"

3. **Caching Strategy**:
   - Store re-run results in backend cache (30min TTL)
   - Prevent spam: max 1 re-run per incident per 5 minutes

#### Success Criteria:
- [ ] Re-run button appears on all verified incidents
- [ ] Clicking triggers new AI analysis (backend logs confirm)
- [ ] UI shows side-by-side comparison (original vs re-run)
- [ ] Match percentage calculated (e.g., "95% reproducible")
- [ ] Works even if original used different AI (0G Compute vs Gemini)
- [ ] Console logs: `🔄 Re-run complete: 100% match with original`

---

### 4. Wallet/Account Context Enhancement
**Goal**: Display reporter wallet + link to on-chain NFT + ownership proof  
**Why**: Web3-native accountability, judges see full on-chain trail

#### Implementation Steps:
1. **Frontend** (`IncidentDetailModal.tsx`):
   - Add "Reporter" section:
     ```tsx
     <div className="flex items-center gap-2">
       <span>Reporter:</span>
       <code className="bg-gray-800 px-2 py-1 rounded">
         {truncateAddress(incident.owner)}
       </code>
       <button onClick={() => copyToClipboard(incident.owner)}>
         📋 Copy
       </button>
       <a href={`https://explorer.0g.ai/address/${incident.owner}`}>
         🔗 View on Explorer
       </a>
     </div>
     ```

2. **NFT Ownership Badge**:
   - Query contract: `const owner = await contract.ownerOf(tokenId)`
   - If connected wallet === owner:
     ```tsx
     <span className="bg-green-600 px-2 py-1 rounded">
       ✓ You own this incident NFT
     </span>
     ```
   - Otherwise:
     ```tsx
     <span className="text-gray-400">
       Owned by {truncateAddress(owner)}
     </span>
     ```

3. **Link to OpenSea/NFT Marketplace** (bonus):
   - Button: "View NFT →" linking to 0G NFT marketplace
   - Shows incident as tradeable/transferrable asset

4. **Attestor Badge**:
   - Show who generated the attestation (backend signer)
   - Display: "Verified by: 0x47E8... (Authorized Attestor)"

#### Success Criteria:
- [ ] Reporter address displayed with copy + explorer link
- [ ] Ownership badge shows if connected wallet owns NFT
- [ ] Attestor address visible (proves authorized verification)
- [ ] All addresses clickable → 0G explorer
- [ ] Console logs: `✅ Incident #3 owned by 0xeB18...`

---

### 5. Explainer Overlay (Human-Readable Context)
**Goal**: Tooltip/sidebar explaining WHY incident was flagged  
**Why**: UX polish, makes AI decisions transparent/auditable

#### Implementation Steps:
1. **Backend Enhancement** (`serverOG.js`):
   - Expand AI prompt to request explanation:
     ```javascript
     const prompt = `Analyze this AI incident and explain WHY it's flagged:
     
     Title: ${incident.title}
     Description: ${incident.description}
     Logs: ${incident.logs}
     
     Return JSON:
     {
       "summary": "1-2 sentence summary",
       "severityScore": 1-10,
       "flagReason": "Why this incident matters (e.g., model mismatch, safety violation)",
       "technicalDetails": "Deeper technical explanation",
       "categories": ["category1", "category2"]
     }`;
     ```

2. **Frontend** (`AttestationCard.tsx`):
   - Add info icon (ℹ️) next to severity score
   - Hover → tooltip shows:
     ```
     Why Flagged:
     "Model confidence mismatch detected between GPT-4 (92%) 
     and Claude (67%), suggesting potential hallucination risk."
     
     Technical Details:
     "Log analysis shows prediction variance exceeding 25% 
     threshold, typical of adversarial input patterns."
     ```
   - Make tooltip dismissible for mobile

3. **Severity Color Coding**:
   - 8-10 (Critical): Red background
   - 5-7 (Warning): Yellow background
   - 1-4 (Info): Blue background
   - Add legend at bottom of dashboard

4. **Category Tags**:
   - Display AI-generated categories as badges:
     ```tsx
     <div className="flex gap-2">
       {categories.map(cat => (
         <span className="bg-purple-600 px-2 py-1 rounded text-xs">
           {cat}
         </span>
       ))}
     </div>
     ```

#### Success Criteria:
- [ ] Info icon (ℹ️) appears next to every severity score
- [ ] Hovering shows human-readable explanation
- [ ] Explanation includes WHY + technical details
- [ ] Severity colors match score (red/yellow/blue)
- [ ] Category tags displayed (e.g., "hallucination", "bias")
- [ ] Console logs: `✅ Explainer loaded: ${flagReason}`

---

## 🔄 Implementation Order (Priority)

### Phase 1: Core Verification (Day 1)
1. ✅ Gemini API health monitoring (quick win)
2. ✅ Traceable proof links (high judge impact)
3. ✅ Wallet/account context (Web3 native)

### Phase 2: Production Readiness (Day 2)
4. ✅ Reproducibility layer (re-run inference)
5. ✅ Explainer overlay (UX polish)

### Phase 3: Testing & Polish (Day 3)
- End-to-end testing of all features
- Video demo recording
- Documentation update

---

## ✅ Testing Checklist

### Per-Feature Tests:

**Proof Links**:
- [ ] Click "View Proof" → modal opens
- [ ] Copy hash button works
- [ ] 0G Storage link downloads JSON
- [ ] External verification (paste hash in 0G gateway)

**Gemini Monitoring**:
- [ ] Backend logs show Gemini API calls
- [ ] Rate limit errors caught gracefully
- [ ] Health endpoint returns correct status

**Re-run Inference**:
- [ ] Button triggers new analysis
- [ ] Comparison table shows original vs new
- [ ] Match percentage calculated
- [ ] Works with different AI sources

**Wallet Context**:
- [ ] Reporter address displays correctly
- [ ] Ownership badge shows for owner
- [ ] Explorer links work
- [ ] Attestor address visible

**Explainer**:
- [ ] Info icon shows tooltip
- [ ] Explanation is human-readable
- [ ] Severity colors match scores
- [ ] Category tags display

### Integration Tests:
- [ ] Full flow: Report → Verify → View Proof → Re-run → Compare
- [ ] Works with 0G Compute (when funded)
- [ ] Works with Gemini fallback
- [ ] Works with basic fallback
- [ ] Mobile responsive

---

## 📊 Success Metrics (Demo Ready)

### Judging Criteria Alignment:
1. **Trustless Verification** ✓
   - Every attestation has proof hash
   - External users can verify independently

2. **Production Readiness** ✓
   - Re-run inference proves reproducibility
   - Health monitoring shows system status
   - Multi-tier AI fallbacks working

3. **Web3 Native** ✓
   - Wallet integration + ownership display
   - On-chain proof links
   - 0G explorer integration

4. **UX Excellence** ✓
   - Human-readable explanations
   - Visual severity indicators
   - Transparent AI decision-making

### Demo Script:
```
1. Show dashboard with incidents
2. Click incident → "Explain & Verify"
3. Show attestation card with severity + summary
4. Click "View Proof" → open 0G Storage JSON
5. Copy hash → verify externally on 0G gateway
6. Click "Re-run Inference" → show comparison (100% match)
7. Hover info icon → show explanation tooltip
8. Point to wallet address + ownership badge
9. Check backend logs → show Gemini API working
10. Final statement: "Fully verifiable, reproducible AI incident reporting on 0G Stack"
```

---

## 🚀 Quick Start Implementation

### Step 1: Backend Logging (5 mins)
```javascript
// In serverOG.js, enhance Gemini logging
console.log('🔮 Gemini API Request:', { model, promptLength, timestamp });
// After response
console.log('✅ Gemini Response:', { tokensUsed, responseTime });
```

### Step 2: Proof Links UI (20 mins)
```tsx
// In AttestationCard.tsx
<button onClick={() => openProofModal(attestation.attestationUri)}>
  🔗 View Proof
</button>
```

### Step 3: Re-run Endpoint (30 mins)
```javascript
// Backend: POST /api/incident/:tokenId/recompute
const recomputed = await runAIAnalysis(incident);
res.json({ original: cached, recomputed, match: compare(original, recomputed) });
```

### Step 4: Wallet Display (15 mins)
```tsx
// In IncidentDetailModal.tsx
<div>Reporter: {incident.owner}</div>
<a href={`https://explorer.0g.ai/address/${incident.owner}`}>View on Explorer</a>
```

### Step 5: Explainer Tooltip (25 mins)
```tsx
// Add tooltip with flagReason from AI analysis
<Tooltip content={analysis.flagReason}>
  <InfoIcon />
</Tooltip>
```

---

## 📝 Documentation Updates

After implementation, update:
1. `README.md` → Add "VISA Features" section
2. `DEMO_SCRIPT.md` → Step-by-step walkthrough
3. `ARCHITECTURE.md` → Verification flow diagram
4. Video demo → Record 2-min feature showcase

---

## 🎬 Ready to Start?

Confirm plan approval and I'll begin implementation in this order:
1. Gemini logging (immediate feedback)
2. Proof links (high impact)
3. Wallet context (quick win)
4. Re-run inference (core feature)
5. Explainer overlay (polish)

Each feature will be:
- Implemented ✅
- Tested ✅
- Verified in console logs ✅
- Confirmed working end-to-end ✅

Let's ship mainnet-ready VISA! 🚀
