import React, { useState } from 'react';
import { ethers } from 'ethers';

interface AttestationCardProps {
  tokenId: number;
  onComplete?: (attestation: any) => void;
}

export const AttestationCard: React.FC<AttestationCardProps> = ({ tokenId, onComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [attestation, setAttestation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const requestAttestation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Request attestation
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

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-600 font-medium">Attestation Failed</h3>
        <p className="text-red-500">{error}</p>
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
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">AI Attestation</h3>
          {attestation.isVerified && (
            <span className="text-green-600 text-sm flex items-center">
              Verified ✓
            </span>
          )}
        </div>

        <div className="prose prose-sm">
          <p className="text-gray-700">{attestation.summary}</p>
          
          <div className="mt-3 flex items-center gap-2">
            <span className="font-medium">Severity:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              attestation.severityScore >= 7 ? 'bg-red-100 text-red-700' :
              attestation.severityScore >= 4 ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {attestation.severityScore}/10
            </span>
          </div>

          <div className="mt-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span>Signed by:</span>
              <code className="text-xs">{attestation.signer?.slice(0, 8)}...</code>
            </div>
            
            <button
              onClick={copySignature}
              className="mt-1 text-xs text-blue-600 hover:text-blue-700"
            >
              Copy Signature
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={requestAttestation}
      disabled={isLoading}
      className={`w-full p-3 text-center rounded-lg border ${
        isLoading 
          ? 'bg-gray-100 text-gray-400 border-gray-200'
          : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
      }`}
    >
      {isLoading ? 'Generating Attestation...' : 'Explain & Verify'}
    </button>
  );
};

export default AttestationCard;