# VISA Quick Start Template
## Copy-Paste Ready Implementation

This file contains skeleton code you can copy directly into your project for the simplest (Option 2 - Synchronous) VISA implementation.

---

## Part 1: Smart Contract Update (INFT.sol)

Add this to your existing INFT.sol contract:

```solidity
// Add these imports if not already present
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// Add this event
event AttestationCreated(
    uint256 indexed tokenId,
    string indexed attestationURI,
    uint8 severityScore,
    bytes signature,
    uint256 timestamp
);

// Add this state variable
address public attestationSigner;

// Update constructor to accept attestationSigner
constructor(
    string memory name,
    string memory symbol,
    address _oracle,
    address _attestationSigner
) ERC721(name, symbol) Ownable(msg.sender) {
    oracle = _oracle;
    attestationSigner = _attestationSigner;
}

// Add this function
function recordAttestation(
    uint256 tokenId,
    string calldata attestationURI,
    uint8 severityScore,
    bytes calldata signature
) external onlyOwner {
    require(_ownerOf(tokenId) != address(0), "Token does not exist");
    require(severityScore >= 1 && severityScore <= 10, "Score must be 1-10");
    
    // Optional: Verify signature
    // bytes32 msgHash = keccak256(abi.encodePacked(tokenId, attestationURI, severityScore));
    // bytes32 ethSigned = msgHash.toEthSignedMessageHash();
    // address signer = ethSigned.recover(signature);
    // require(signer == attestationSigner, "Invalid signature");
    
    emit AttestationCreated(
        tokenId,
        attestationURI,
        severityScore,
        signature,
        block.timestamp
    );
}
```

**Deploy:**
```bash
npx hardhat run scripts/deployINFT.js --network og
# Update INFT_ADDRESS in .env
```

---

## Part 2: Backend - Compute Integration (computeAttestationZG.js)

Create new file: `backend/computeAttestationZG.js`

```javascript
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

let broker = null;

export async function initializeComputeBroker() {
  if (broker) return broker;
  
  try {
    const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    broker = await createZGComputeNetworkBroker(wallet);
    console.log('✅ Compute broker ready');
    return broker;
  } catch (error) {
    console.error('❌ Compute broker failed:', error.message);
    return null;
  }
}

export async function generateVISA(incident) {
  const broker = await initializeComputeBroker();
  
  if (!broker) {
    return getFallbackVISA(incident);
  }

  try {
    console.log('🧠 Generating VISA attestation...');
    
    const prompt = `Analyze this AI incident and respond ONLY in JSON format:

Title: ${incident.title}
Severity: ${incident.severity}
Model: ${incident.ai_model || 'Unknown'}
Description: ${incident.description || 'No description'}
Logs: ${incident.logs ? incident.logs.substring(0, 300) : 'No logs'}

Response format MUST be:
{
  "summary": "1-2 sentence summary",
  "severity_score": 0.85,
  "categories": ["tag1", "tag2"],
  "confidence": 0.92,
  "reasoning": "explanation"
}`;

    const messages = [
      {
        role: 'system',
        content: 'You are an AI safety expert. Analyze incidents and respond ONLY with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Query 0G Compute Network
    const response = await queryGPT(broker, messages);
    
    if (!response) {
      return getFallbackVISA(incident);
    }

    // Parse response
    try {
      const visa = JSON.parse(response);
      return {
        summary: visa.summary || 'Analysis generated',
        severityScore: Math.min(10, Math.max(1, visa.severity_score * 10)),
        categories: visa.categories || [],
        confidence: visa.confidence || 0.7,
        reasoning: visa.reasoning || 'AI assessment'
      };
    } catch (err) {
      console.warn('⚠️  Parse error, using fallback');
      return getFallbackVISA(incident);
    }
    
  } catch (error) {
    console.error('❌ VISA generation failed:', error.message);
    return getFallbackVISA(incident);
  }
}

async function queryGPT(broker, messages) {
  try {
    const provider = '0xf07240Efa67755B5311bc75784a061eDB47165Dd'; // gpt-oss-120b
    
    const { endpoint, model } = await broker.inference.getServiceMetadata(provider);
    const headers = await broker.inference.getRequestHeaders(provider, JSON.stringify(messages));
    
    const res = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        messages,
        model,
        temperature: 0.5,
        max_tokens: 500
      })
    });

    if (!res.ok) return null;
    
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
    
  } catch (error) {
    console.error('Query failed:', error.message);
    return null;
  }
}

function getFallbackVISA(incident) {
  return {
    summary: `${incident.ai_model || 'Model'} reported a ${incident.severity} incident.`,
    severityScore: incident.severity === 'critical' ? 8.5 : 5.0,
    categories: [incident.severity, 'fallback'],
    confidence: 0.6,
    reasoning: 'Fallback analysis (compute unavailable)'
  };
}

export default { generateVISA, initializeComputeBroker };
```

---

## Part 3: Backend - Attestation Manager (attestationManager.js)

Create new file: `backend/attestationManager.js`

