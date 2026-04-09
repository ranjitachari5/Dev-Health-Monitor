import React, { useState, useEffect, useRef, useCallback } from 'react';
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

/* ─── Particle system ──────────────────────────────────────────────── */
interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  alpha: number;
  color: string;
}

function useParticles(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#3b82f6', '#60a5fa', '#00d4ff', '#7c3aed', '#0891b2'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Seed particles
    const seed = () => {
      particlesRef.current = Array.from({ length: 80 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));
    };
    seed();

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', onMouse);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Connect nearby particles + attract toward cursor
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Cursor attraction
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const force = (200 - dist) / 200;
          p.vx += (dx / dist) * force * 0.03;
          p.vy += (dy / dist) * force * 0.03;
        }

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) { p.vx = (p.vx / speed) * 1.5; p.vy = (p.vy / speed) * 1.5; }

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const cdx = p.x - q.x;
          const cdy = p.y - q.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${0.12 * (1 - cdist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [canvasRef]);
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

  // Cursor refs
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  useCursor(dotRef, ringRef);
  useParticles(particlesCanvasRef);

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
    <div className="w-full min-h-screen" style={{ background: 'var(--blue-deep)' }}>
      {/* ── Global overlay layers ── */}
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
      <div className="cursor-glow-layer" />
      <canvas ref={particlesCanvasRef} className="particles-canvas" />

      {/* ── Views ── */}
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
