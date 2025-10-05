import { useState } from 'react';
import { X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { reportIncident } from '../services/api';
import { SeverityType } from '../types';
import { EXPLORER_URL } from '../constants';

interface ReportIncidentFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReportIncidentForm({ onClose, onSuccess }: ReportIncidentFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    severity: 'info' as SeverityType,
    description: '',
    logs: '',
    ai_model: '',
    ai_version: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ txHash: string; tokenId: number; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await reportIncident(formData);

      if (result.success && result.incident) {
        setSuccess({ 
          txHash: result.incident.tx_hash || 'pending',
          tokenId: result.incident.token_id || 0,
          message: result.message || 'Incident reported successfully!'
        });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 5000);
      } else {
        setError(result.message || 'Failed to report incident');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Incident Reported!</h3>
            <p className="text-gray-600 mb-6">
              {success.message}
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left space-y-3">
              <div>
                <div className="text-sm text-gray-600">NFT Token ID</div>
                <div className="font-mono text-lg font-semibold text-gray-900">
                  {success.tokenId || 'Pending...'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Transaction Hash</div>
                <div className="font-mono text-xs text-gray-900 break-all">
                  {success.txHash || 'Processing...'}
                </div>
              </div>
            </div>

            {success.txHash && success.txHash !== 'pending' && (
              <a
                href={`${EXPLORER_URL}/tx/${success.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mb-3"
              >
                View on 0G Explorer
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Close
            </button>

            <p className="text-sm text-gray-500 mt-3">This dialog will close automatically in 5 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Report New Incident</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g., AI Model Inference Failure"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.severity}
              onChange={(e) =>
                setFormData({ ...formData, severity: e.target.value as SeverityType })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Provide a detailed description of the incident..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logs / Error Details <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.logs}
              onChange={(e) => setFormData({ ...formData, logs: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none font-mono text-sm"
              placeholder="Paste error logs, stack traces, or other technical details..."
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Model (Optional)
              </label>
              <input
                type="text"
                value={formData.ai_model}
                onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g., GPT-4"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Version (Optional)
              </label>
              <input
                type="text"
                value={formData.ai_version}
                onChange={(e) => setFormData({ ...formData, ai_version: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g., v1.0.0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Reporting Incident...' : 'Report Incident'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
