import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { Squares } from './Squares';
import { apiClient } from '../api/client';
import { AppState } from '../types/index';

interface LandingPageProps {
  onNavigate: (state: Partial<AppState>) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [platform, setPlatform] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const detectPlatform = () => {
      const ua = navigator.userAgent;
      if (ua.includes('Windows')) setPlatform('Windows');
      else if (ua.includes('Mac')) setPlatform('macOS');
      else if (ua.includes('Linux')) setPlatform('Linux');
      else setPlatform('Unknown');
    };
    detectPlatform();
  }, []);

  const handleQuickScan = async () => {
    setIsScanning(true);
    try {
      const data = await apiClient.runHealthScan();
      onNavigate({
        scanData: data,
        currentScreen: 'dashboard',
        isLoading: false
      });
    } catch (error) {
      console.error('Scan failed:', error);
      alert('Failed to scan. Make sure the backend is running.');
      setIsScanning(false);
    }
  };

  const handleDescribeProject = () => {
    onNavigate({ currentScreen: 'input' });
  };

  const getPlatformIcon = (p: string) => {
    switch (p) {
      case 'Windows':
        return '⊞';
      case 'macOS':
        return '⌘';
      case 'Linux':
        return '🐧';
      default:
        return '💻';
    }
  };

  return (
    <div className="relative w-full h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Animated squares background */}
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="#1a1a2e"
          squareSize={50}
          hoverFillColor="#16213e"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="max-w-2xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/80 font-medium">AI-Powered</span>
          </div>

          {/* Main heading */}
          <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tight mb-4 leading-tight">
            Is your laptop ready to code?
          </h1>

          {/* Subheading */}
          <p className="text-lg text-white/60 mb-12 leading-relaxed">
            Scan your machine. Get AI insights. Fix issues instantly.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleQuickScan}
              disabled={isScanning}
              className="group relative px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-indigo-500/50 hover:border-indigo-400 shadow-lg hover:shadow-indigo-500/50"
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play size={20} />
                  <span>Run Quick Scan</span>
                </>
              )}
            </button>
            <button
              onClick={handleDescribeProject}
              disabled={isScanning}
              className="px-8 py-4 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Describe Project
            </button>
          </div>

          {/* Platform badge */}
          {platform && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="text-xl">{getPlatformIcon(platform)}</span>
              <span className="text-white/70 text-sm font-medium">
                Running on {platform}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
