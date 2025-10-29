# Current Features vs VISA Enhancement

## 📊 Current Features (Wave 4)

### Backend (serverOG.js)
```javascript
POST /incident
  - Accepts incident report
  - Stores data in memory
  - Mints NFT
  - Returns { incidentId, success }

GET /incidents
  - Lists all incidents
  - Returns array of incidents

GET /analytics
  - Uses 0G Compute
  - Analyzes ALL incidents together
  - Returns dashboard stats

GET /download?uri=0g://...
  - Downloads from 0G Storage
  - Returns file content
```

### Smart Contract (INFT.sol)
```solidity
contract INFT {
  - ERC721 base
  - Oracle verification
  - Metadata URI storage
  - Owner controls
}
```

### Frontend
```typescript
Components:
- IncidentForm: Submit new incidents
- AnalyticsDashboard: View all stats
- IncidentDetailModal: View single incident

Current Flow:
1. User fills incident form
2. Submits → NFT mints (10s)
3. Views in dashboard
4. Can see incident details
5. Dashboard shows global analytics
```

## 🚀 With VISA Enhancement (Wave 5)

### New Backend Endpoints
```javascript
POST /api/incident/:id/attest
  - Triggers AI summary for ONE incident
  - Returns jobId immediately
  - Background: signs & stores attestation

GET /api/attest/:jobId
  - Check attestation status
  - Returns when AI finishes
```

### Enhanced Smart Contract
```solidity
contract INFT {
  // Everything from before, plus:
  struct Attestation {
    bytes32 hash;        // Hash of summary
    string uri;          // 0G Storage link
    address signer;      // Who verified
    uint64 timestamp;    // When verified
  }
  
  mapping(uint256 => Attestation[]) attestations;
  event IncidentAttested(...);
}
```

### New Frontend Features
```typescript
Added:
- "Explain & Verify" button on incidents
- AttestationCard component showing:
  • AI-generated summary
  • Severity score
  • Verification badge
  • Signature details
  
Enhanced Flow:
1. User fills incident form
2. Submits → NFT mints (10s)
3. Views in dashboard
4. Clicks "Explain & Verify"
5. AI analyzes THIS incident (15s)
6. Shows verified summary + score
```

## 🎯 Visual "Before vs After"

### Current View (Wave 4)
```
📱 Incident Detail Modal
+------------------------+
|  Incident #42         |
|------------------------|
|  Title: GPT-4 Error   |
|  Severity: High       |
|  Description:         |
|  The model generated..|
|                      |
|  Logs: 0g://abc...   |
|                      |
|  NFT: Minted ✓       |
+------------------------+
```

### Enhanced View (Wave 5)
```
📱 Incident Detail Modal
+------------------------+
|  Incident #42         |
|------------------------|
|  Title: GPT-4 Error   |
|  Severity: High       |
|  Description:         |
|  The model generated..|
|                      |
|  Logs: 0g://abc...   |
|                      |
|  NFT: Minted ✓       |
|                      |
|  +------------------+ |
|  | 🤖 AI Attestation| |
|  |------------------| |
|  | "GPT-4 produced | |
|  | false financial | |
|  | info during     | |
|  | support chat."  | |
|  |                | |
|  | Score: 8.5/10  | |
|  | Verified ✅    | |
|  | Sign: 0x71a... | |
|  +------------------+ |
+------------------------+
```

## 🎯 User Journey Comparison

### Current (Wave 4)
1. User reports incident
2. Waits 10s for NFT mint
3. Views in dashboard
4. Only sees raw data
5. Has to read full description
6. No AI verification

### Enhanced (Wave 5)
1. User reports incident
2. Waits 10s for NFT mint
3. Views in dashboard
4. Clicks "Explain & Verify"
5. Gets AI summary in 15s
6. Sees severity score
7. Has cryptographic proof

## 🔧 Technical Changes Needed

### 1. Smart Contract Update
```diff
// INFT.sol
+ struct Attestation {...}
+ mapping(uint256 => Attestation[])
+ event IncidentAttested
+ function addAttestation()
```

### 2. Backend Additions
```diff
// serverOG.js
+ POST /api/incident/:id/attest
+ GET /api/attest/:jobId
+ attestationManager.js (new file)
```

### 3. Frontend Enhancements
```diff
// IncidentDetailModal.tsx
+ "Explain & Verify" button
+ AttestationCard component
+ Polling logic for job status
```

