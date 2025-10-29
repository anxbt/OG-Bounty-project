import { ethers } from 'ethers';
import OGStorageManager from '../lib/ogStorage.js';
import dotenv from 'dotenv';

dotenv.config();

class AttestationManager {
  constructor(privateKey) {
    if (!privateKey) {
      throw new Error('PRIVATE_KEY required for attestation signing');
    }
    
    this.signer = new ethers.Wallet(privateKey);
    this.signerAddress = this.signer.address;
    this.storage = new OGStorageManager();
  }

  async createAttestation(incident, aiSummary) {
    const attestation = {
      tokenId: incident.tokenId,
      incidentId: incident.incidentId,
      summary: aiSummary.summary,
      severityScore: aiSummary.severityScore,
      timestamp: Date.now(),
      signer: this.signerAddress,
      analysis: aiSummary
    };

    // Hash the attestation
    const attestationString = JSON.stringify(attestation);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(attestationString));

    // Sign the hash
    const signature = await this.signer.signMessage(ethers.toBeHex(hash));

    // Add signature to attestation
    const signedAttestation = {
      ...attestation,
      hash,
      signature
    };

    // Upload to 0G Storage
    const attestationUri = await this.storage.uploadToOG(
      JSON.stringify(signedAttestation),
      'attestation.json'
    );

    return {
      attestationUri,
      hash,
      signature,
      signer: this.signerAddress,
      summary: aiSummary.summary,
      severityScore: aiSummary.severityScore
    };
  }

  static verifyAttestation(hash, signature, expectedSigner) {
    try {
      const recoveredAddress = ethers.verifyMessage(
        ethers.toBeHex(hash),
        signature
      );
      
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch (error) {
      console.error('Attestation verification failed:', error);
      return false;
    }
  }
}

export default AttestationManager;