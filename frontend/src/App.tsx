import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LandingPage } from './components/LandingPage';
import { ProjectInput } from './components/ProjectInput';
import { ScanDashboard } from './components/ScanDashboard';
import { ScanHistory } from './components/ScanHistory';
import { Squares } from './components/Squares';
import { ApiKeyModal, ApiKeyButton, loadStoredConfig, saveStoredConfig } from './components/ApiKeyModal';
import { AuthPage } from './components/AuthPage';
import { BrainModal } from './components/BrainModal';
import {
  runHealthScan,
  runScan,
  getStoredToken,
  setStoredToken,
  clearAuth,
  BRAIN_CHOSEN_KEY,
} from './api/client';
import type { AppView, HealthScanResponse, ScanResponse, ToolResult, ToolStatus } from './types';

/** Compute a proper 0-100 health score from scan results */
function computeScore(results: ToolResult[]): number {
  if (results.length === 0) return 100;
  const ok = results.filter((r) => r.status === 'ok').length;
  const outdated = results.filter((r) => r.status === 'outdated').length;
  const total = results.length;
  return Math.max(0, Math.min(100, Math.round(((ok + outdated * 0.5) / total) * 100)));
}

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
    overall_score: h.overall_score ?? computeScore(results),
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

/**
 * Determine the initial view:
 *   - No JWT              → 'auth'
 *   - JWT but no brain    → 'brain'
 *   - JWT + brain chosen  → 'landing'
 */
function getInitialView(): AppView {
  const token = getStoredToken();
  if (!token) return 'auth';
  const brainChosen = localStorage.getItem(BRAIN_CHOSEN_KEY);
  if (!brainChosen) return 'brain';
  return 'landing';
}

function App() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    // Restore email from localStorage if present
    return localStorage.getItem('devhealth_email');
  });
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState(() => {
    const cfg = loadStoredConfig();
    // Auto-upgrade stale Gemini config
    if (
      cfg.provider === 'gemini' &&
      (cfg.model === 'gemini-1.5-flash' || cfg.baseUrl.endsWith('/'))
    ) {
      const upgraded = {
        ...cfg,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash',
      };
      saveStoredConfig(upgraded);
      return upgraded;
    }
    return cfg;
  });

  const hasApiKey = !!aiConfig.apiKey;

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

  // ── Auth handlers ──────────────────────────────────────────────────
  const handleAuth = (token: string, email: string) => {
    setStoredToken(token);
    localStorage.setItem('devhealth_email', email);
    setUserEmail(email);
    // After auth always show brain modal (first session or new login)
    localStorage.removeItem(BRAIN_CHOSEN_KEY);
    setView('brain');
  };

  const handleBrainConfirm = () => {
    localStorage.setItem(BRAIN_CHOSEN_KEY, '1');
    // Reload AI config from storage (BrainModal may have updated it)
    setAiConfig(loadStoredConfig());
    setView('landing');
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('devhealth_email');
    setUserEmail(null);
    setScanData(null);
    setError(null);
    setView('auth');
  };

  // ── Scan handlers ──────────────────────────────────────────────────
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

  // ── Auth / Brain views (full screen, no background canvas needed) ──
  if (view === 'auth') {
    return (
      <>
        <div className="cursor-dot" ref={dotRef} />
        <div className="cursor-ring" ref={ringRef} />
        <AuthPage onAuth={handleAuth} />
      </>
    );
  }

  if (view === 'brain') {
    return (
      <>
        <div className="cursor-dot" ref={dotRef} />
        <div className="cursor-ring" ref={ringRef} />
        <div className="w-full h-screen bg-[#050510] flex items-center justify-center">
          <BrainModal onConfirm={handleBrainConfirm} />
        </div>
      </>
    );
  }

  // ── Main app views ─────────────────────────────────────────────────
  return (
    <div className="w-full h-screen bg-[#1A1A1B] overflow-hidden flex flex-col items-center justify-center relative">
      {/* ── Global overlay layers ── */}
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={(cfg) => setAiConfig(cfg)}
        currentConfig={aiConfig}
      />

      {/* Container */}
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
              onOpenSettings={() => setSettingsOpen(true)}
              hasApiKey={hasApiKey}
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
                <div className="flex items-center gap-3">
                  <ApiKeyButton onClick={() => setSettingsOpen(true)} hasKey={hasApiKey} />
                  <button
                    type="button"
                    onClick={() => setView('history')}
                    className="nav-link text-sm"
                  >
                    View history
                  </button>
                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: 'rgba(185,28,28,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: 'rgba(252,165,165,0.7)',
                    }}
                    title={`Logged in as ${userEmail ?? ''}`}
                  >
                    Logout
                  </button>
                </div>
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
    </div>
  );
}

export default App;