### 4. Integration Points
```diff
// Current workflow:
mintNFT → return

// New workflow:
mintNFT → return tokenId
        ↓
click "Explain"
        ↓
start attestation job
        ↓
poll until complete
        ↓
show verified result
```

## 🎯 Implementation Effort

Total Time: ~6 hours
- Contract changes: 30 min
- Backend endpoints: 2 hours
- Frontend component: 2 hours
- Testing: 1 hour
- Demo prep: 30 min

Would you like to start with any particular component?

```
Backend Flow:
  POST /api/incident/:id/attest
    ↓
  Trigger 0G Compute job
    ↓
  Receive {summary, severityScore, nodeId}
    ↓
  Create attestation.json
    ↓
  Hash + Sign with signer key
    ↓
  Upload to 0G Storage → attestationUri
    ↓
  Call contract addAttestation()
    or emit IncidentAttested event

Smart Contract:
  struct Attestation {
    bytes32 hash
    string uri
    address signer
    uint64 timestamp
  }
  mapping(uint256 => Attestation[]) attestations
  event IncidentAttested(tokenId, hash, signer, uri)

Frontend:
  "Explain & Verify" button
    ↓
  Display summary + severity
    ↓
  Verify signature
    ↓
  Show "Verified ✅"
```

---

## ✅ What's Great About This Approach

### 1. **Clean Separation of Concerns**
- Backend handles compute + storage + signing
- Contract handles state + events
- Frontend handles verification + UX
- **Score: 9/10** - Very modular

### 2. **Async by Design**
```
POST /incident returns immediately:
  { tokenId, incidentId }
  
User can click "Explain" anytime after:
  POST /api/incident/:id/attest
    returns immediately
    background job continues
  
This prevents blocking during compute queries
```
- **Score: 10/10** - Perfect for hackathon UX

### 3. **Cryptographically Sound**
```
attestation.json = {
  tokenId: 42,
  summary: "GPT-4 generated false info...",
  severityScore: 8.5,
  nodeId: "0x...",
  timestamp: 1729785600
}

hash = keccak256(JSON.stringify(attestation))
signature = sign(hash, signerPrivateKey)

Later: verify(hash, signature, signerPublicAddress) ✓
```
- **Score: 10/10** - No hash collision, tamper-proof

### 4. **Queryable On-Chain**
```
Attestation[] memory attests = contract.getAttestations(tokenId);

for (Attestation att : attests) {
  - Display summary from URI
  - Verify signer was authorized
  - Check timestamp is reasonable
}
```
- **Score: 9/10** - Good for forensics/audit

### 5. **Multiple Attestations Per Incident**
```
mapping(uint256 => Attestation[]) allows:

Day 1: iSentinel node attests
Day 7: Researcher re-analyzes, adds attestation
Day 30: Community votes, adds attestation

All linked to same tokenId
```
- **Score: 10/10** - Great for trust building

---

## 🤔 Potential Issues & Solutions

### Issue 1: Race Condition on /attest Call

**Problem:**
```
User mints → tokenId created but not returned yet
User clicks "Explain" → POST /api/incident/:id/attest
Backend: "tokenId not found yet!"
```

**Solution A (Recommended):**
```javascript
// POST /incident response includes tokenId
{
  success: true,
  tokenId: 42,          // ← Return immediately from mint script
  incidentId: "inc-...",
  logUri: "0g://...",
  message: "Minted! Click Explain to verify."
}

// Then POST /api/incident/42/attest just uses tokenId
```

**Solution B (Alternative):**
```javascript
// Track by incidentId instead of tokenId
POST /api/incident/incident-123/attest
  ↓
Backend: query("SELECT tokenId FROM incidents WHERE incidentId = ?")
  ↓
Proceed with attestation
```

**Recommendation:** Solution A is cleaner. Modify mintIncidentINFT.js to return tokenId immediately.

**Issue Score: 6/10 impact** | **Fix difficulty: 3/10** ✅

---

### Issue 2: Signer Key Management

**Problem:**
```javascript
// Where do you store signerPrivateKey?
signature = sign(hash, signerPrivateKey)

Option 1: In .env on backend
  → Exposed if repo leaked
  
Option 2: Hardware wallet
  → Complex, requires Ledger
  
Option 3: Per-session generated key
  → Not verifiable (signature changes each time)
```