```javascript
import { ethers } from 'ethers';
import OGStorageManager from '../lib/ogStorage.js';
import { generateVISA } from './computeAttestationZG.js';
import dotenv from 'dotenv';

dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.OG_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

class AttestationManager {
  constructor(inftAddress) {
    this.inftAddress = inftAddress;
    this.storage = new OGStorageManager();
  }

  async createVISA(incident, tokenId) {
    try {
      console.log(`\n🎯 Creating VISA for token #${tokenId}...`);
      
      // Step 1: Generate summary via 0G Compute
      console.log('Step 1: Generating summary...');
      const visa = await generateVISA(incident);
      
      // Step 2: Create attestation object
      console.log('Step 2: Creating attestation...');
      const attestation = {
        version: '1.0.0',
        type: 'visa',
        tokenId,
        timestamp: Math.floor(Date.now() / 1000),
        incident: {
          title: incident.title,
          severity: incident.severity,
          model: incident.ai_model
        },
        visa: {
          summary: visa.summary,
          severityScore: visa.severityScore,
          categories: visa.categories,
          confidence: visa.confidence
        }
      };
      
      // Step 3: Sign attestation
      console.log('Step 3: Signing...');
      const messageHash = ethers.id(JSON.stringify(attestation));
      const signature = wallet.signingKey.sign(messageHash).serialized;
      
      // Step 4: Upload signed attestation
      console.log('Step 4: Uploading to storage...');
      const attestationJSON = JSON.stringify({
        ...attestation,
        signature,
        signer: wallet.address
      }, null, 2);
      
      const uri = await this.storage.uploadContent(
        attestationJSON,
        `visa-${tokenId}-${Date.now()}.json`
      );
      
      // Step 5: Record on-chain
      console.log('Step 5: Recording on-chain...');
      await this.recordOnChain(tokenId, uri, visa.severityScore, signature);
      
      console.log('✅ VISA complete!\n');
      
      return {
        success: true,
        attestationURI: uri,
        severityScore: visa.severityScore,
        signature,
        visa
      };
      
    } catch (error) {
      console.error('❌ VISA failed:', error.message);
      throw error;
    }
  }

  async recordOnChain(tokenId, attestationURI, severityScore, signature) {
    try {
      const abi = [
        'function recordAttestation(uint256 tokenId, string calldata attestationURI, uint8 severityScore, bytes calldata signature) external'
      ];
      
      const contract = new ethers.Contract(this.inftAddress, abi, wallet);
      
      const tx = await contract.recordAttestation(
        tokenId,
        attestationURI,
        Math.round(severityScore),
        signature
      );
      
      console.log(`📝 Tx: ${tx.hash}`);
      
      const receipt = await tx.wait();
      if (receipt) {
        console.log(`✅ On-chain: Block ${receipt.blockNumber}`);
      }
      
    } catch (error) {
      console.error('On-chain error:', error.message);
      throw error;
    }
  }
}

export default AttestationManager;
```

---

## Part 4: Backend - Modify POST /incident Endpoint

Edit: `backend/serverOG.js`

Find the existing `/incident` POST handler and modify it:

```javascript
// Add import at top
import AttestationManager from './attestationManager.js';

// In your POST /incident handler, after minting NFT:
async function handleIncident(req, res) {
  try {
    const incident = req.body;
    
    // ... existing code: upload logs, mint NFT ...
    const { logs, title, severity, ai_model, description } = incident;
    
    // Upload logs to 0G Storage
    const logData = JSON.stringify({ logs, timestamp: Date.now() });
    const logUri = await storageManager.uploadContent(logData, `logs-${Date.now()}.json`);
    
    // Mint NFT
    const tokenId = await mintNFT({
      ...incident,
      logUri
    });
    
    console.log(`✅ NFT minted: #${tokenId}`);
    
    // NEW: Create VISA attestation
    try {
      const manager = new AttestationManager(process.env.INFT_ADDRESS);
      const visaResult = await manager.createVISA(incident, tokenId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        tokenId,
        logUri,
        attestation: visaResult
      }));
      
    } catch (visaError) {
      console.warn('⚠️  VISA failed, but NFT minted successfully');
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        tokenId,
        logUri,
        attestationError: visaError.message
      }));
    }
    
  } catch (error) {
    console.error('Incident handler error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ok: false,
      error: error.message
    }));
  }
}
```

---

## Part 5: Frontend - Create AttestationBadge.tsx

Create: `frontend/src/components/AttestationBadge.tsx`

```typescript
import React, { useEffect, useState } from 'react';

interface AttestationBadgeProps {
  attestationURI?: string;
  severityScore?: number;
  signature?: string;
  summary?: string;
  categories?: string[];
  confidence?: number;
}

