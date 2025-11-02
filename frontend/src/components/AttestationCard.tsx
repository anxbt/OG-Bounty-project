import React, { useState } from 'react';
import { ethers } from 'ethers';

interface AttestationCardProps {
  tokenId: number;
  onComplete?: (attestation: any) => void;
}

// Backend URL - connect to the Node.js backend on port 8787
const BACKEND_URL = 'http://localhost:8787';

export const AttestationCard: React.FC<AttestationCardProps> = ({ tokenId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attestation, setAttestation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofData, setProofData] = useState<any>(null);
  const [loadingProof, setLoadingProof] = useState(false);

  const requestAttestation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Request attestation
      const jobRes = await fetch(
        `${BACKEND_URL}/api/incident/${tokenId}/attest`,
        { method: 'POST' }
      );
      
      if (!jobRes.ok) {
        throw new Error(`Backend error: ${jobRes.status} ${jobRes.statusText}`);
      }
      
      const { jobId } = await jobRes.json();
      
      // Poll for completion
      let completed = false;
      while (!completed) {
        const statusRes = await fetch(`${BACKEND_URL}/api/attest/${jobId}`);
        
        if (!statusRes.ok) {
          throw new Error(`Status check failed: ${statusRes.status}`);
        }
        
        const status = await statusRes.json();
        
        if (status.status === 'complete') {
          // Verify signature
          const isValid = ethers.verifyMessage(
            ethers.toBeHex(status.hash),
            status.signature
          );
          
          const verified = {
            ...status,
            isVerified: isValid
          };
          
          setAttestation(verified);
          if (onComplete) onComplete(verified);
          completed = true;
          
        } else if (status.status === 'failed') {
          throw new Error(status.error);
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Attestation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copySignature = () => {
    if (attestation?.signature) {
      navigator.clipboard.writeText(attestation.signature);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const viewProof = async () => {
    if (!attestation?.attestationUri) {
      setError('No attestation URI available');
      return;
    }

    setLoadingProof(true);
    try {
      // Download proof from 0G Storage via backend
      const encodedUri = encodeURIComponent(attestation.attestationUri);
      const response = await fetch(`${BACKEND_URL}/download?uri=${encodedUri}`);
      
      if (!response.ok) {
        throw new Error(`Failed to download proof: ${response.statusText}`);
      }
      
      const proofText = await response.text();
      const proof = JSON.parse(proofText);
      
      setProofData({
        ...proof,
        attestationUri: attestation.attestationUri,
        hash: attestation.hash,
        signature: attestation.signature,
        signer: attestation.signer
      });
      
      setShowProofModal(true);
    } catch (error: any) {
      console.error('Failed to load proof:', error);
      setError(`Failed to load proof: ${error.message}`);
    } finally {
      setLoadingProof(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-600 font-medium">Attestation Failed</h3>
        <p className="text-red-500 text-sm">{error}</p>
        <button 
          onClick={() => setError(null)}
          className="mt-2 text-sm text-red-600 hover:text-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (attestation) {
    return (
      <>
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">AI Attestation</h3>
            {attestation.isVerified && (
              <span className="text-green-600 text-sm flex items-center gap-1">
                ✓ Verified
              </span>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-gray-700 text-sm">{attestation.summary}</p>
            
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Severity:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                attestation.severityScore >= 8 ? 'bg-red-600 text-white' :
                attestation.severityScore >= 5 ? 'bg-yellow-500 text-gray-900' :
                'bg-blue-500 text-white'
              }`}>
                {attestation.severityScore}/10
              </span>
              {/* Info icon with tooltip */}
              {(attestation.flagReason || attestation.technicalDetails) && (
                <div className="group relative">
                  <button className="text-gray-400 hover:text-gray-600">
                    ℹ️
                  </button>
                  <div className="absolute left-0 top-6 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-lg">
                    <div className="font-semibold mb-1">Why Flagged:</div>
                    <div className="mb-2">
                      {attestation.flagReason || 'Analysis flagged this incident for review'}
                    </div>
                    {attestation.technicalDetails && (
                      <>
                        <div className="font-semibold mb-1 mt-2">Technical Details:</div>
                        <div className="text-gray-300">
                          {attestation.technicalDetails}
                        </div>
                      </>
                    )}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Category tags */}
            {attestation.categories && attestation.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attestation.categories.map((category: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                  >
                    {category}
                  </span>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-600 space-y-1">
              {attestation.analysisSource && (
                <div>Source: <span className="font-medium">{attestation.analysisSource}</span></div>
              )}
              <div>Signer: <code className="text-xs font-mono">{attestation.signer?.slice(0, 12)}...</code></div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={copySignature}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Copy Full Signature →
                </button>
                <button
                  onClick={viewProof}
                  disabled={loadingProof}
                  className="text-purple-600 hover:text-purple-700 font-medium disabled:text-gray-400"
                >
                  {loadingProof ? '⏳ Loading...' : '🔗 View Proof'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Proof Modal */}
        {showProofModal && proofData && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowProofModal(false)}
          >
            <div 
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Attestation Proof</h2>
                  <button
                    onClick={() => setShowProofModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Hash */}
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Attestation Hash
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-800 break-all flex-1">
                        {proofData.hash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(proofData.hash)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>

                  {/* 0G Storage URI */}
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      0G Storage URI
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-800 break-all flex-1">
                        {proofData.attestationUri}
                      </code>
                      <button
                        onClick={() => copyToClipboard(proofData.attestationUri)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        📋 Copy
                      </button>
                    </div>
                    <a
                      href={`${BACKEND_URL}/download?uri=${encodeURIComponent(proofData.attestationUri)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                    >
                      📥 Download Raw JSON
                    </a>
                  </div>

                  {/* Signature */}
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Signature
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-800 break-all flex-1">
                        {proofData.signature}
                      </code>
                      <button
                        onClick={() => copyToClipboard(proofData.signature)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>

                  {/* Signer */}
                  <div className="bg-gray-50 p-3 rounded">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                      Authorized Signer
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-800 break-all flex-1">
                        {proofData.signer}
                      </code>
                      <a
                        href={`https://explorer.0g.ai/address/${proofData.signer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        🔗 Explorer
                      </a>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="bg-green-50 border border-green-200 p-3 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-lg">✓</span>
                      <div>
                        <div className="font-medium text-green-800">Signature Verified</div>
                        <div className="text-xs text-green-600">
                          Cryptographic proof validated on-chain
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* JSON Viewer */}
                  <div className="bg-gray-900 p-4 rounded">
                    <label className="text-xs font-medium text-gray-300 block mb-2">
                      Full Attestation Data (JSON)
                    </label>
                    <pre className="text-xs text-green-400 font-mono overflow-x-auto">
                      {JSON.stringify(proofData, null, 2)}
                    </pre>
                  </div>

                  {/* External Verification */}
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                    <div className="text-sm font-medium text-blue-800 mb-2">
                      🔍 External Verification
                    </div>
                    <p className="text-xs text-blue-600 mb-2">
                      Anyone can independently verify this attestation using the 0G Storage hash:
                    </p>
                    <code className="text-xs font-mono text-blue-800 bg-white px-2 py-1 rounded block">
                      {proofData.attestationUri.split('0g://')[1]}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={requestAttestation}
      disabled={isLoading}
      className={`w-full p-3 text-center rounded-lg border font-medium transition-colors ${
        isLoading 
          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
          : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 cursor-pointer'
      }`}
    >
      {isLoading ? '⏳ Generating Attestation...' : '🔐 Explain & Verify'}
    </button>
  );
};

export default AttestationCard;