**Recommended Solution (Hybrid):**
```javascript
// Use 0G Network's signer
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// All signatures use same wallet
const signature = await wallet.signMessage(attestationHash);
const recoveredAddress = ethers.verifyMessage(attestationHash, signature);

// Store recoveredAddress on-chain
// Anyone can verify: did this address really sign this hash?
```

**Why this works:**
- ✅ Private key only in .env (acceptable for testnet)
- ✅ Same address signs all attestations (consistency)
- ✅ Can verify without original key
- ✅ Easy transition to multisig later

**Actual code example:**
```javascript
// backend/attestationManager.js
import { ethers } from 'ethers';

class AttestationManager {
  constructor(signerPrivateKey) {
    this.signer = new ethers.Wallet(signerPrivateKey);
    this.signerAddress = this.signer.address;
  }

  async signAttestation(attestationData) {
    const hash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(attestationData))
    );
    
    // Sign with wallet
    const signature = await this.signer.signMessage(
      ethers.toBeHex(hash)
    );
    
    return {
      hash,
      signature,
      signer: this.signerAddress
    };
  }

  // Verification (frontend or backend)
  static verifyAttestation(hash, signature, expectedSigner) {
    const recoveredAddress = ethers.verifyMessage(
      ethers.toBeHex(hash),
      signature
    );
    
    return recoveredAddress.toLowerCase() === 
           expectedSigner.toLowerCase();
  }
}
```

**Issue Score: 7/10 impact** | **Fix difficulty: 4/10** ✅

---

### Issue 3: Compute Job Timing

**Problem:**
```
POST /api/incident/:id/attest
  ↓
Query 0G Compute (5-20 seconds)
  ↓
Response might fail or timeout
  ↓
What do we return to frontend?
```

**Solution (Recommended):**
```javascript
// Return job ID immediately, let frontend poll

POST /api/incident/42/attest
  ↓
Backend starts async job
  ↓
Returns { jobId: "job-abc-123", status: "pending" }
  ↓
Frontend polls GET /api/attest/job-abc-123
  ↓
Eventually returns { status: "complete", attestationUri, signature }
```

**Implementation:**
```javascript
// backend/serverOG.js
const attestationJobs = new Map();

app.post('/api/incident/:id/attest', (req, res) => {
  const tokenId = req.params.id;
  const jobId = `job-${Date.now()}`;
  
  // Start async - don't wait for it
  (async () => {
    try {
      // Query 0G Compute (may take 20 seconds)
      const summary = await computeAnalyticsZG.queryComputeModel(prompt);
      const severityScore = extractScore(summary);
      
      // Sign and upload
      const hash = ethers.keccak256(summary);
      const signature = await signer.signMessage(hash);
      const attestationUri = await storage.upload(summary, hash, signature);
      
      // Record on-chain
      await contract.addAttestation(tokenId, hash, attestationUri);
      
      // Update job status
      attestationJobs.set(jobId, {
        status: 'complete',
        attestationUri,
        signature,
        hash
      });
    } catch (error) {
      attestationJobs.set(jobId, {
        status: 'failed',
        error: error.message
      });
    }
  })(); // Fire and forget
  
  // Return immediately
  res.json({
    jobId,
    status: 'pending',
    message: 'Attestation job started'
  });
});

// Polling endpoint
app.get('/api/attest/:jobId', (req, res) => {
  const job = attestationJobs.get(req.params.jobId);
  res.json(job || { status: 'not-found' });
});
```

**Frontend:**
```typescript
// Poll for completion
async function waitForAttestation(jobId) {
  while (true) {
    const response = await fetch(`/api/attest/${jobId}`);
    const job = await response.json();
    
    if (job.status === 'complete') {
      return job;
    }
    if (job.status === 'failed') {
      throw new Error(job.error);
    }
    
    // Wait 2 seconds, then poll again
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Usage
const job = await fetch(`/api/incident/${tokenId}/attest`).then(r => r.json());
const attestation = await waitForAttestation(job.jobId);
```

**Issue Score: 8/10 impact** | **Fix difficulty: 5/10** ✅

---

### Issue 4: Contract State vs Events

**Problem:**
```
Your design shows both:
  - mapping(uint256 => Attestation[]) state
  - event IncidentAttested(...) events

Storage cost on-chain:
  - State: ~20,000 gas per attestation
  - Events: ~1,500 gas per attestation
  
Which should be primary?
```

