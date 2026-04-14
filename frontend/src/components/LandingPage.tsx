import React, { useEffect, useRef, useState } from 'react';
import { Play, Cpu, Zap, Shield, Activity } from 'lucide-react';
import type { AiKeyStatus } from '../api/client';
interface LandingPageProps {
  onQuickScan: () => void | Promise<void>;
  onDescribeProject: () => void;
  onViewHistory: () => void;
  onSetApiKey: () => void;
  aiKeyStatus: AiKeyStatus | null;
}

const FEATURES = [
  { icon: <Zap size={18} />, label: 'AI-Powered Analysis', desc: 'OpenRouter-powered stack analysis' },
  { icon: <Cpu size={18} />, label: 'Deep System Scan', desc: 'Every tool, every version' },
  { icon: <Shield size={18} />, label: 'Health Score', desc: 'Instant readiness report' },
  { icon: <Activity size={18} />, label: 'Live Progress', desc: 'Real-time terminal output' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onQuickScan,
  onDescribeProject,
  onViewHistory,
  onSetApiKey,
  aiKeyStatus,
}) => {
  const [platform, setPlatform] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) setPlatform('Windows');
    else if (ua.includes('Mac')) setPlatform('macOS');
    else if (ua.includes('Linux')) setPlatform('Linux');
    else setPlatform('Unknown');
  }, []);

  // Sliding fill-pill for CTA buttons
  const ctaContainerRef = useRef<HTMLDivElement>(null);
  const ctaBtnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [ctaPill, setCtaPill] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const snapPillTo = (idx: number) => {
    const btn = ctaBtnRefs.current[idx];
    const container = ctaContainerRef.current;
    if (!btn || !container) return;
    const b = btn.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    setCtaPill({ left: b.left - c.left, top: b.top - c.top, width: b.width, height: b.height, ready: true });
  };

  // Place pill on btn-0 after first paint
  useEffect(() => {
    const t = setTimeout(() => snapPillTo(0), 350);
    return () => clearTimeout(t);
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
      case 'Windows': return '⊞';
      case 'macOS': return '⌘';
      case 'Linux': return '🐧';
      default: return '💻';
    }
  };


  return (
    <div className="relative w-full min-h-full flex flex-col">

      {/* Nav */}
      <div className="relative z-20 flex justify-between items-center px-8 pt-7">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}>
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">DevHealth</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSetApiKey}
            className="nav-link text-sm font-medium px-4 py-2"
            data-hover
          >
            Set API Key
          </button>
          <button
            type="button"
            onClick={onViewHistory}
            className="nav-link text-sm font-medium px-4 py-2"
            data-hover
          >
            Scan History
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pb-16 pt-8"
        ref={heroRef}>
        <div className="max-w-3xl w-full text-center">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full glass-card animate-fade-in-up`}
            style={{ animationDelay: '0ms', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <div
              className={`w-2 h-2 rounded-full ${aiKeyStatus?.ok ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}
              style={{ boxShadow: aiKeyStatus?.ok ? '0 0 8px #34d399' : '0 0 8px #f87171' }}
            />
            <span className="text-sm text-blue-200 font-medium">
              {aiKeyStatus
                ? `AI Key Status: ${aiKeyStatus.ok ? 'Valid' : 'Invalid'} (${aiKeyStatus.source === 'custom' ? 'Your key' : 'Default brain'})`
                : 'Checking AI key status...'}
            </span>
          </div>

          {/* Headline */}
          <h1
            className={`text-6xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none animate-fade-in-up`}
            style={{ animationDelay: '100ms' }}
          >
            <span className="text-white">Is your laptop</span>
            <br />
            <span className="gradient-text">ready to code?</span>
          </h1>

          {/* Sub */}
          <p
            className={`text-lg text-blue-200/70 mb-12 leading-relaxed max-w-xl mx-auto animate-fade-in-up`}
            style={{ animationDelay: '200ms' }}
          >
            Describe your stack, scan your machine, and fix what&apos;s missing —
            <br className="hidden sm:block" /> all in one AI-powered health report.
          </p>

          {/* CTA Buttons */}
          <div
            ref={ctaContainerRef}
            className={`relative flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up`}
            style={{ animationDelay: '300ms' }}
            onMouseLeave={() => snapPillTo(0)}
          >
            {/* Sliding solid-blue fill — this IS the button colour */}
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: ctaPill.left,
                top: ctaPill.top,
                width: ctaPill.width,
                height: ctaPill.height,
                opacity: ctaPill.ready ? 1 : 0,
                borderRadius: '0.75rem',
                pointerEvents: 'none',
                zIndex: 0,
                background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
                border: '1px solid rgba(96,165,250,0.7)',
                boxShadow:
                  '0 0 28px rgba(59,130,246,0.55), 0 0 60px rgba(30,64,175,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition:
                  'left 0.35s cubic-bezier(0.23,1,0.32,1), top 0.35s cubic-bezier(0.23,1,0.32,1), width 0.35s cubic-bezier(0.23,1,0.32,1), height 0.35s cubic-bezier(0.23,1,0.32,1), opacity 0.2s ease',
              }}
            />

            {/* Both buttons are transparent shells — pill provides the fill */}
            <button
              ref={el => { ctaBtnRefs.current[0] = el; }}
              type="button"
              onClick={() => void handleQuickScan()}
              disabled={isScanning}
              onMouseEnter={() => snapPillTo(0)}
              className="relative z-10 group flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-white font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'transparent', border: '1px solid transparent', transition: 'color 0.25s' }}
              data-hover
            >
              {isScanning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Play size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Run Quick Scan</span>
                </>
              )}
            </button>
            <button
              ref={el => { ctaBtnRefs.current[1] = el; }}
              type="button"
              onClick={onDescribeProject}
              disabled={isScanning}
              onMouseEnter={() => snapPillTo(1)}
              className="relative z-10 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base disabled:opacity-50"
              style={{ background: 'transparent', border: '1px solid rgba(96,165,250,0.25)', color: 'rgba(191,219,254,0.85)', transition: 'color 0.25s, border-color 0.25s' }}
              data-hover
            >
              Describe Project →
            </button>
          </div>

          {/* Platform badge */}
          {platform && (
            <div
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card text-sm animate-fade-in-up`}
              style={{ animationDelay: '400ms' }}
            >
              <span className="text-xl">{getPlatformIcon(platform)}</span>
              <span className="text-blue-200/80 font-medium">Running on {platform}</span>
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div
          className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full mt-16 animate-fade-in-up`}
          style={{ animationDelay: '500ms' }}
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className="glass-card tilt-card rounded-2xl p-4 flex flex-col gap-2"
              style={{
                animationDelay: `${500 + i * 80}ms`,
              }}
              data-hover
            >
              <div className="text-blue-400 mb-1">{f.icon}</div>
              <div className="text-white font-semibold text-sm">{f.label}</div>
              <div className="text-blue-200/50 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
