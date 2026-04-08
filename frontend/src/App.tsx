import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ProjectInput } from './components/ProjectInput';
import { ScanDashboard } from './components/ScanDashboard';
import { AppState } from './types/index';

function App() {
  const [state, setState] = useState<AppState>({
    currentScreen: 'landing',
    scanData: null,
    aiAnalysis: null,
    isLoading: false,
    platform: '',
    projectDescription: ''
  });

  const handleNavigate = (newState: Partial<AppState>) => {
    setState(prev => ({
      ...prev,
      ...newState
    }));
  };

  const renderScreen = () => {
    switch (state.currentScreen) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'input':
        return <ProjectInput onNavigate={handleNavigate} />;
      case 'dashboard':
        return (
          <ScanDashboard
            scanData={state.scanData!}
            aiAnalysis={state.aiAnalysis}
            onNavigate={handleNavigate}
          />
        );
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0a0a0f]">
      {renderScreen()}
    </div>
  );
}

export default App;