**Recommendation: Hybrid Approach**

```solidity
// Primary storage: Events (cheap, queryable off-chain)
event IncidentAttested(
  indexed uint256 tokenId,
  bytes32 indexed hash,
  address indexed signer,
  string uri,
  uint64 timestamp
);

// Secondary storage: Mapping (for smart contract logic)
mapping(uint256 => Attestation[]) public attestations;

// When adding attestation:
function addAttestation(
  uint256 tokenId,
  bytes32 hash,
  string memory uri
) external onlyAuthorized {
  address signer = msg.sender;
  uint64 timestamp = uint64(block.timestamp);
  
  // Store in mapping
  attestations[tokenId].push(Attestation({
    hash: hash,
    uri: uri,
    signer: signer,
    timestamp: timestamp
  }));
  
  // Emit event
  emit IncidentAttested(tokenId, hash, signer, uri, timestamp);
}

// Query: Can use event logs without paying more gas
// Example: ethers.queryFilter(contract.filters.IncidentAttested(tokenId))
```

**Why this works:**
- ✅ Storage for on-chain verification
- ✅ Events for off-chain indexing (The Graph, Dune, etc.)
- ✅ Cheaper than storing everything
- ✅ More queryable

**Issue Score: 5/10 impact** | **Fix difficulty: 3/10** ✅

---

## 🏆 Scoring Your Overall Design

| Aspect | Score | Notes |
|--------|-------|-------|
| **Architecture** | 9/10 | Clean separation, good async design |
| **Cryptography** | 9/10 | Sound signing + verification |
| **Gas Efficiency** | 7/10 | Could use events more, state less |
| **UX** | 9/10 | Frontend verification button is excellent |
| **Scalability** | 8/10 | Multiple attestations per incident is smart |
| **Security** | 7/10 | Private key management needs care |
| **Hackathon Viability** | 9/10 | Very implementable in 2-3 days |

**Overall: 8.3/10 - This is a solid, production-adjacent design** ✅

---

## 🚀 Implementation Roadmap

### Phase 1: Core (Day 1 - 4 hours)

```
1. Modify INFT.sol
   ✅ Add Attestation struct
   ✅ Add attestations mapping
   ✅ Add addAttestation() function
   ✅ Emit IncidentAttested event
   
2. Create attestationManager.js
   ✅ Sign attestations
   ✅ Verify signatures
   ✅ Manage signer key
   
3. Add /api/incident/:id/attest endpoint
   ✅ Start async 0G Compute job
   ✅ Return jobId immediately
```

### Phase 2: Integration (Day 1 - 3 hours)

```
4. Modify POST /incident
   ✅ Return tokenId in response
   ✅ Add optional _startAttestation flag
   
5. Add polling endpoints
   ✅ GET /api/attest/:jobId
   ✅ Track job status
   
6. 0G Storage integration
   ✅ Upload attestation JSON
   ✅ Get back 0g:// URI
```

### Phase 3: Frontend (Day 2 - 2 hours)

```
7. Create AttestationCard component
   ✅ Display summary
   ✅ Show severity score
   ✅ Verify signature button
   ✅ Poll for completion
   
8. Modify IncidentDetailModal
   ✅ Add "Generate Explanation" button
   ✅ Show loading state
   ✅ Display verified badge
```

### Phase 4: Testing (Day 2 - 2 hours)

```
9. End-to-end test
   ✅ Create incident
   ✅ Request attestation
   ✅ Wait for completion
   ✅ Verify on-chain
   
10. Demo flow
    ✅ Record 30-second video
    ✅ Test with 3+ incidents
    ✅ Show failed case handling
```

**Total: ~11 hours** (vs 13 hours for event-driven option)

---

## 📊 Design Comparison: Your Approach vs Others

### Option 1: Synchronous (Blocking)
```
POST /incident
  ↓
Wait for 0G Compute
  ↓
Return when done (20+ seconds)
  ↓
User sees spinner
```
- ❌ Poor UX
- ✅ Simple code
- ✅ No polling needed

### Option 2: Your Approach (Polling)
```
POST /incident
  ↓
Return tokenId immediately
  ↓
User clicks "Explain"
  ↓
POST /api/incident/:id/attest
  ↓
Backend starts job, returns jobId
  ↓
Frontend polls until done
```
- ✅ Great UX
- ✅ Moderate complexity
- ✅ No external queue needed
- ⚠️  Polling could be expensive (mitigate: 2-5 sec intervals)

