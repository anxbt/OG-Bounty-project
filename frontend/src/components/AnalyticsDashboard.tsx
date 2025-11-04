import { useEffect, useState } from 'react';
import { BACKEND_API_URL } from '../constants';

interface Analytics {
  jobId: string;
  timestamp: string;
  computeEngine: string;
  overview: {
    totalIncidents: number;
    criticalIncidents: number;
    incidentsLast30Days: number;
    growthRate: string;
    averageSeverity: string;
    mostAffectedModel: string;
  };
  trends: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    bySeverity: Record<string, Record<string, number>>;
  };
  modelPerformance: Record<string, {
    totalIncidents: number;
    critical: number;
    warning: number;
    info: number;
    failureRate: string;
  }>;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  riskPredictions: {
    nextWeekRisk: string;
    highRiskModels: Array<{ model: string; failureRate: string; incidents: number }>;
    trendingCategories: Array<{ category: string; count: number }>;
    alertLevel: string;
  };
  patterns: {
    commonErrors: Array<{ error: string; count: number }>;
    timePatterns: {
      hourlyDistribution: Record<string, number>;
      peakHour: string;
      peakCount: number;
    };
    correlations: Record<string, string>;
  };
  recommendations: Array<{
    priority: string;
    category: string;
    message: string;
    action: string;
  }>;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 Fetching incidents for analytics...');
      console.log('🔗 Backend URL:', BACKEND_API_URL);
      
      // Health check first
      try {
        console.log('🏥 Checking backend health...');
        const healthResponse = await fetch(`${BACKEND_API_URL}/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!healthResponse.ok) {
          throw new Error(`Backend health check failed: ${healthResponse.status}`);
        }
        
        const healthData = await healthResponse.json();
        console.log('✅ Backend is healthy:', healthData.msg);
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError);
        throw new Error('Backend is not responding. Please make sure the backend server is running on port 8787.');
      }
      
      // First, fetch incidents (will use blockchain fallback since backend is empty)
      let incidents = [];
      
      try {
        console.log('🔍 Fetching from backend:', `${BACKEND_API_URL}/incidents`);
        const incidentsResponse = await fetch(`${BACKEND_API_URL}/incidents`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (incidentsResponse.ok) {
          incidents = await incidentsResponse.json();
          console.log(`📦 Got ${incidents.length} incidents from backend`);
        }
      } catch (backendError) {
        console.warn('⚠️ Backend fetch failed, will use blockchain:', backendError);
      }
      
      // If backend has no incidents, fetch from blockchain
      if (!incidents || incidents.length === 0) {
        console.log('🔗 Backend empty, fetching from blockchain...');
        try {
          // Import and use the blockchain fetch function
          const { fetchIncidents } = await import('../services/api');
          incidents = await fetchIncidents();
          console.log(`✅ Got ${incidents.length} incidents from blockchain`);
        } catch (blockchainError) {
          console.error('❌ Blockchain fetch failed:', blockchainError);
          // Continue with empty incidents array
        }
      }
      
      // Now compute analytics with real incident data
      console.log(`🧠 Computing analytics for ${incidents.length} incidents...`);
      console.log('📤 Posting to:', `${BACKEND_API_URL}/analytics`);
      
      const response = await fetch(`${BACKEND_API_URL}/analytics`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ incidents })
      });
      
      console.log('📥 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Analytics response error:', errorText);
        throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Analytics computed successfully:', data.jobId);
      setAnalytics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Error fetching analytics:', err);
      setError(`Backend connection error: ${errorMessage}. Make sure backend is running on port 8787.`);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-500';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-500';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-500';
      default: return 'bg-green-100 text-green-800 border-green-500';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600 text-white';
      case 'medium': return 'bg-orange-600 text-white';
      default: return 'bg-blue-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">🧠 Running 0G Compute analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-red-800 font-bold text-lg">Error Loading Analytics</h3>
              <p className="text-red-700 mt-2 font-medium">{error}</p>
              
              {error.includes('Backend') && (
                <div className="mt-4 p-4 bg-white rounded border border-red-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">💡 How to start the backend:</p>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                    <div>cd D:\0G</div>
                    <div>node backend/serverOG.js</div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    The backend should start on <code className="bg-gray-100 px-1 py-0.5 rounded">http://localhost:8787</code>
                  </p>
                </div>
              )}
              
              <button 
                onClick={fetchAnalytics}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <span>🔄</span>
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          🧠 AI Analytics Dashboard
          <span className="text-sm font-normal text-gray-500">Powered by 0G Compute</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Real-time incident analytics processed on decentralized compute
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span>🔬 Job ID: {analytics.jobId}</span>
          <span>•</span>
          <span>⏱️ {new Date(analytics.timestamp).toLocaleString()}</span>
          <span>•</span>
          <span>⚡ {analytics.computeEngine}</span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="text-sm font-medium text-gray-600">Total Incidents</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{analytics.overview?.totalIncidents || 0}</div>
          <div className="mt-2 text-sm text-gray-500">Last 30 days: {analytics.overview?.incidentsLast30Days || 0}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="text-sm font-medium text-gray-600">Critical Incidents</div>
          <div className="mt-2 text-3xl font-bold text-red-600">{analytics.overview?.criticalIncidents || 0}</div>
          <div className="mt-2 text-sm text-gray-500">
            {analytics.overview?.totalIncidents 
              ? ((analytics.overview.criticalIncidents / analytics.overview.totalIncidents) * 100).toFixed(1) 
              : '0'}% of total
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="text-sm font-medium text-gray-600">Growth Rate</div>
          <div className={`mt-2 text-3xl font-bold ${parseFloat(analytics.overview?.growthRate || '0') > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {parseFloat(analytics.overview?.growthRate || '0') > 0 ? '+' : ''}{analytics.overview?.growthRate || '0'}%
          </div>
          <div className="mt-2 text-sm text-gray-500">Week over week</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="text-sm font-medium text-gray-600">Avg Severity</div>
          <div className="mt-2 text-3xl font-bold text-purple-600">{analytics.overview?.averageSeverity || '0'}/5</div>
          <div className="mt-2 text-sm text-gray-500">Across all incidents</div>
        </div>
      </div>

      {/* Alert Level */}
      <div className={`mb-8 rounded-lg border-2 p-6 ${getAlertColor(analytics.riskPredictions?.alertLevel || 'low')}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Current Alert Level: {(analytics.riskPredictions?.alertLevel || 'low').toUpperCase()}</h3>
            <p className="mt-1">Next week risk prediction: {analytics.riskPredictions?.nextWeekRisk || '0.0'}%</p>
          </div>
          <div className="text-4xl">
            {analytics.riskPredictions?.alertLevel === 'critical' && '🚨'}
            {analytics.riskPredictions?.alertLevel === 'high' && '⚠️'}
            {analytics.riskPredictions?.alertLevel === 'medium' && '⚡'}
            {(!analytics.riskPredictions?.alertLevel || analytics.riskPredictions?.alertLevel === 'low') && '✅'}
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Severity Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Severity Distribution</h3>
          <div className="space-y-3">
            {analytics.severityDistribution && Object.entries(analytics.severityDistribution).map(([severity, count]) => (
              <div key={severity} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium text-gray-700 capitalize">{severity}</div>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div
                    className={`h-full rounded-full ${
                      severity === 'critical' ? 'bg-red-600' :
                      severity === 'high' ? 'bg-orange-500' :
                      severity === 'medium' ? 'bg-yellow-500' :
                      severity === 'low' ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${analytics.overview?.totalIncidents ? (count / analytics.overview.totalIncidents) * 100 : 0}%` }}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                      {count}
                    </span>
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right">
                  {analytics.overview?.totalIncidents ? ((count / analytics.overview.totalIncidents) * 100).toFixed(0) : '0'}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Most Affected Model */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Model Performance</h3>
          <div className="mb-4">
            <div className="text-sm text-gray-600">Most Affected Model</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{analytics.overview?.mostAffectedModel || 'N/A'}</div>
          </div>
          <div className="space-y-2">
            {analytics.modelPerformance && Object.entries(analytics.modelPerformance).slice(0, 5).map(([model, stats]) => (
              <div key={model} className="border-l-2 border-orange-500 pl-3 py-2">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-900">{model}</div>
                  <div className="text-sm font-semibold text-red-600">{stats.failureRate}% critical</div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.totalIncidents} incidents ({stats.critical} critical, {stats.warning} warning)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High Risk Models */}
  {analytics.riskPredictions?.highRiskModels && analytics.riskPredictions.highRiskModels.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ High Risk Models</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.riskPredictions.highRiskModels.map((model, idx) => (
              <div key={idx} className="bg-white rounded p-4 border border-red-300">
                <div className="font-semibold text-gray-900">{model.model}</div>
                <div className="text-2xl font-bold text-red-600 mt-1">{model.failureRate}%</div>
                <div className="text-sm text-gray-600">{model.incidents} incidents</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Categories */}
  {analytics.riskPredictions?.trendingCategories && analytics.riskPredictions.trendingCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Trending Issue Categories</h3>
          <div className="flex flex-wrap gap-3">
            {analytics.riskPredictions.trendingCategories.map((item, idx) => (
              <div key={idx} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full">
                <span className="font-semibold capitalize">{item.category}</span>
                <span className="ml-2 text-purple-600">({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patterns and Common Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Common Errors */}
  {analytics.patterns?.commonErrors && analytics.patterns.commonErrors.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Common Error Patterns</h3>
            <div className="space-y-2">
              {analytics.patterns.commonErrors.map((error, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-mono text-sm text-gray-700">{error.error}</span>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {error.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Patterns */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Time Patterns</h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Peak Incident Hour</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">
                {analytics.patterns?.timePatterns?.peakHour || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {analytics.patterns?.timePatterns?.peakCount || 0} incidents during this hour
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm font-medium text-gray-700 mb-2">Hourly Distribution</div>
              <div className="h-20 flex items-end gap-1">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const hourlyDist = analytics.patterns?.timePatterns?.hourlyDistribution || {};
                  const count = hourlyDist[hour] || 0;
                  const maxCount = Object.keys(hourlyDist).length > 0 
                    ? Math.max(...Object.values(hourlyDist)) 
                    : 0;
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={hour} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${height}%` }}
                        title={`${hour}:00 - ${count} incidents`}
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0h</span>
                <span>12h</span>
                <span>23h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 AI-Generated Recommendations</h3>
        <div className="space-y-4">
          {analytics.recommendations.map((rec, idx) => (
            <div key={idx} className={`border-l-4 p-4 rounded ${
              rec.priority === 'high' ? 'border-red-500 bg-red-50' :
              rec.priority === 'medium' ? 'border-orange-500 bg-orange-50' :
              'border-blue-500 bg-blue-50'
            }`}>
              <div className="flex items-start gap-3">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityBadge(rec.priority)}`}>
                  {rec.priority.toUpperCase()}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{rec.category}</div>
                  <p className="text-gray-700 mt-1">{rec.message}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Recommended Action:</strong> {rec.action}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Correlations */}
  {analytics.patterns?.correlations && Object.keys(analytics.patterns.correlations).length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 AI-Detected Correlations</h3>
          <div className="space-y-2">
            {Object.entries(analytics.patterns.correlations || {}).map((entry, idx) => {
              // entry should be [key, value], but guard in case of unexpected shapes
              const value = entry && entry[1] ? entry[1] : '';
              return (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-purple-600">▪</span>
                  <span className="text-gray-700">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="text-center flex items-center justify-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
          ← Back
        </button>

        <button
          onClick={fetchAnalytics}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          🔄 Refresh Analytics
        </button>
      </div>
    </div>
  );
}
