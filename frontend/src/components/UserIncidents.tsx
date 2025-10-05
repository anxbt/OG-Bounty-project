import { useState, useEffect } from 'react';
import { Trophy, Clock, ExternalLink, Eye } from 'lucide-react';
import { fetchUserIncidents } from '../services/api';
import { useWallet } from '../hooks/useWallet';
import { Incident } from '../types';
import { SEVERITY_COLORS, EXPLORER_URL } from '../constants';
import IncidentDetailModal from './IncidentDetailModal';

export default function UserIncidents() {
  const { isConnected, address, isCorrectNetwork } = useWallet();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  useEffect(() => {
    if (isConnected && isCorrectNetwork && address) {
      loadUserIncidents();
    } else {
      setIncidents([]);
    }
  }, [isConnected, isCorrectNetwork, address]);

  const loadUserIncidents = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const userIncidents = await fetchUserIncidents(address);
      setIncidents(userIncidents);
    } catch (err) {
      console.error('Error loading user incidents:', err);
      setError('Failed to load your incidents');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Incident NFTs</h3>
          <p className="text-gray-600">Connect your wallet to view your owned incident NFTs</p>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-orange-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Incident NFTs</h3>
          <p className="text-orange-600">Switch to 0G Galileo testnet to view your NFTs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Incident NFTs</h3>
              <p className="text-sm text-gray-600">
                {incidents.length} NFT{incidents.length !== 1 ? 's' : ''} owned
              </p>
            </div>
          </div>
          
          <button
            onClick={loadUserIncidents}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-600">Loading your NFTs...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadUserIncidents}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              Try again
            </button>
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No incident NFTs found</p>
            <p className="text-sm text-gray-500">
              Report an incident to mint your first NFT!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className={`p-4 rounded-lg border-l-4 ${SEVERITY_COLORS[incident.severity].bg} ${SEVERITY_COLORS[incident.severity].border} hover:shadow-md transition-all cursor-pointer group`}
                onClick={() => setSelectedIncident(incident)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium text-white ${SEVERITY_COLORS[incident.severity].badge}`}
                      >
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        NFT #{incident.token_id}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {incident.title}
                    </h4>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(incident.timestamp).toLocaleDateString()}
                      </div>
                      
                      {incident.tx_hash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${incident.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Transaction
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedIncident(incident);
                      }}
                      className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  );
}