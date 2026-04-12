import React from 'react';
import type { ScanResponse } from '../types';
import { ScoreRing } from './ScoreRing';
import { AIInsights } from './AIInsights';
import { InstallProgressModal } from './InstallProgressModal';

interface SystemHealthReportProps {
  scanData: ScanResponse;
}

export const SystemHealthReport: React.FC<SystemHealthReportProps> = ({ scanData }) => {
  const analysis = scanData.ai_analysis;
  const [installModalOpen, setInstallModalOpen] = React.useState(false);
  const [installingTool, setInstallingTool] = React.useState('');

  // Compute score from actual results — never blindly default to 100
  const score = (() => {
    if (typeof scanData.overall_score === 'number') return scanData.overall_score;
    const results = scanData.results ?? [];
    if (results.length === 0) return 0;
    const ok = results.filter((r) => r.status === 'ok').length;
    const outdated = results.filter((r) => r.status === 'outdated').length;
    return Math.max(0, Math.min(100, Math.round(((ok + outdated * 0.5) / results.length) * 100)));
  })();


  return (
    <div className="mt-10 pt-10" style={{ borderTop: '1px solid rgba(59,130,246,0.1)' }}>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-1 h-8 rounded-full"
          style={{ background: 'linear-gradient(to bottom,#3b82f6,#7c3aed)', boxShadow: '0 0 12px rgba(59,130,246,0.4)' }}
        />
        <h2 className="text-2xl font-extrabold gradient-text">AI Health Report</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score panel */}
        <div
          className="col-span-1 glass-card rounded-2xl p-8 flex flex-col items-center"
          style={{ background: 'linear-gradient(160deg,rgba(13,27,75,0.6) 0%,rgba(5,5,16,0.8) 100%)' }}
        >
          <ScoreRing score={score} />
          {analysis?.health_summary && (
            <div
              className="mt-8 w-full p-4 rounded-xl"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(59,130,246,0.1)',
              }}
            >
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-200/40 mb-2">
                Executive Summary
              </h4>
              <p className="text-sm text-blue-100/70 leading-relaxed">{analysis.health_summary}</p>
            </div>
          )}
        </div>

        {/* AI Insights panel */}
        <div className="col-span-1 lg:col-span-2">
          {analysis ? (
            <div
              className="glass-card rounded-2xl p-6 h-full"
              style={{ background: 'linear-gradient(135deg,rgba(8,8,40,0.8) 0%,rgba(13,27,75,0.4) 100%)' }}
            >
              <AIInsights
                analysis={analysis}
                onFixTool={async (toolName) => {
                  setInstallingTool(toolName);
                  setInstallModalOpen(true);
                }}
              />
            </div>
          ) : (
            <div
              className="glass-card rounded-2xl p-6 h-full flex flex-col items-center justify-center gap-4"
              style={{ minHeight: '240px' }}
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-blue-500/20 animate-ping" />
                <div
                  className="absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"
                  style={{ boxShadow: '0 0 16px rgba(59,130,246,0.3)' }}
                />
              </div>
              <p className="text-blue-200/50 font-medium text-sm">Generating AI Insights…</p>
            </div>
          )}
        </div>
      </div>

      <InstallProgressModal
        isOpen={installModalOpen}
        toolName={installingTool}
        onClose={() => setInstallModalOpen(false)}
        onComplete={(success) => {
          if (success) {
            // Optional: User can be prompted to re-scan here
          }
        }}
      />
    </div>
  );
};
