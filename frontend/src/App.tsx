import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ProjectInput } from './components/ProjectInput';
import { ScanDashboard } from './components/ScanDashboard';
import { ScanHistory } from './components/ScanHistory';
import { runHealthScan, runScan } from './api/client';
import type { AppView, HealthScanResponse, ScanResponse, ToolResult, ToolStatus } from './types';

function mapHealthToScanResponse(h: HealthScanResponse): ScanResponse {
  const results: ToolResult[] = h.tools.map((t) => {
    let status: ToolStatus = 'missing';
    if (!t.is_installed) status = 'missing';
    else if (t.status === 'Healthy') status = 'ok';
    else status = 'outdated';
    return {
      name: t.tool_name,
      display_name: t.tool_name,
      category: 'devtool',
      status,
      installed_version: t.current_version,
      min_version: t.required_version,
      install_url: 'https://',
      why_needed: 'Included in full machine scan.',
      is_critical: false,
    };
  });
  const summary = results.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.status === 'ok') acc.ok += 1;
      else if (r.status === 'outdated') acc.outdated += 1;
      else acc.missing += 1;
      return acc;
    },
    { total: 0, ok: 0, outdated: 0, missing: 0 }
  );
  return {
    scan_id: h.scan_id ?? 0,
    stack_name: 'Full machine scan',
    results,
    summary,
    timestamp: h.timestamp ?? h.scan_timestamp,
  };
}

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (req: { user_input: string; detected_tools: string[] }) => {
    setView('scanning');
    setIsLoading(true);
    setError(null);
    setScanData(null);
    try {
      const data = await runScan(req);
      setScanData(data);
      setView('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setView('results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setScanData(null);
    setError(null);
    setView('input');
  };

  const handleLandingQuickScan = async () => {
    setView('scanning');
    setIsLoading(true);
    setError(null);
    setScanData(null);
    try {
      const h = await runHealthScan();
      setScanData(mapHealthToScanResponse(h));
      setView('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Quick scan failed');
      setView('results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHistorySelect = async (data: ScanResponse) => {
    setScanData(data);
    setError(null);
    setView('results');
  };

  return (
    <div className="w-full min-h-screen bg-gray-950">
      {view === 'landing' && (
        <LandingPage
          onQuickScan={handleLandingQuickScan}
          onDescribeProject={() => setView('input')}
          onViewHistory={() => setView('history')}
        />
      )}

      {view === 'input' && (
        <div>
          <div className="max-w-3xl mx-auto px-4 pt-4 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setView('landing')}
              className="text-sm text-gray-400 hover:text-white"
            >
              ← Home
            </button>
            <button
              type="button"
              onClick={() => setView('history')}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              View history
            </button>
          </div>
          <ProjectInput onScanStart={handleScan} />
        </div>
      )}

      {(view === 'scanning' || view === 'results') && (
        <ScanDashboard
          scanData={scanData}
          isLoading={isLoading}
          error={error}
          onReset={handleReset}
        />
      )}

      {view === 'history' && (
        <ScanHistory
          onBack={() => setView('input')}
          onSelectScan={(data) => {
            void handleHistorySelect(data);
          }}
        />
      )}
    </div>
  );
}

export default App;