### Option 3: Event-Driven + Queue (Bull/Redis)
```
POST /incident
  ↓
Emit AttestationRequested event
  ↓
Queue picks it up
  ↓
WebSocket pushes update to frontend
```
- ✅ Best UX
- ✅ No polling
- ❌ Requires Redis
- ❌ More infrastructure

---

## 💡 Smart Contract Implementation

### Minimal INFT.sol Changes

```solidity
// Add to INFT.sol
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract INFT is ERC721 {
  
  // NEW: Attestation struct
  struct Attestation {
    bytes32 hash;
    string uri;
    address signer;
    uint64 timestamp;
  }
  
  // NEW: Store attestations
  mapping(uint256 tokenId => Attestation[]) public attestations;
  
  // NEW: Event for indexing
  event IncidentAttested(
    indexed uint256 tokenId,
    bytes32 indexed hash,
    address indexed signer,
    string uri,
    uint64 timestamp
  );
  
  // NEW: Authorized signers
  mapping(address => bool) public authorizedSigners;
  address public owner;
  
  modifier onlyAuthorized() {
    require(
      authorizedSigners[msg.sender] || msg.sender == owner,
      "Not authorized to attest"
    );
    _;
  }
  
  constructor() {
    owner = msg.sender;
    authorizedSigners[msg.sender] = true;
  }
  
  // NEW: Add attestation
  function addAttestation(
    uint256 tokenId,
    bytes32 hash,
    string memory uri
  ) external onlyAuthorized {
    require(_ownerOf(tokenId) != address(0), "Token doesn't exist");
    
    Attestation memory att = Attestation({
      hash: hash,
      uri: uri,
      signer: msg.sender,
      timestamp: uint64(block.timestamp)
    });
    
    attestations[tokenId].push(att);
    
    emit IncidentAttested(tokenId, hash, msg.sender, uri, uint64(block.timestamp));
  }
  
  // NEW: Get all attestations for incident
  function getAttestations(uint256 tokenId) 
    external 
    view 
    returns (Attestation[] memory) 
  {
    return attestations[tokenId];
  }
  
  // NEW: Add signer
  function addSigner(address signer) external {
    require(msg.sender == owner, "Only owner");
    authorizedSigners[signer] = true;
  }
}
```

**Gas Costs:**
- Deploy with changes: ~50K gas
- addAttestation() call: ~20K gas per attestation
- getAttestations() view: Free (read-only)

---

## 🎯 Integration Points

### Backend Flow (Complete)

```javascript
// 1. POST /incident (existing, minor tweak)
app.post('/incident', async (req, res) => {
  const incident = req.body;
  
  // Store + mint
  const incidentId = storeIncident(incident);
  mintIncident(incident, async (code, tokenId) => {
    if (code === 0) {
      res.json({
        success: true,
        incidentId,
        tokenId,  // NEW: Return immediately
        message: "Incident minted! Click 'Explain' to verify."
      });
    }
  });
});

// 2. NEW: POST /api/incident/:id/attest
app.post('/api/incident/:id/attest', async (req, res) => {
  const tokenId = parseInt(req.params.id);
  const jobId = `job-${Date.now()}-${Math.random()}`;
  
  // Start job (don't wait)
  (async () => {
    try {
      // Query 0G Compute
      const prompt = `Analyze this incident: ${JSON.stringify(req.body)}`;
      const response = await computeAnalyticsZG.queryComputeModel(prompt);
      
      // Parse response
      const parsed = JSON.parse(response);
      const { summary, severityScore } = parsed;
      
      // Create attestation object
      const attestation = {
        tokenId,
        summary,
        severityScore,
        timestamp: Date.now(),
        analysis: parsed
      };
      
      // Sign
      const { hash, signature, signer } = 
        await attestationManager.signAttestation(attestation);
      
      // Upload to 0G Storage
      const attestationUri = await storage.upload({
        ...attestation,
        hash,
        signature,
        signer
      });
      
      // Record on-chain
      await contract.addAttestation(tokenId, hash, attestationUri);
      
      // Update job
      jobs.set(jobId, {
        status: 'complete',
        attestationUri,
        signature,
        hash,
        signer
      });
      
    } catch (error) {
      jobs.set(jobId, {
        status: 'failed',
        error: error.message
      });
    }
  })();
  
  // Return immediately
  res.json({
    jobId,
    status: 'pending',
    message: 'Attestation generation started'
  });
});

// 3. NEW: GET /api/attest/:jobId
app.get('/api/attest/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ status: 'not-found' });
  }
  res.json(job);
});
```

