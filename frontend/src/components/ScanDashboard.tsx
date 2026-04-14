import React, { useEffect, useState } from 'react';
import type { ScanResponse } from '../types';
import { ScanProgress } from './ScanProgress';
import { ToolCard } from './ToolCard';
import { DownloadModal } from './DownloadModal';
import { InstallProgressModal } from './InstallProgressModal';
import { generateHealthReport } from '../utils/reportGenerator';
import { SystemHealthReport } from './SystemHealthReport';
import { Download, ArrowLeft, RefreshCw } from 'lucide-react';

interface ScanDashboardProps {
  scanData: ScanResponse | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
}

export const ScanDashboard: React.FC<ScanDashboardProps> = ({
  scanData,
  isLoading,
  error,
  onReset,
}) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [activeFix, setActiveFix] = useState<{ toolName: string; fixType: 'install' | 'update' } | null>(null);
  const [cardsMounted, setCardsMounted] = useState(false);

  const triggerFix = (toolName: string, fixType: 'install' | 'update') => {
    setActiveFix({ toolName, fixType });
  };

  useEffect(() => {
    if (scanData && !isLoading) {
      setCardsMounted(false);
      const id = requestAnimationFrame(() => setCardsMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, [scanData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-full flex flex-col text-white px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <button
              type="button"
              onClick={onReset}
              className="nav-link text-sm flex items-center gap-2"
            >
              <ArrowLeft size={14} /> New scan
            </button>
          </div>

          {/* Scanning animation */}
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-32 h-32 mb-8">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-blue-400/20 animate-ping" style={{ animationDelay: '0.3s' }} />
              {/* Inner spinner */}
              <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"
                style={{ boxShadow: '0 0 20px rgba(59,130,246,0.4)' }} />
              <div className="absolute inset-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(30,64,175,0.2)' }}>
                <RefreshCw size={20} className="text-blue-400 animate-spin" style={{ animationDirection: 'reverse' }} />
              </div>
            </div>

            <p className="text-xl font-semibold gradient-text mb-2">Scanning your environment</p>
            <p className="text-blue-200/50 text-sm">Connecting to Grok AI...</p>

            <div className="flex gap-2 mt-6">
              <div className="pulse-dot" />
              <div className="pulse-dot" />
              <div className="pulse-dot" />
            </div>
          </div>

          {/* Terminal output */}
          <div className="mt-4">
            <div className="relative overflow-hidden rounded-xl terminal-glow">
              <div className="scan-line" />
              <ScanProgress
                isVisible
                stackName={scanData?.stack_name}
                toolCount={scanData?.results?.length}
                results={scanData?.results}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full flex-1 flex flex-col items-center justify-center text-white px-4">
        <div className="max-w-lg w-full glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(185,28,28,0.2)', border: '1px solid rgba(239,68,68,0.3)', boxShadow: '0 0 30px rgba(239,68,68,0.15)' }}>
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Scan Failed</h2>
          <p className="text-blue-200/60 text-sm mb-8">{error}</p>
          <button
            type="button"
            onClick={onReset}
            className="btn-neon w-full rounded-xl py-3 text-white font-semibold"
            data-hover
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!scanData) return null;

  const { summary } = scanData;
  const needsAttention = summary.outdated > 0 || summary.missing > 0;
  const ts = scanData.timestamp ? new Date(scanData.timestamp).toLocaleString() : null;

  return (
    <div className="min-h-full flex flex-col text-white pb-28">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            type="button"
            onClick={() => generateHealthReport(scanData)}
            className="btn-neon flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
            data-hover
          >
            <Download size={14} />
            Export Report
          </button>
          <button
            type="button"
            onClick={onReset}
            className="nav-link text-sm flex items-center gap-2"
          >
            <ArrowLeft size={14} /> New scan
          </button>
        </div>

        {/* Stack info */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-white">{scanData.stack_name}</h1>
            {ts && <p className="text-blue-200/50 text-sm mt-1">{ts}</p>}
            {scanData.environment && (
              <p className="text-blue-200/30 text-xs mt-2 font-mono">
                Host: {scanData.environment.system} ({scanData.environment.os_name})
              </p>
            )}
          </div>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-2 justify-end">
            <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={{ background: 'rgba(30,64,175,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              {summary.total} tools
            </span>
            <span className="badge-ok text-xs px-3 py-1.5 rounded-full font-semibold">
              ✓ {summary.ok} healthy
            </span>
            {summary.outdated > 0 && (
              <span className="badge-outdated text-xs px-3 py-1.5 rounded-full font-semibold">
                ⚡ {summary.outdated} outdated
              </span>
            )}
            {summary.missing > 0 && (
              <span className="badge-missing text-xs px-3 py-1.5 rounded-full font-semibold">
                ✗ {summary.missing} missing
              </span>
            )}
          </div>
        </div>

        {/* Tool cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {scanData.results.map((t, index) => (
            <div
              key={t.name + index}
              className={`transform transition-all duration-500 ease-out ${
                cardsMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 50}ms` } as React.CSSProperties}
            >
              <ToolCard tool={t} onFixTool={triggerFix} />
            </div>
          ))}
        </div>

        {/* AI Health Report */}
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <SystemHealthReport
            scanData={scanData}
            onFixTool={async (toolName, fixType) => {
              triggerFix(toolName, fixType);
            }}
          />
        </div>
      </div>

      {/* Footer action bar */}
      {needsAttention && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4"
          style={{ background: 'linear-gradient(to top, rgba(5,5,16,0.98) 0%, rgba(5,5,16,0.8) 100%)', borderTop: '1px solid rgba(59,130,246,0.15)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <p className="text-blue-200/70 text-sm">
              <span className="text-white font-semibold">{summary.outdated + summary.missing}</span> tool(s) need your attention
            </p>
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="btn-neon rounded-xl px-6 py-2.5 text-white font-semibold shrink-0 text-sm animate-glow-pulse"
              data-hover
            >
              Fix All Issues →
            </button>
          </div>
        </div>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        tools={scanData.results.filter((t) => t.status !== 'ok')}
        onFixTool={triggerFix}
      />
      <InstallProgressModal
        isOpen={!!activeFix}
        toolName={activeFix?.toolName ?? ''}
        fixType={activeFix?.fixType ?? 'install'}
        onClose={() => setActiveFix(null)}
        onComplete={() => {
          // Keep it simple: user can re-scan to validate post-install state.
        }}
      />
    </div>
  );
};
