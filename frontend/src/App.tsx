import { useState } from 'react';
import LandingPage from './components/LandingPage';
import IncidentDashboard from './components/IncidentDashboard';

type Page = 'landing' | 'dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  return (
    <>
      {currentPage === 'landing' ? (
        <LandingPage onNavigateToDashboard={() => setCurrentPage('dashboard')} />
      ) : (
        <IncidentDashboard onNavigateToLanding={() => setCurrentPage('landing')} />
      )}
    </>
  );
}

export default App;
