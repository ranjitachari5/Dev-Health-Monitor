import React, { useState } from 'react';
import { AlertTriangle, RotateCw, ChevronLeft } from 'lucide-react';
import { Squares } from './Squares';
import { ScoreRing } from './ScoreRing';
import { ToolCard } from './ToolCard';
import { AIInsights } from './AIInsights';
import { ScanHistory } from './ScanHistory';
import { TerminalOutput } from './TerminalOutput';
import { HealthScanResponse, AIAnalysis, AppState } from '../types/index';
import { apiClient } from '../api/client';

interface ScanDashboardProps {
  scanData: HealthScanResponse;
  aiAnalysis: AIAnalysis | null;
  onNavigate: (state: Partial<AppState>) => void;
}

type FilterType = 'all' | 'healthy' | 'warning' | 'critical' | 'notinstalled';

export const ScanDashboard: React.FC<ScanDashboardProps> = ({
  scanData,
  aiAnalysis,
  onNavigate
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [isRescanning, setIsRescanning] = useState(false);
  const [fixOutput, setFixOutput] = useState<string>('');
  const [showFixOutput, setShowFixOutput] = useState(false);

  const getFilteredTools = () => {
    switch (filter) {
      case 'healthy':
        return scanData.tools.filter(t => t.status === 'Healthy');
      case 'warning':
        return scanData.tools.filter(t => t.status === 'Warning');
      case 'critical':
        return scanData.tools.filter(t => t.status === 'Critical');
      case 'notinstalled':
        return scanData.tools.filter(t => !t.is_installed);
      default:
        return scanData.tools;
    }
  };

  const getCriticalIssues = () => {
    const critical = scanData.tools
      .filter(t => t.status === 'Critical' && !t.is_installed)
      .map(t => `${t.tool_name} is not installed`);
    
    if (aiAnalysis?.critical_issues) {
      return [...critical, ...aiAnalysis.critical_issues];
    }
    return critical;
  };

  const filteredTools = getFilteredTools();
  const criticalIssues = getCriticalIssues();

  const handleFix = async (toolName: string, fixType: 'install' | 'path') => {
    try {
      const response = await apiClient.fixTool(toolName, fixType);
      if (response.terminal_output) {
        setFixOutput(response.terminal_output);
        setShowFixOutput(true);
      }
      if (response.success) {
        // Trigger rescan
        await handleRescan();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fix failed';
      setFixOutput(message);
      setShowFixOutput(true);
    }
  };

  const handleRescan = async () => {
    setIsRescanning(true);
    try {
      const data = await apiClient.runHealthScan();
      onNavigate({
        scanData: data,
        aiAnalysis: null
      });
    } catch (error) {
      alert('Rescan failed');
    } finally {
      setIsRescanning(false);
    }
  };

  const handleBack = () => {
    onNavigate({ currentScreen: 'landing' });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.15}
          borderColor="#111122"
          squareSize={60}
          hoverFillColor="#16213e"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-6">
        {/* Top Bar */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
              >
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-3xl font-bold text-white">Dev Health Monitor</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 rounded-lg text-sm font-medium bg-white/10 border border-white/20 text-white/80">
                {scanData.platform}
              </span>
              <button
                onClick={handleRescan}
                disabled={isRescanning}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300 border border-indigo-500/50 disabled:opacity-50 flex items-center gap-2"
              >
                <RotateCw size={18} className={isRescanning ? 'animate-spin' : ''} />
                {isRescanning ? 'Rescanning...' : 'Re-scan'}
              </button>
            </div>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Last scanned: {new Date(scanData.scan_timestamp).toLocaleString()}
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section - Score */}
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center">
            <ScoreRing score={scanData.overall_score} />
            {aiAnalysis?.health_summary && (
              <p className="text-center text-white/80 mt-8 max-w-2xl leading-relaxed">
                {aiAnalysis.health_summary}
              </p>
            )}
            {!aiAnalysis && (
              <p className="text-center text-white/60 mt-8 cursor-pointer hover:text-white transition-colors">
                Describe your project for AI insights
              </p>
            )}
          </div>

          {/* Critical Issues Banner */}
          {criticalIssues.length > 0 && (
            <div className="backdrop-blur-sm bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-4">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-red-300 font-bold mb-2">Critical Issues</h3>
                <ul className="space-y-1">
                  {criticalIssues.slice(0, 3).map((issue, idx) => (
                    <li key={idx} className="text-red-200/80 text-sm">
                      • {issue}
                    </li>
                  ))}
                  {criticalIssues.length > 3 && (
                    <li className="text-red-200/60 text-sm italic">
                      + {criticalIssues.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* Terminal Output */}
          {showFixOutput && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Fix Output</h3>
                <button
                  onClick={() => setShowFixOutput(false)}
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  Close
                </button>
              </div>
              <TerminalOutput content={fixOutput} shell="powershell" />
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'healthy', 'warning', 'critical', 'notinstalled'] as const).map(
              (f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 capitalize ${
                    filter === f
                      ? 'bg-indigo-600 text-white border border-indigo-500'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {f === 'notinstalled' ? 'Not Installed' : f} ({filteredTools.length})
                </button>
              )
            )}
          </div>

          {/* Tool Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.length > 0 ? (
              filteredTools.map((tool) => (
                <ToolCard key={tool.tool_name} tool={tool} onFix={handleFix} />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-white/60">
                No tools match this filter
              </div>
            )}
          </div>

          {/* AI Insights */}
          {aiAnalysis && (
            <AIInsights analysis={aiAnalysis} onFixTool={handleFix} />
          )}

          {/* Scan History */}
          <ScanHistory currentScore={scanData.overall_score} />
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-16 py-8 border-t border-white/10 text-center text-white/40 text-sm">
          <p>Dev Health Monitor • Powered by AI</p>
        </div>
      </div>
    </div>
  );
};
