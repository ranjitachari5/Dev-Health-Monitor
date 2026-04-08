import React, { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { Squares } from './Squares';

interface LandingPageProps {
  onQuickScan: () => void | Promise<void>;
  onDescribeProject: () => void;
  onViewHistory: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onQuickScan,
  onDescribeProject,
  onViewHistory,
}) => {
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
      await onQuickScan();
    } finally {
      setIsScanning(false);
    }
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
    <div className="relative w-full min-h-screen bg-gray-950 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.3}
          borderColor="#1a1a2e"
          squareSize={50}
          hoverFillColor="#16213e"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="flex justify-end gap-4 px-6 pt-6">
          <button
            type="button"
            onClick={onViewHistory}
            className="text-sm text-indigo-400 hover:text-indigo-300"
          >
            View history
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 pb-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/80 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-gray-300 font-medium">Grok-powered</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4 leading-tight">
              Is your laptop ready to code?
            </h1>

            <p className="text-lg text-gray-400 mb-12 leading-relaxed">
              Describe your stack, scan your machine, fix what&apos;s missing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                type="button"
                onClick={() => void handleQuickScan()}
                disabled={isScanning}
                className="group relative px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-indigo-500/50"
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
                type="button"
                onClick={onDescribeProject}
                disabled={isScanning}
                className="px-8 py-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-all duration-300 border border-gray-700 disabled:opacity-50"
              >
                Describe Project
              </button>
            </div>

            {platform && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-gray-800">
                <span className="text-xl">{getPlatformIcon(platform)}</span>
                <span className="text-gray-400 text-sm font-medium">Running on {platform}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