### Frontend Flow (Complete)

```typescript
// IncidentDetailModal.tsx

const [attestation, setAttestation] = useState(null);
const [isLoading, setIsLoading] = useState(false);

async function requestAttestation() {
  setIsLoading(true);
  
  try {
    // Start job
    const jobRes = await fetch(
      `/api/incident/${tokenId}/attest`,
      { method: 'POST' }
    );
    const { jobId } = await jobRes.json();
    
    // Poll for completion
    let completed = false;
    while (!completed) {
      const statusRes = await fetch(`/api/attest/${jobId}`);
      const status = await statusRes.json();
      
      if (status.status === 'complete') {
        // Verify signature locally
        const isValid = ethers.verifyMessage(
          ethers.toBeHex(status.hash),
          status.signature
        );
        
        setAttestation({
          ...status,
          isVerified: isValid
        });
        completed = true;
      } else if (status.status === 'failed') {
        throw new Error(status.error);
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  } catch (error) {
    console.error('Attestation failed:', error);
  } finally {
    setIsLoading(false);
  }
}

return (
  <div>
    {attestation ? (
      <div className="attestation-card">
        <h3>✅ Verified Explanation</h3>
        <p>{attestation.summary}</p>
        <p>Severity: {attestation.severityScore}/10</p>
        <p>Signed by: {attestation.signer}</p>
        <button onClick={() => navigator.clipboard.writeText(attestation.signature)}>
          Copy Signature
        </button>
      </div>
    ) : (
      <button onClick={requestAttestation} disabled={isLoading}>
        {isLoading ? 'Generating...' : 'Explain & Verify'}
      </button>
    )}
  </div>
);
```

---

## 🎬 Demo Flow (30 seconds)

```
[User shows incident form]
"So we have this incident report form..."

[Submits]
"Click submit... NFT mints immediately"

[Shows dashboard with new incident]
"It appears on the dashboard"

[Clicks "Explain & Verify"]
"Now click the 'Explain' button..."

[Shows loading spinner]
"This triggers our attestation job..."

[10 seconds pass]

[Verification badge appears]
"And we get an AI-generated explanation with a severity score"

[Shows signature]
"Each explanation is cryptographically signed by our 0G node"

[Shows contract explorer]
"And the attestation is recorded on-chain, linked to the NFT"

[Shows all 3: computation + storage + chain]
"This demonstrates all three layers of the 0G stack:"
"- 0G Compute: Generated the summary"
"- 0G Storage: Stored the attestation"
"- 0G Blockchain: Linked them together"
```

---

## 📋 Your Approach: Final Assessment

### ✅ Pros
1. **Async by design** - Doesn't block user
2. **Cryptographically sound** - Signatures are verifiable
3. **Queryable** - Can retrieve all attestations for audit
4. **Scalable** - Can handle multiple attestations per incident
5. **Hackathon-friendly** - Doable in 11 hours
6. **Impressive demo** - Shows all 3 0G components
7. **Production-ready** - Can evolve to multisig later

### ⚠️ Considerations
1. Private key management (use .env for now)
2. Race condition on tokenId (return from mint endpoint)
3. Compute job timeout (add fallback summary)
4. Storage upload failures (add retry logic)
5. Polling overhead (keep intervals reasonable: 2-5 sec)

### 🎯 Recommendation
**Go with this approach!** It's well-designed, implementable, and impressive. The only things to add:
1. Better error handling
2. Fallback summaries if 0G Compute fails
3. Job cleanup (delete old jobs after 1 hour)
4. Rate limiting on /attest endpoint

---

## 🔧 Next Steps

1. **Agree on this design?** (Yes/No)
2. **Update INFT.sol** with Attestation struct (30 min)
3. **Create attestationManager.js** with signing logic (1 hour)
4. **Modify serverOG.js** with new endpoints (1.5 hours)
5. **Create frontend component** (1.5 hours)
6. **Test end-to-end** (1 hour)
7. **Record demo** (30 min)

**Total: ~6 hours if we move fast**

---

**What do you think? Any changes you'd make to this design?**
