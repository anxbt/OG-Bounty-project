import dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

async function testVISAWorkflow() {
  console.log('🧪 Testing VISA Feature Workflow\\n');

  try {
    // 1. Create test incident
    console.log('Step 1: Creating test incident...');
    const incident = {
      title: "GPT-4 Produced False Financial Information",
      severity: "high",
      description: "During a customer support interaction, GPT-4 generated false financial data with high confidence despite having outdated information. System confidence was abnormally low at 0.23.",
      ai_model: "GPT-4",
      ai_version: "0613",
      logs: "confidence_score: 0.23\\ntoken_count: 512\\ntemperature: 0.7"
    };

    const incidentRes = await fetch('http://localhost:8787/incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident)
    });
    const incidentData = await incidentRes.json();
    console.log('✅ Incident created:', incidentData);

    const tokenId = incidentData.tokenId || incidentData.token_id || incidentData.tokenId;
    if (!tokenId) {
      throw new Error('No tokenId returned from incident creation');
    }

    // Wait for NFT to be minted
    console.log('\\nWaiting 10s for NFT mint...');
    await new Promise(r => setTimeout(r, 10000));

    // 2. Request attestation
    console.log('\\nStep 2: Requesting attestation...');
    const attestRes = await fetch(`http://localhost:8787/api/incident/${tokenId}/attest`, { method: 'POST' });
    const attestData = await attestRes.json();
    const jobId = attestData.jobId;
    console.log('✅ Attestation job started:', jobId);

    // 3. Poll for completion
    console.log('\\nStep 3: Waiting for attestation...');
    let attestation = null;
    let attempts = 0;
    while (!attestation && attempts < 30) {
      const statusRes = await fetch(`http://localhost:8787/api/attest/${jobId}`);
      const job = await statusRes.json();

      if (job.status === 'complete') {
        attestation = job;
        break;
      } else if (job.status === 'failed') {
        throw new Error(`Attestation failed: ${job.error}`);
      }

      attempts++;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!attestation) {
      throw new Error('Attestation timed out');
    }

    console.log('✅ Attestation completed!');
    console.log('\\nAttestation details:');
    console.log('Summary:', attestation.summary);
    console.log('Severity Score:', attestation.severityScore);
    console.log('URI:', attestation.attestationUri);

    // 4. Verify signature
    console.log('\\nStep 4: Verifying signature...');
    const recoveredAddress = ethers.verifyMessage(
      ethers.toBeHex(attestation.hash),
      attestation.signature
    );

    const isValid = recoveredAddress.toLowerCase() === attestation.signer.toLowerCase();
    console.log('✅ Signature verification:', isValid ? 'Valid' : 'Invalid');

    console.log('\\n🎉 Test complete! All steps passed.');
    
  } catch (error) {
    console.error('\\n❌ Test failed:', error.message || error);
    process.exit(1);
  }
}

testVISAWorkflow();