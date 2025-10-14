import { X, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Incident } from '../types';
import { SEVERITY_COLORS, EXPLORER_URL } from '../constants';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
}

export default function IncidentDetailModal({ incident, onClose }: IncidentDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <div className="text-sm text-gray-600 mb-1">NFT Owner</div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm text-gray-900 break-all flex-1">
                    {incident.owner}
                  </div>
                  <button
                    onClick={() => copyToClipboard(incident.owner!, 'owner')}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {copiedField === 'owner' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
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

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Logs</div>
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-green-400 overflow-x-auto max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap break-words">{incident.logs}</pre>
            </div>
          </div>

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
    </div>
  );
}