export const AttestationBadge: React.FC<AttestationBadgeProps> = ({
  attestationURI,
  severityScore = 0,
  signature = '',
  summary = '',
  categories = [],
  confidence = 0
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!severityScore && !summary) {
    return null;
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
            {severityScore > 0 && (
              <span className={`px-2 py-1 rounded text-sm font-bold border ${getSeverityColor(severityScore)}`}>
                {severityScore.toFixed(1)}/10
              </span>
            )}
          </h4>

          {summary && (
            <div className="bg-white p-3 rounded border border-gray-200 mb-3">
              <p className="text-sm italic text-gray-700">"{summary}"</p>
              {confidence > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Confidence: {Math.round(confidence * 100)}%
                </p>
              )}
            </div>
          )}

          {expanded && (
            <div className="space-y-2 text-sm mb-3">
              {categories.length > 0 && (
                <div>
                  <span className="font-semibold">Categories:</span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {summary && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {expanded ? '- Details' : '+ Details'}
          </button>
        )}
        
        {signature && (
          <button
            onClick={() => navigator.clipboard.writeText(signature)}
            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            title="Copy signature"
          >
            📋 Signature
          </button>
        )}

        {attestationURI && (
          <a
            href={`#`}
            className="px-3 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
            onClick={() => alert(`URI: ${attestationURI}`)}
          >
            🔗 Verify
          </a>
        )}
      </div>
    </div>
  );
};
```

---

## Part 6: Frontend - Add to IncidentDetailModal.tsx

In your `IncidentDetailModal.tsx`, import and add:

```typescript
import { AttestationBadge } from './AttestationBadge';

// Inside your incident detail display, add:
<AttestationBadge
  attestationURI={incident.attestationURI}
  severityScore={incident.severityScore}
  signature={incident.attestationSignature}
  summary={incident.visaSummary}
  categories={incident.visaCategories}
  confidence={incident.visaConfidence}
/>
```

---

## Part 7: Testing

Create: `test-visa.js`

```javascript
import axios from 'axios';

async function testVISA() {
  console.log('🧪 Testing VISA workflow...\n');
  
  const testIncident = {
    title: 'GPT Model Hallucination',
    severity: 'critical',
    ai_model: 'GPT-4',
    description: 'Model generated false financial information',
    logs: 'ERROR: confidence=0.23, validation=FAILED'
  };

  try {
    console.log('1️⃣ Submitting incident...');
    const response = await axios.post('http://localhost:8787/incident', testIncident);
    
    console.log('2️⃣ Response received:');
    console.log(`   Token ID: ${response.data.tokenId}`);
    console.log(`   Log URI: ${response.data.logUri}`);
    
    if (response.data.attestation) {
      console.log('\n3️⃣ VISA Attestation:');
      console.log(`   Summary: ${response.data.attestation.visa.summary}`);
      console.log(`   Score: ${response.data.attestation.severityScore}/10`);
      console.log(`   Categories: ${response.data.attestation.visa.categories.join(', ')}`);
      console.log(`   Signature: ${response.data.attestation.signature.substring(0, 20)}...`);
      
      console.log('\n✅ VISA workflow complete!');
    } else if (response.data.attestationError) {
      console.log(`⚠️  Attestation failed: ${response.data.attestationError}`);
      console.log('✅ NFT minted successfully (VISA is optional)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

testVISA();
```

**Run it:**
```bash
node test-visa.js
```

---

## Installation Checklist

- [ ] Update `.env` with `INFT_ADDRESS`
- [ ] Run `npm install @0glabs/0g-serving-broker` (in backend)
- [ ] Copy `computeAttestationZG.js` to backend folder
- [ ] Copy `attestationManager.js` to backend folder
- [ ] Update INFT.sol contract
- [ ] Deploy new contract
- [ ] Update `serverOG.js` endpoint
- [ ] Create `AttestationBadge.tsx` component
- [ ] Update `IncidentDetailModal.tsx`
- [ ] Run `test-visa.js` to verify

---

## Expected Output

When you submit an incident:

```
🎯 Creating VISA for token #42...
Step 1: Generating summary...
🧠 Generating VISA attestation...
Step 2: Creating attestation...
Step 3: Signing...
Step 4: Uploading to storage...
📤 Uploaded to 0G Storage: 0g://0xabc123...
Step 5: Recording on-chain...
📝 Tx: 0x5678...
✅ On-chain: Block 2847291
✅ VISA complete!
```

Then in UI:

```
🎯 VISA Attestation    Score: 8.5/10
"Model GPT-4 produced factually incorrect financial 
information. Confidence was abnormally low at 0.23."

Confidence: 92%

+ Details    📋 Signature    🔗 Verify
```

---

## Common Issues & Fixes

**Issue: "Compute broker failed"**
- Solution: Check PRIVATE_KEY in .env, ensure balance > 0.01 OG

**Issue: "Token does not exist"**
- Solution: Verify tokenId returned from mint is correct

**Issue: Signature verification fails**
- Solution: Ensure wallet hasn't changed between mint and attestation

**Issue: Storage upload fails**
- Solution: Check 0G Storage network connectivity, try smaller file first

---

## Next Steps

1. **Test this locally** - run `test-visa.js`
2. **Record a demo** - show full flow end-to-end
3. **Get feedback** - iterate based on judge comments
4. **Upgrade to async** - implement Option 1 if time allows
5. **Document** - create user guide for VISA

---

*This template gives you everything needed for a working VISA implementation in <1 day of work.*

Good luck with your demo! 🚀
