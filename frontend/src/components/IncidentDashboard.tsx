import { useEffect, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  Info,
  Wallet,
  Plus,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { Incident, SeverityType } from '../types';
import { fetchIncidentsProgressive, getIncidentStats } from '../services/api';
import { connectWallet, getConnectedAccount, truncateAddress } from '../utils/wallet';
import { SEVERITY_COLORS } from '../constants';
import IncidentDetailModal from './IncidentDetailModal';
import ReportIncidentForm from './ReportIncidentForm';
import UserIncidents from './UserIncidents';

interface IncidentDashboardProps {
  onNavigateToLanding: () => void;
}

export default function IncidentDashboard({ onNavigateToLanding }: IncidentDashboardProps) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [stats, setStats] = useState({ total: 0, critical: 0, recent: 0 });
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    severity: 'all',
    search: '',
    myIncidents: false,
  });

  const loadIncidents = async () => {
    setLoading(true);
    setLoadingProgress({ current: 0, total: 0 });
    
    // Progressive loading with callbacks
    const progressiveIncidents: Incident[] = [];
    
    await fetchIncidentsProgressive((incident, index, total) => {
      // Add incident to array progressively
      progressiveIncidents.push(incident);
      
      // Update both the incidents list and progress
      setIncidents([...progressiveIncidents]);
      setLoadingProgress({ current: index, total });
      
      // Update stats progressively
      const critical = progressiveIncidents.filter(i => i.severity === 'critical').length;
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recent = progressiveIncidents.filter(i => new Date(i.timestamp) >= twentyFourHoursAgo).length;
      
      setStats({
        total: progressiveIncidents.length,
        critical,
        recent
      });
    });
    
    setLoading(false);
  };

  useEffect(() => {
    loadIncidents();
    checkWalletConnection();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, incidents]);

  const checkWalletConnection = async () => {
    const account = await getConnectedAccount();
    setConnectedAddress(account);
  };

  const handleConnectWallet = async () => {
    const account = await connectWallet();
    setConnectedAddress(account);
  };

  const applyFilters = () => {
    let filtered = [...incidents];

    if (filters.severity !== 'all') {
      filtered = filtered.filter((i) => i.severity === filters.severity);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.id.toLowerCase().includes(searchLower) ||
          i.title.toLowerCase().includes(searchLower) ||
          i.description.toLowerCase().includes(searchLower)
      );
    }

    if (filters.myIncidents && connectedAddress) {
      filtered = filtered.filter(
        (i) => i.owner?.toLowerCase() === connectedAddress.toLowerCase()
      );
    }

    setFilteredIncidents(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityIcon = (severity: SeverityType) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={onNavigateToLanding}
            >
              <Shield className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">iSentinel</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowReportForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Report Incident
              </button>

              {connectedAddress ? (
                <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-600" />
                  <span className="font-mono text-sm text-gray-900">
                    {truncateAddress(connectedAddress)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Incidents</div>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Critical Incidents</div>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.critical}</div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Last 24 Hours</div>
              <RefreshCw className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.recent}</div>
          </div>
        </div>

        {/* User Incidents Section */}
        {connectedAddress && (
          <div className="mb-8">
            <UserIncidents />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="all">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>
              </div>

              {connectedAddress && (
                <button
                  onClick={() =>
                    setFilters({ ...filters, myIncidents: !filters.myIncidents })
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filters.myIncidents
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  My Incidents
                </button>
              )}

              <button
                onClick={loadIncidents}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            {loadingProgress.total > 0 && (
              <div className="text-center">
                <p className="text-gray-600 mb-2">
                  Loading incidents from blockchain...
                </p>
                <p className="text-sm text-gray-500">
                  {loadingProgress.current} of {loadingProgress.total} incidents loaded
                </p>
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No incidents found</h3>
            <p className="text-gray-600">
              {filters.severity !== 'all' || filters.search || filters.myIncidents
                ? 'Try adjusting your filters'
                : 'Be the first to report an incident'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidents.map((incident, index) => {
              const severityColors = SEVERITY_COLORS[incident.severity];
              return (
                <div
                  key={incident.id || `incident-${index}`}
                  className={`bg-white rounded-xl shadow-sm border-l-4 ${severityColors.border} border-t border-r border-b border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${severityColors.badge} text-white flex items-center gap-1 capitalize`}
                    >
                      {getSeverityIcon(incident.severity)}
                      {incident.severity}
                    </span>
                    {incident.token_id && (
                      <div className="text-xs text-gray-500">#{incident.token_id}</div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {incident.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="font-mono">{incident.id ? incident.id.slice(0, 20) : 'No ID'}...</div>
                    <div>{formatDate(incident.timestamp)}</div>
                  </div>

                  <button className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors text-sm">
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}

      {showReportForm && (
        <ReportIncidentForm
          onClose={() => setShowReportForm(false)}
          onSuccess={loadIncidents}
        />
      )}
    </div>
  );
}
