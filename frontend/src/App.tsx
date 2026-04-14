import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { ProjectInput } from './components/ProjectInput';
import { ScanDashboard } from './components/ScanDashboard';
import { ScanHistory } from './components/ScanHistory';
import { Squares } from './components/Squares';
import { ApiKeyModal, loadStoredConfig, type ApiKeyConfig } from './components/ApiKeyModal';
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


/* ─── Custom cursor ────────────────────────────────────────────────── */
function useCursor(
  dotRef: React.RefObject<HTMLDivElement>,
  ringRef: React.RefObject<HTMLDivElement>
) {
  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let raf: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      // Update CSS vars for the glow layer
      document.documentElement.style.setProperty('--cursor-x', `${mx}px`);
      document.documentElement.style.setProperty('--cursor-y', `${my}px`);
    };

    const animate = () => {
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      dot.style.left = `${mx}px`;
      dot.style.top = `${my}px`;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      raf = requestAnimationFrame(animate);
    };

    const onEnter = () => ring.classList.add('hovering');
    const onLeave = () => ring.classList.remove('hovering');

    window.addEventListener('mousemove', onMove);
    const interactives = document.querySelectorAll('button, a, input, textarea, [data-hover]');
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, [dotRef, ringRef]);
}

/* ─── App component ─────────────────────────────────────────────────── */
function App() {
  const [view, setView] = useState<AppView>('landing');
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKeyConfig, setApiKeyConfig] = useState<ApiKeyConfig>(() => loadStoredConfig());

  // Cursor refs
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  useCursor(dotRef, ringRef);

  // Re-bind cursor interactives whenever view changes
  const rebindCursor = useCallback(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const onEnter = () => ring.classList.add('hovering');
    const onLeave = () => ring.classList.remove('hovering');
    const timer = window.setTimeout(() => {
      const els = document.querySelectorAll('button, a, input, textarea, [data-hover]');
      els.forEach((el) => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    rebindCursor();
  }, [view, rebindCursor]);

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
    <div className="w-full h-screen bg-[#1A1A1B] overflow-hidden flex flex-col items-center justify-center relative">
      {/* ── Global overlay layers ── */}
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
      <div className="cursor-glow-layer pointer-events-none" />

      {/* Container with soft shadow for premium feel */}
      <div className="relative w-full h-full overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.2)] bg-black/20">
        <div className="absolute inset-0 z-0">
          <Squares 
            speed={0.5} 
            squareSize={40}
            direction="diagonal" 
            borderColor="#333"
            hoverFillColor="#3b82f6"
          />
        </div>

        {/* ── Views ── */}
        <div className="absolute inset-0 z-10 overflow-y-auto pointer-events-auto">
          {view === 'landing' && (
            <LandingPage
              onQuickScan={handleLandingQuickScan}
              onDescribeProject={() => setView('input')}
              onViewHistory={() => setView('history')}
              onSetApiKey={() => setIsApiKeyModalOpen(true)}
            />
          )}

          {view === 'input' && (
            <div className="min-h-full py-10">
              <div className="max-w-3xl mx-auto px-4 flex justify-between items-center mb-8">
                <button
                  type="button"
                  onClick={() => setView('landing')}
                  className="nav-link text-sm"
                >
                  ← Home
                </button>
                <button
                  type="button"
                  onClick={() => setView('history')}
                  className="nav-link text-sm"
                >
                  View history
                </button>
              </div>
              <ProjectInput onScanStart={handleScan} />
            </div>
          )}

          {(view === 'scanning' || view === 'results') && (
            <div className="min-h-full py-10">
              <ScanDashboard
                scanData={scanData}
                isLoading={isLoading}
                error={error}
                onReset={handleReset}
              />
            </div>
          )}

          {view === 'history' && (
            <div className="min-h-full py-10">
              <ScanHistory
                onBack={() => setView('input')}
                onSelectScan={(data) => {
                  void handleHistorySelect(data);
                }}
              />
            </div>
          )}
        </div>
      </div>
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={(cfg) => setApiKeyConfig(cfg)}
        currentConfig={apiKeyConfig}
      />
    </div>
  );
}

export default App;
