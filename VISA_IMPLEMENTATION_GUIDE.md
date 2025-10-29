# 🎯 VISA - Verifiable Incident Summary & Attestation
## Implementation Guide for Wave 5 Hackathon

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Steps](#implementation-steps)
4. [Code Examples](#code-examples)
5. [Alternative Approaches](#alternative-approaches)
6. [Integration Timeline](#integration-timeline)
7. [Testing Strategy](#testing-strategy)

---

## 🎯 Overview

### What is VISA?

**VISA** (Verifiable Incident Summary & Attestation) is an automatic workflow triggered when an iNFT is minted. It:

1. **Generates a Summary**: Uses 0G Compute (gpt-oss-120b) to create a concise human-readable summary of the incident
2. **Scores Severity**: AI determines a canonical severity score (1-10) based on the incident details
3. **Creates Attestation**: Packages the summary + score + metadata hash into a structured record
4. **Signs the Record**: Cryptographically signs the attestation with the backend wallet
5. **Stores in 0G Storage**: Uploads the signed attestation to decentralized storage
6. **Links On-Chain**: Emits a smart contract event with the attestation URI and signature

### Why VISA Matters

| Aspect | Benefit |
|--------|---------|
| **Trust** | Network consensus on what happened, not just incident occurrence |
| **Integration** | Showcases all three 0G pillars: Compute (AI) + Storage (attestation) + Chain (verification) |
| **User Value** | Immediate AI-generated summary without manual categorization |
| **Compliance** | Cryptographic proof of severity assessment for regulatory audit trails |
| **Scalability** | Decentralized attestation replaces centralized authority |
| **Demo Impact** | Single workflow demonstrates complete 0G stack in production use |

### Data Flow Diagram

```
User Reports Incident
        ↓
Frontend calls POST /incident
        ↓
Backend: Upload logs → 0G Storage (returns 0g://logURI)
        ↓
Backend: Mint iNFT → emit iNFT_MINTED event
        ↓
[NEW] VISA Workflow Triggered:
        ├─→ Read incident data
        ├─→ Send to 0G Compute (gpt-oss-120b)
        ├─→ Receive summary + severity score
        ├─→ Create attestation object
        ├─→ Sign with backend wallet (ECDSA)
        ├─→ Upload signed attestation → 0G Storage
        ├─→ Emit ATTESTATION_CREATED event with:
        │   ├─ tokenId
        │   ├─ attestationURI (0g://...)
        │   ├─ severityScore (1-10)
        │   └─ signature (0x...)
        ↓
Frontend listens for ATTESTATION_CREATED
        ↓
Display:
- AI Summary
- Severity Score
- Attestation Link (clickable to verify)
- Signature (copyable for verification)
```

---

## 🏗️ Architecture

### Smart Contract Changes

#### New Event to Add to INFT.sol

```solidity
event AttestationCreated(
    uint256 indexed tokenId,
    string indexed attestationURI,
    uint8 severityScore,
    bytes signature,
    uint256 timestamp
);
```

#### New Function to Add to INFT.sol

```solidity
/**
 * Called by authorized attestor (backend) to link attestation
 */
function recordAttestation(
    uint256 tokenId,
    string calldata attestationURI,
    uint8 severityScore,
    bytes calldata signature
) external onlyOwner {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    
    // Verify signature is from backend wallet (optional but recommended)
    // bytes32 messageHash = keccak256(abi.encodePacked(tokenId, attestationURI, severityScore));
    // require(recoverSigner(messageHash, signature) == backend_wallet, "Invalid signature");
    
    emit AttestationCreated(
        tokenId,
        attestationURI,
        severityScore,
        signature,
        block.timestamp
    );
}
```

### Backend Architecture

```
/backend
├── serverOG.js (existing)
├── computeAnalyticsZG.js (existing)
├── computeAttestationZG.js (NEW - 300-400 lines)
│   ├─ initializeAttestationBroker()
│   ├─ generateIncidentSummary()
│   ├─ scoreSeverity()
│   ├─ createAttestation()
│   └─ signAttestation()
├── attestationManager.js (NEW - 200-300 lines)
│   ├─ AttestationManager class
│   ├─ triggerVISA()
│   ├─ uploadAttestationToStorage()
│   ├─ recordAttestationOnChain()
│   └─ verifyAttestation()
└── eventListener.js (NEW - 100-150 lines)
    ├─ Watch for iNFT_MINTED events
    └─ Trigger AttestationManager.triggerVISA()
```

### Storage Structure

**Attestation JSON in 0G Storage (uploaded as `0g://...`):**

```json
{
  "version": "1.0.0",
  "attestationType": "visa",
  "incidentTokenId": 42,
  "timestamp": 1730150400,
  "incident": {
    "title": "GPT Model Hallucination",
    "severity": "critical",
    "model": "GPT-4",
    "description": "Model generated false financial data",
    "logHash": "0g://0xabc123..."
  },
  "attestation": {
    "summary": "AI model GPT-4 produced factually incorrect financial information during customer query. Confidence score was abnormally low (0.23), indicating model uncertainty. Root cause likely insufficient training data for financial domain.",
    "severityScore": 8.5,
    "categories": ["hallucination", "financial", "critical"],
    "confidence": 0.92,
    "reasoning": "High severity due to financial impact, high confidence due to clear hallucination pattern"
  },
  "signature": {
    "algorithm": "ECDSA",
    "pubKey": "0x1234...backend_wallet_public_key",
    "sig": "0x5678...actual_signature",
    "message": "hash of attestation data"
  },
  "verification": {
    "computeJobId": "0g-compute-1730150300",
    "computeModel": "gpt-oss-120b",
    "teeAttestation": "optional TEE proof from compute network"
  }
}
```

---

## 🔧 Implementation Steps

### Phase 1: Smart Contract Updates (2-3 hours)

**Step 1.1: Update INFT.sol**

Add to existing contract:
- New event `AttestationCreated`
- New function `recordAttestation()`
- Optional: signature verification using ECDSA recovery

```solidity
// Add imports
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// In contract
using ECDSA for bytes32;

// Add state variable to track backend wallet
address public attestationSigner;

// Constructor update
constructor(..., address _attestationSigner) ... {
    attestationSigner = _attestationSigner;
}

// New function
function recordAttestation(
    uint256 tokenId,
    string calldata attestationURI,
    uint8 severityScore,
    bytes calldata signature
) external onlyOwner {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    require(severityScore >= 1 && severityScore <= 10, "Invalid score");
    
    // Optional: Verify signature
    bytes32 msgHash = keccak256(abi.encodePacked(tokenId, attestationURI, severityScore));
    bytes32 ethSignedMsg = msgHash.toEthSignedMessageHash();
    address signer = ethSignedMsg.recover(signature);
    require(signer == attestationSigner, "Invalid attestation signature");
    
    emit AttestationCreated(tokenId, attestationURI, severityScore, signature, block.timestamp);
}
```

**Step 1.2: Deploy Updated Contract**

```bash
npx hardhat run scripts/deployINFT.js --network og
# Update INFT_ADDRESS in .env with new contract address
```

### Phase 2: Backend Compute Integration (3-4 hours)

**Step 2.1: Create computeAttestationZG.js**

```javascript
// backend/computeAttestationZG.js
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const ATTESTATION_SYSTEM_PROMPT = `You are an AI safety analyst specializing in incident assessment.
Your task is to analyze AI incidents and provide:
1. A concise 2-3 sentence summary of what happened
2. A severity score from 1-10 based on impact
3. Key categories/tags
4. Confidence in your assessment

Respond ONLY in valid JSON format without markdown.`;

let attestationBroker = null;

export async function initializeAttestationBroker() {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    attestationBroker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Attestation broker initialized');
    return attestationBroker;
  } catch (error) {
    console.error('❌ Failed to initialize attestation broker:', error.message);
    return null;
  }
}

export async function generateIncidentSummary(incident) {
  if (!attestationBroker) {
    await initializeAttestationBroker();
  }
  
  if (!attestationBroker) {
    console.log('⚠️  Broker unavailable, using fallback summary');
    return generateFallbackSummary(incident);
  }

  try {
    const prompt = formatIncidentForAnalysis(incident);
    
    console.log(`🧠 Generating VISA attestation for incident "${incident.title}"`);
    
    const messages = [
      {
        role: 'system',
        content: ATTESTATION_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Query 0G Compute (gpt-oss-120b)
    const response = await queryComputeNetwork(messages);
    
    if (!response) {
      return generateFallbackSummary(incident);
    }

    // Parse response
    try {
      const analysis = JSON.parse(response);
      return {
        summary: analysis.summary || 'No summary available',
        severityScore: Math.min(10, Math.max(1, Math.round(analysis.severity_score * 10) / 10)),
        categories: analysis.categories || [],
        confidence: analysis.confidence || 0.7,
        reasoning: analysis.reasoning || 'AI assessment'
      };
    } catch (parseError) {
      console.warn('⚠️  Failed to parse AI response, using fallback');
      return generateFallbackSummary(incident);
    }
    
  } catch (error) {
    console.error('❌ Error generating attestation:', error.message);
    return generateFallbackSummary(incident);
  }
}

function formatIncidentForAnalysis(incident) {
  return `Analyze this AI incident and respond in JSON format:

Title: ${incident.title}
Severity Level: ${incident.severity}
AI Model: ${incident.ai_model || 'Unknown'}
Description: ${incident.description || 'No description'}
Error Logs: ${incident.logs ? incident.logs.substring(0, 500) : 'No logs'}

Provide JSON with:
- "summary": 2-3 sentence summary (string)
- "severity_score": numeric score 0-1 (float)
- "categories": array of tags
- "confidence": confidence in assessment 0-1
- "reasoning": why you assigned this score`;
}

async function queryComputeNetwork(messages) {
  // Use existing compute query logic from computeAnalyticsZG.js
  // Returns AI response string
}

function generateFallbackSummary(incident) {
  return {
    summary: `${incident.ai_model || 'AI model'} reported a ${incident.severity} incident: ${incident.description ? incident.description.substring(0, 100) : 'Technical failure detected'}.`,
    severityScore: incident.severity === 'critical' ? 8.5 : incident.severity === 'warning' ? 5.0 : 2.5,
    categories: [incident.severity, 'automated-fallback'],
    confidence: 0.6,
    reasoning: 'Fallback analysis (0G Compute unavailable)'
  };
}

export default {
  initializeAttestationBroker,
  generateIncidentSummary
};
```

**Step 2.2: Create attestationManager.js**

```javascript
// backend/attestationManager.js
import { ethers } from 'ethers';
import OGStorageManager from '../lib/ogStorage.js';
import { generateIncidentSummary } from './computeAttestationZG.js';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

class AttestationManager {
  constructor(inftContractAddress) {
    this.inftAddress = inftContractAddress;
    this.storageManager = new OGStorageManager();
  }

  async triggerVISA(incident, tokenId) {
    console.log(`\n🎯 VISA Workflow Started for token #${tokenId}`);
    
    try {
      // Step 1: Generate summary and severity using 0G Compute
      console.log('⏳ Step 1: Generating AI summary...');
      const attestation = await generateIncidentSummary(incident);
      
      // Step 2: Create attestation object
      console.log('📦 Step 2: Creating attestation object...');
      const attestationObj = this.createAttestationObject(incident, tokenId, attestation);
      
      // Step 3: Sign attestation
      console.log('✍️  Step 3: Signing attestation...');
      const signature = this.signAttestation(attestationObj);
      
      // Step 4: Upload to 0G Storage
      console.log('📤 Step 4: Uploading attestation to 0G Storage...');
      const attestationURI = await this.uploadAttestationToStorage(attestationObj, signature);
      
      // Step 5: Record on-chain
      console.log('⛓️  Step 5: Recording on-chain...');
      await this.recordAttestationOnChain(tokenId, attestationURI, attestation.severityScore, signature);
      
      console.log('✅ VISA attestation complete!\n');
      
      return {
        success: true,
        attestationURI,
        severityScore: attestation.severityScore,
        signature
      };
      
    } catch (error) {
      console.error('❌ VISA workflow failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  createAttestationObject(incident, tokenId, attestation) {
    return {
      version: '1.0.0',
      attestationType: 'visa',
      incidentTokenId: tokenId,
      timestamp: Math.floor(Date.now() / 1000),
      incident: {
        title: incident.title,
        severity: incident.severity,
        model: incident.ai_model,
        description: incident.description,
        logHash: incident.logUri // Reference to 0G Storage logs
      },
      attestation: {
        summary: attestation.summary,
        severityScore: attestation.severityScore,
        categories: attestation.categories,
        confidence: attestation.confidence,
        reasoning: attestation.reasoning
      },
      verification: {
        computeJobId: `visa-${tokenId}-${Date.now()}`,
        computeModel: 'gpt-oss-120b',
        network: '0G Galileo'
      }
    };
  }

  signAttestation(attestationObj) {
    // Create message hash
    const messageString = JSON.stringify(attestationObj);
    const messageHash = ethers.id(messageString);
    
    // Sign with backend wallet
    const signature = wallet.signingKey.sign(messageHash).serialized;
    
    console.log(`✅ Signed attestation with ${wallet.address}`);
    
    return signature;
  }

  async uploadAttestationToStorage(attestationObj, signature) {
    try {
      const attestationData = JSON.stringify({
        ...attestationObj,
        signature: {
          algorithm: 'ECDSA',
          pubKey: wallet.signingKey.publicKey,
          sig: signature,
          signerAddress: wallet.address
        }
      }, null, 2);

      const fileName = `attestation-${attestationObj.incidentTokenId}-${attestationObj.timestamp}.json`;
      const uri = await this.storageManager.uploadContent(attestationData, fileName);
      
      console.log(`✅ Uploaded attestation to 0G Storage: ${uri}`);
      
      return uri;
      
    } catch (error) {
      console.error('❌ Failed to upload attestation:', error.message);
      throw error;
    }
  }

  async recordAttestationOnChain(tokenId, attestationURI, severityScore, signature) {
    try {
      const inftABI = [
        'function recordAttestation(uint256 tokenId, string calldata attestationURI, uint8 severityScore, bytes calldata signature) external'
      ];
      
      const contract = new ethers.Contract(this.inftAddress, inftABI, wallet);
      
      const tx = await contract.recordAttestation(
        tokenId,
        attestationURI,
        Math.round(severityScore),
        signature
      );
      
      console.log(`✅ Recorded attestation on-chain: ${tx.hash}`);
      
      // Wait for confirmation
      await tx.wait();
      console.log('✅ Attestation confirmed on-chain');
      
    } catch (error) {
      console.error('❌ Failed to record attestation on-chain:', error.message);
      throw error;
    }
  }

  async verifyAttestation(attestationURI, signature) {
    try {
      // Download attestation from storage
      const attestationData = await this.storageManager.downloadContent(attestationURI);
      const attestation = JSON.parse(attestationData);
      
      // Verify signature
      const messageString = JSON.stringify({
        version: attestation.version,
        attestationType: attestation.attestationType,
        incidentTokenId: attestation.incidentTokenId,
        timestamp: attestation.timestamp,
        incident: attestation.incident,
        attestation: attestation.attestation,
        verification: attestation.verification
      });
      
      const messageHash = ethers.id(messageString);
      const recoveredAddress = ethers.recoverAddress(messageHash, signature);
      
      if (recoveredAddress.toLowerCase() !== wallet.address.toLowerCase()) {
        throw new Error('Signature verification failed');
      }
      
      console.log('✅ Attestation verified successfully');
      return attestation;
      
    } catch (error) {
      console.error('❌ Attestation verification failed:', error.message);
      throw error;
    }
  }
}

export default AttestationManager;
```

### Phase 3: Event Listener Setup (2-3 hours)

**Step 3.1: Create eventListener.js**

```javascript
// backend/eventListener.js
import { ethers } from 'ethers';
import AttestationManager from './attestationManager.js';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
const inftAddress = process.env.INFT_ADDRESS;
const attestationManager = new AttestationManager(inftAddress);

const INFT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event MetadataUpdated(uint256 indexed tokenId, bytes32 newHash)',
  'function getEncryptedURI(uint256 tokenId) external view returns (string)',
  'function tokenURI(uint256 tokenId) external view returns (string)'
];

// In-memory cache of processed tokens to avoid duplicates
const processedTokens = new Set();

export async function startEventListener() {
  try {
    const contract = new ethers.Contract(inftAddress, INFT_ABI, provider);
    
    console.log('👂 Starting iNFT event listener for VISA workflow...');
    
    // Listen for new mints (Transfer events from 0x0)
    contract.on('Transfer', async (from, to, tokenId) => {
      // Only process if minting (from is 0x0)
      if (from !== '0x0000000000000000000000000000000000000000') {
        return;
      }
      
      const tokenIdStr = tokenId.toString();
      if (processedTokens.has(tokenIdStr)) {
        console.log(`⏭️  Token #${tokenIdStr} already processed, skipping`);
        return;
      }
      
      processedTokens.add(tokenIdStr);
      
      try {
        console.log(`\n🎪 Detected new iNFT mint: token #${tokenIdStr}`);
        
        // Retrieve incident data
        const incident = await retrieveIncidentData(tokenId);
        
        if (!incident) {
          console.log('⚠️  Could not retrieve incident data');
          return;
        }
        
        // Trigger VISA workflow
        await attestationManager.triggerVISA(incident, tokenId.toNumber());
        
      } catch (error) {
        console.error(`❌ Error processing token #${tokenIdStr}:`, error.message);
        processedTokens.delete(tokenIdStr); // Retry next time
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start event listener:', error.message);
  }
}

async function retrieveIncidentData(tokenId) {
  // Retrieve from memory storage or blockchain metadata
  // This assumes incidents are stored in the in-memory store
  // In production, this would query a database or blockchain state
  return {
    title: 'Sample Incident',
    severity: 'critical',
    ai_model: 'GPT-4',
    description: 'Sample description',
    logs: 'Sample logs'
  };
}

export default { startEventListener };
```

**Step 3.2: Update serverOG.js to start listener**

Add to the existing server startup:

```javascript
import { startEventListener } from './eventListener.js';

// In server startup code
console.log('🚀 Starting iSentinel backend server...');
if (process.env.INFT_ADDRESS) {
  startEventListener().catch(err => 
    console.error('Failed to start event listener:', err)
  );
}
```

### Phase 4: Frontend Integration (2-3 hours)

**Step 4.1: Add Attestation Display Component**

```typescript
// frontend/src/components/AttestationBadge.tsx
import React, { useState, useEffect } from 'react';
import { fetchFromStorage } from '../services/api';

interface AttestationBadgeProps {
  attestationURI: string;
  severityScore: number;
  signature: string;
}

export const AttestationBadge: React.FC<AttestationBadgeProps> = ({
  attestationURI,
  severityScore,
  signature
}) => {
  const [attestation, setAttestation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const loadAttestation = async () => {
      try {
        const data = await fetchFromStorage(attestationURI);
        setAttestation(data);
      } catch (error) {
        console.error('Failed to load attestation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttestation();
  }, [attestationURI]);

  if (loading) {
    return <div className="text-gray-400">Loading attestation...</div>;
  }

  const getSeverityColor = (score: number) => {
    if (score >= 8) return 'bg-red-100 text-red-800 border-red-300';
    if (score >= 6) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  return (
    <div className="mt-4 border-2 rounded-lg p-4 bg-slate-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">
            🎯 VISA Attestation
            <span className={`px-2 py-1 rounded text-sm font-bold border ${getSeverityColor(severityScore)}`}>
              Score: {severityScore.toFixed(1)}/10
            </span>
          </h4>
          
          {attestation && (
            <>
              <div className="bg-white p-3 rounded border border-gray-200 mb-3">
                <p className="text-sm italic text-gray-700">
                  "{attestation.attestation.summary}"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {Math.round(attestation.attestation.confidence * 100)}%
                </p>
              </div>

              {expanded && (
                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <span className="font-semibold">Categories:</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {attestation.attestation.categories.map((cat: string) => (
                        <span key={cat} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Analysis:</span>
                    <p className="text-gray-600 mt-1">{attestation.attestation.reasoning}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Compute Job:</span>
                    <p className="text-gray-600 font-mono text-xs">{attestation.verification.computeJobId}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(signature)}
          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          title="Copy signature for verification"
        >
          Copy Signature
        </button>
        <a
          href={`https://chainscan-galileo.0g.ai/address/${attestationURI}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        >
          Verify Attestation
        </a>
      </div>
    </div>
  );
};
```

**Step 4.2: Add to IncidentDetailModal.tsx**

```typescript
// In IncidentDetailModal.tsx, add to the incident detail display:

import { AttestationBadge } from './AttestationBadge';

// Inside the modal, add after severity badge:
{incident.attestationURI && (
  <AttestationBadge
    attestationURI={incident.attestationURI}
    severityScore={incident.severityScore}
    signature={incident.attestationSignature}
  />
)}
```

---

## 💡 Alternative Approaches

### Approach A: Synchronous (Current Recommendation)
- Compute summary immediately after NFT mint
- Block user until attestation complete
- **Pros**: Instant results, no race conditions
- **Cons**: Slower UX, ties up backend resource
- **Best for**: Enterprise use where accuracy > speed

### Approach B: Asynchronous Job Queue
- Queue VISA job after NFT mint
- Process in background with Bull/Redis
- Frontend polls for completion
- **Pros**: Fast UX, scalable
- **Cons**: Complex state management
- **Best for**: High-volume production systems

### Approach C: Off-Chain Attestation Service
- Separate service with higher compute quota
- Submits attestations weekly/daily batch
- **Pros**: Lower cost, batch processing
- **Cons**: Delayed attestations, eventual consistency
- **Best for**: Cost-sensitive applications

### Approach D: Hybrid Oracle Model
- Multiple attestors (different backends) vote
- Consensus-based severity scoring
- **Pros**: Decentralized, tamper-proof
- **Cons**: Most complex, slower
- **Best for**: High-stakes compliance scenarios

**Recommendation**: Start with Approach A (synchronous), migrate to B (async queue) at scale.

---

## 📅 Integration Timeline

### Week 1: Smart Contract Setup
- Day 1-2: Update INFT.sol with event + function
- Day 3-4: Deploy and test on Galileo testnet
- Day 5: Write contract tests and verification

### Week 2: Backend Implementation
- Day 1-2: Implement computeAttestationZG.js
- Day 3-4: Implement attestationManager.js
- Day 5: Integration tests with 0G Compute

### Week 3: Event Listener & Integration
- Day 1-2: Create eventListener.js
- Day 3-4: Test full workflow end-to-end
- Day 5: Optimize and add error handling

### Week 4: Frontend Display
- Day 1-2: Create AttestationBadge component
- Day 3-4: Integrate with IncidentDetailModal
- Day 5: User acceptance testing, polish UI

### Week 5: Documentation & Launch
- Day 1-2: Write user documentation
- Day 3-4: Create demo video
- Day 5: Prepare for demo and iterate on feedback

---

## 🧪 Testing Strategy

### Unit Tests

```javascript
// tests/attestationManager.test.js
describe('AttestationManager', () => {
  let manager;

  before(async () => {
    manager = new AttestationManager(INFT_ADDRESS);
  });

  it('should create valid attestation object', async () => {
    const incident = { title: 'Test', severity: 'critical' };
    const attestation = { summary: 'Test summary', severityScore: 8.5 };
    
    const obj = manager.createAttestationObject(incident, 1, attestation);
    
    assert.equal(obj.version, '1.0.0');
    assert.equal(obj.incidentTokenId, 1);
    assert.equal(obj.attestation.severityScore, 8.5);
  });

  it('should sign attestation correctly', () => {
    const obj = { test: 'data' };
    const signature = manager.signAttestation(obj);
    
    assert(signature.startsWith('0x'));
    assert(signature.length > 100);
  });

  it('should verify signature', async () => {
    const obj = { test: 'data' };
    const signature = manager.signAttestation(obj);
    
    const isValid = await manager.verifyAttestation(obj, signature);
    assert(isValid);
  });
});
```

### Integration Tests

```javascript
// tests/visa-workflow.test.js
describe('VISA Workflow E2E', () => {
  it('should complete full VISA workflow', async () => {
    // 1. Create incident
    const incident = { /* ... */ };
    
    // 2. Mint NFT (triggers VISA)
    const tokenId = await mintTestIncident(incident);
    
    // 3. Wait for attestation
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. Verify attestation exists on-chain
    const attestationURI = await contract.getAttestation(tokenId);
    assert(attestationURI.startsWith('0g://'));
    
    // 5. Download and verify attestation
    const attestation = await downloadAttestation(attestationURI);
    assert(attestation.severityScore >= 1 && attestation.severityScore <= 10);
  });
});
```

### Manual Testing Checklist

- [ ] Deploy updated INFT contract
- [ ] Create test incident
- [ ] Verify attestation event emitted within 10 seconds
- [ ] Check attestation URI in 0G Storage
- [ ] Download and verify attestation JSON structure
- [ ] Verify signature validity
- [ ] Test frontend display of attestation badge
- [ ] Test with multiple incidents (concurrency)
- [ ] Test fallback when 0G Compute unavailable
- [ ] Test signature verification on multiple blockchains

---

## 📊 Performance Metrics

### Expected Timing

| Step | Time |
|------|------|
| Incident submission | 5-10s |
| 0G Compute query | 3-8s |
| Attestation upload | 2-4s |
| On-chain recording | 8-15s |
| **Total VISA workflow** | **18-37s** |

### Optimization Tips

1. **Parallel uploads**: Start storage upload before on-chain recording
2. **Caching**: Cache summaries for identical incidents
3. **Batch recording**: Submit multiple attestations per transaction
4. **Compression**: Gzip JSON before uploading to storage
5. **CDN**: Use CDN for attestation downloads

---

## 🎯 Expected Outcomes

### Demo Impact
- "Watch as the AI automatically analyzes and attests to this incident in under 30 seconds"
- Shows complete 0G stack in action: Compute + Storage + Chain
- Judges see real AI scoring, not hardcoded values

### Integration Points
- ✅ **0G Compute**: Generates summary + severity (AI-powered)
- ✅ **0G Storage**: Stores signed attestation (immutable)
- ✅ **0G Blockchain**: Emits event + stores URI (verifiable)
- ✅ **Oracle**: Could use for signature verification (advanced)

### Real-World Applications
- Insurance companies auto-verify claim incidents
- Regulatory audits with cryptographic proof
- AI model comparison (which vendor's model fails most?)
- Automated incident categorization
- Liability defense ("our system automatically scored this incident")

---

## 🚀 Next Steps

1. **Review this guide** with your team
2. **Start with Phase 1** (smart contract updates)
3. **Deploy to Galileo testnet** for testing
4. **Complete Phase 2** (backend compute integration)
5. **Test thoroughly** before mainnet deployment
6. **Record demo video** showing full VISA workflow
7. **Get feedback** from judges and iterate

---

## 📞 Troubleshooting

### Issue: Attestation not creating
**Solution**: Check backend logs for:
- 0G Compute broker initialization errors
- Storage upload failures
- On-chain transaction failures

### Issue: Signature verification fails
**Solution**: 
- Verify wallet address matches contract `attestationSigner`
- Ensure consistent message formatting before/after signing

### Issue: Frontend doesn't show attestation
**Solution**:
- Check event listener is running
- Verify contract event is being emitted
- Check frontend is listening to correct contract address

---

## 📚 References

- [0G Compute Documentation](https://docs.0g.ai/compute)
- [ECDSA Signing in Solidity](https://docs.openzeppelin.com/contracts/4.x/api/utils#ECDSA)
- [ethers.js Signing & Verification](https://docs.ethers.org/v6/api/signers/#Signer)
- [0G Storage SDK](https://github.com/0glabs/0g-storage-client)

---

**Built for 0G Hackathon - Wave 5**

*VISA: Making AI incident attestation decentralized, verifiable, and instantly actionable.*
