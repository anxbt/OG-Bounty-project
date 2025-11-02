import { X, ExternalLink, Copy, CheckCircle, User, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Incident } from '../types';
import { SEVERITY_COLORS, EXPLORER_URL } from '../constants';
import AttestationCard from './AttestationCard';
import { ethers } from 'ethers';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
}

const BACKEND_URL = 'http://localhost:8787';

export default function IncidentDetailModal({ incident, onClose }: IncidentDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [attestorAddress, setAttestorAddress] = useState<string | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [rerunResult, setRerunResult] = useState<any>(null);
  const [showRerunModal, setShowRerunModal] = useState(false);

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            const address = await accounts[0].getAddress();
            setConnectedWallet(address);
            if (incident.owner && address.toLowerCase() === incident.owner.toLowerCase()) {
              setIsOwner(true);
            }
          }
        } catch (error) {
          console.error('Failed to check wallet:', error);
        }
      }
    };
    checkWallet();
  }, [incident.owner]);

  const severityColors = SEVERITY_COLORS[incident.severity];

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const rerunInference = async () => {
    if (!incident.token_id) {
      alert('No token ID available for this incident');
      return;
    }

    setRerunning(true);
    setRerunResult(null);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/incident/${incident.token_id}/recompute`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to rerun: ${response.statusText}`);
      }

      const result = await response.json();
      setRerunResult(result);
      setShowRerunModal(true);
    } catch (error: any) {
      alert(`Rerun failed: ${error.message}`);
      console.error('Rerun failed:', error);
    } finally {
      setRerunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">{incident.title}</h3>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${severityColors.badge} text-white capitalize`}
                >
                  {incident.severity}
                </span>
                <span className="text-sm text-gray-600">{formatDate(incident.timestamp)}</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Incident ID</div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-sm text-gray-900 break-all">{incident.id || 'No ID available'}</div>
                <button
                  onClick={() => copyToClipboard(incident.id || '', 'id')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {copiedField === 'id' ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {incident.token_id && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">NFT Token ID</div>
                <div className="font-mono text-sm text-gray-900">{incident.token_id}</div>
              </div>
            )}

            {incident.tx_hash && (
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <div className="text-sm text-gray-600 mb-1">Transaction Hash</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-gray-900 break-all flex-1">
                    {incident.tx_hash}
                  </div>
                  <button
                    onClick={() => copyToClipboard(incident.tx_hash!, 'tx')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedField === 'tx' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <a
                    href={`${EXPLORER_URL}/tx/${incident.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
              </div>
            )}

            {incident.owner && (
              <div className={`rounded-lg p-4 md:col-span-2 ${
                isOwner ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-600" />
                  <div className="text-sm text-gray-600">Reporter / NFT Owner</div>
                  {isOwner && (
                    <span className="ml-auto bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      You own this NFT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-gray-900 break-all flex-1">
                    {incident.owner}
                  </div>
                  <button
                    onClick={() => copyToClipboard(incident.owner!, 'owner')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy address"
                  >
                    {copiedField === 'owner' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <a
                    href={`https://explorer.0g.ai/address/${incident.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="View on 0G Explorer"
                  >
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </a>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {isOwner 
                    ? '🎉 You reported this incident and own the NFT proof'
                    : 'On-chain accountability via NFT ownership'
                  }
                </div>
              </div>
            )}

            {incident.log_hash && (
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <div className="text-sm text-gray-600 mb-1">Log Hash (0G Storage)</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-gray-900 break-all flex-1">
                    {incident.log_hash}
                  </div>
                  <button
                    onClick={() => copyToClipboard(incident.log_hash!, 'loghash')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedField === 'loghash' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Immutable log data stored on 0G decentralized storage
                </div>
              </div>
            )}

            {incident.ai_model && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">AI Model</div>
                <div className="text-sm text-gray-900">{incident.ai_model}</div>
              </div>
            )}

            {incident.ai_version && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Model Version</div>
                <div className="text-sm text-gray-900">{incident.ai_version}</div>
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Description</div>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-900 whitespace-pre-wrap">
              {incident.description}
            </div>
          </div>

          {incident.token_id && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">AI Verification</div>
                <button
                  onClick={rerunInference}
                  disabled={rerunning}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    rerunning
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {rerunning ? '⏳ Re-running...' : '🔄 Re-run Inference'}
                </button>
              </div>
              <AttestationCard 
                tokenId={incident.token_id} 
                onComplete={(attestation) => {
                  if (attestation?.signer) {
                    setAttestorAddress(attestation.signer);
                  }
                }}
              />
              {attestorAddress && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <div className="text-sm font-medium text-purple-800">Authorized Attestor</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-xs text-purple-900 break-all flex-1">
                      {attestorAddress}
                    </div>
                    <button
                      onClick={() => copyToClipboard(attestorAddress, 'attestor')}
                      className="p-1 hover:bg-purple-100 rounded transition-colors"
                      title="Copy attestor address"
                    >
                      {copiedField === 'attestor' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-purple-600" />
                      )}
                    </button>
                    <a
                      href={`https://explorer.0g.ai/address/${attestorAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:bg-purple-100 rounded transition-colors"
                      title="View on 0G Explorer"
                    >
                      <ExternalLink className="w-4 h-4 text-purple-600" />
                    </a>
                  </div>
                  <div className="text-xs text-purple-600 mt-2">
                    ✓ Cryptographically signed by authorized backend service
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Logs</div>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words">{incident.logs}</pre>
            </div>
          </div>

          {/* Web3 Accountability Chain */}
          {(incident.owner || attestorAddress) && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                🔗 Web3 Accountability Chain
              </div>
              <div className="space-y-2 text-sm">
                {incident.owner && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-600">Reporter:</span>
                    <code className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded">
                      {incident.owner.slice(0, 10)}...{incident.owner.slice(-8)}
                    </code>
                    {isOwner && <span className="text-green-600 text-xs">← You</span>}
                  </div>
                )}
                {attestorAddress && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Verified by:</span>
                    <code className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded">
                      {attestorAddress.slice(0, 10)}...{attestorAddress.slice(-8)}
                    </code>
                  </div>
                )}
                {incident.token_id && (
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-indigo-600" />
                    <span className="text-gray-600">NFT Token:</span>
                    <code className="text-xs font-mono text-gray-800 bg-white px-2 py-1 rounded">
                      #{incident.token_id}
                    </code>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-3 pt-3 border-t border-blue-200">
                All addresses and signatures are verifiable on-chain via 0G Explorer
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {incident.tx_hash && (
              <a
                href={`${EXPLORER_URL}/tx/${incident.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                View on 0G Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Rerun Comparison Modal */}
      {showRerunModal && rerunResult && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowRerunModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Re-run Comparison</h2>
                <button
                  onClick={() => setShowRerunModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Match Status */}
              <div className={`p-4 rounded-lg mb-4 ${
                rerunResult.reproducible 
                  ? 'bg-green-50 border border-green-200'
                  : rerunResult.match
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {rerunResult.reproducible ? '✅' : rerunResult.match ? '⚠️' : '❌'}
                  </span>
                  <div>
                    <div className="font-bold text-lg">
                      {rerunResult.reproducible 
                        ? '100% Reproducible'
                        : `${rerunResult.matchPercentage}% Match`
                      }
                    </div>
                    <div className="text-sm text-gray-600">
                      {rerunResult.reproducible 
                        ? 'Analysis is fully deterministic and verifiable'
                        : rerunResult.match
                        ? 'Severity matches but source differs'
                        : 'Significant differences detected'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Metric</th>
                      <th className="text-left p-3 font-medium text-gray-700">Original Analysis</th>
                      <th className="text-left p-3 font-medium text-gray-700">Re-run Analysis</th>
                      <th className="text-center p-3 font-medium text-gray-700">Match</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {/* Severity Score Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-600">Severity Score</td>
                      <td className="p-3">
                        {rerunResult.original ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            (rerunResult.original.severityScore || 0) >= 7 
                              ? 'bg-red-100 text-red-700'
                              : (rerunResult.original.severityScore || 0) >= 4
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {rerunResult.original.severityScore}/10
                          </span>
                        ) : (
                          <span className="text-gray-400">No original</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          rerunResult.recomputed.severityScore >= 7 
                            ? 'bg-red-100 text-red-700'
                            : rerunResult.recomputed.severityScore >= 4
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {rerunResult.recomputed.severityScore}/10
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {rerunResult.original ? (
                          rerunResult.original.severityScore === rerunResult.recomputed.severityScore ? (
                            <span className="text-green-600 text-lg">✓</span>
                          ) : (
                            <span className="text-red-600 text-lg">✗</span>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Summary Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-600">Summary</td>
                      <td className="p-3 text-xs text-gray-700">
                        {rerunResult.original?.summary || 'No original'}
                      </td>
                      <td className="p-3 text-xs text-gray-700">
                        {rerunResult.recomputed.summary}
                      </td>
                      <td className="p-3 text-center">
                        {rerunResult.original ? (
                          rerunResult.original.summary === rerunResult.recomputed.summary ? (
                            <span className="text-green-600 text-lg">✓</span>
                          ) : (
                            <span className="text-yellow-600 text-lg">≈</span>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* AI Source Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-600">AI Source</td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {rerunResult.original?.analysisSource || 'Unknown'}
                        </code>
                      </td>
                      <td className="p-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {rerunResult.recomputed.analysisSource}
                        </code>
                      </td>
                      <td className="p-3 text-center">
                        {rerunResult.original ? (
                          rerunResult.original.analysisSource === rerunResult.recomputed.analysisSource ? (
                            <span className="text-green-600 text-lg">✓</span>
                          ) : (
                            <span className="text-yellow-600 text-lg">≈</span>
                          )
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Timestamp Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-medium text-gray-600">Timestamp</td>
                      <td className="p-3 text-xs text-gray-600">
                        {rerunResult.original?.timestamp ? formatDate(rerunResult.original.timestamp) : 'Unknown'}
                      </td>
                      <td className="p-3 text-xs text-gray-600">
                        {formatDate(rerunResult.recomputed.timestamp)}
                      </td>
                      <td className="p-3 text-center text-gray-400">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Explanation */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  🔍 What does this mean?
                </div>
                <div className="text-xs text-blue-700 space-y-1">
                  {rerunResult.reproducible ? (
                    <>
                      <p>✅ The AI analysis is <strong>fully reproducible</strong>. Both runs used the same AI service and produced identical results.</p>
                      <p>This demonstrates that the verification is <strong>deterministic and trustworthy</strong>.</p>
                    </>
                  ) : rerunResult.match ? (
                    <>
                      <p>⚠️ The severity scores match, but different AI services were used.</p>
                      <p>This shows <strong>consistency across different AI models</strong>, which is a good sign for reliability.</p>
                    </>
                  ) : (
                    <>
                      <p>❌ Significant differences detected between runs.</p>
                      <p>This could indicate changes in the AI model, incident data, or analysis context.</p>
                    </>
                  )}
                </div>
              </div>

              {rerunResult.cached && (
                <div className="mt-3 text-xs text-gray-500 text-center">
                  ℹ️ Cached result from {rerunResult.cacheAge}s ago
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
