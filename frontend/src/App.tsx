import { useState } from 'react';
import LandingPage from './components/LandingPage';
import IncidentDashboard from './components/IncidentDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NetworkIndicator from './components/NetworkIndicator';
import NetworkSwitcher from './components/NetworkSwitcher';

type Page = 'landing' | 'dashboard' | 'analytics';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  const renderNavBar = () => {
    if (currentPage === 'landing') return null;
    
    return (
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛡️</span>
              <span className="font-bold text-xl">iSentinel</span>
            </div>
            
            {/* Center Navigation */}
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'dashboard' 
                    ? 'bg-white text-blue-600 font-semibold' 
                    : 'hover:bg-blue-500'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setCurrentPage('analytics')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === 'analytics' 
                    ? 'bg-white text-blue-600 font-semibold' 
                    : 'hover:bg-blue-500'
                }`}
              >
                🧠 Analytics
              </button>
              <button
                onClick={() => setCurrentPage('landing')}
                className="px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors"
              >
                🏠 Home
              </button>
            </div>

            {/* Right side - Network Indicator & Switcher */}
            <div className="flex items-center gap-2">
              <NetworkSwitcher />
              <NetworkIndicator />
            </div>
          </div>
        </div>
      </nav>
    );
  };

  return (
    <>
      {renderNavBar()}
      {currentPage === 'landing' && (
        <LandingPage onNavigateToDashboard={() => setCurrentPage('dashboard')} />
      )}
      {currentPage === 'dashboard' && (
        <IncidentDashboard onNavigateToLanding={() => setCurrentPage('landing')} />
      )}
      {currentPage === 'analytics' && (
        <AnalyticsDashboard />
      )}
    </>
  );
}

export default App;
