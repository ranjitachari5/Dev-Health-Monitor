import React, { useEffect, useState, useRef } from 'react';
import { Play, Cpu, Zap, Shield, Activity } from 'lucide-react';
interface LandingPageProps {
  onQuickScan: () => void | Promise<void>;
  onDescribeProject: () => void;
  onViewHistory: () => void;
}

const FEATURES = [
  { icon: <Zap size={18} />, label: 'AI-Powered Analysis', desc: 'Grok AI inspects your stack' },
  { icon: <Cpu size={18} />, label: 'Deep System Scan', desc: 'Every tool, every version' },
  { icon: <Shield size={18} />, label: 'Health Score', desc: 'Instant readiness report' },
  { icon: <Activity size={18} />, label: 'Live Progress', desc: 'Real-time terminal output' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onQuickScan,
  onDescribeProject,
  onViewHistory,
}) => {
  const [platform, setPlatform] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const heroRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) setPlatform('Windows');
    else if (ua.includes('Mac')) setPlatform('macOS');
    else if (ua.includes('Linux')) setPlatform('Linux');
    else setPlatform('Unknown');

    const handleMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
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

  // 3D parallax transform based on cursor position
  const parallaxStyle = {
    transform: `rotateY(${(mousePos.x - 0.5) * 8}deg) rotateX(${(mousePos.y - 0.5) * -6}deg)`,
    transition: 'transform 0.2s ease-out',
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
        <button
          type="button"
          onClick={onViewHistory}
          className="nav-link text-sm font-medium px-4 py-2"
          data-hover
        >
          Scan History
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 pb-16 pt-8"
        ref={heroRef}>
        <div
          className="max-w-3xl w-full text-center scene-3d"
          style={parallaxStyle}
        >
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 mb-8 px-5 py-2.5 rounded-full glass-card animate-fade-in-up`}
            style={{ animationDelay: '0ms', border: '1px solid rgba(59,130,246,0.25)' }}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: '0 0 8px #34d399' }} />
            <span className="text-sm text-blue-200 font-medium">Grok AI · Powered by xAI</span>
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
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up`}
            style={{ animationDelay: '300ms' }}
          >
            <button
              type="button"
              onClick={() => void handleQuickScan()}
              disabled={isScanning}
              className="btn-neon group flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-white font-semibold text-base animate-glow-pulse disabled:opacity-50 disabled:cursor-not-allowed"
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
              type="button"
              onClick={onDescribeProject}
              disabled={isScanning}
              className="glass-card flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-blue-100 font-semibold text-base disabled:opacity-50 hover:text-white"
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
                transform: `perspective(800px) rotateY(${(mousePos.x - 0.5) * 5}deg) rotateX(${(mousePos.y - 0.5) * -4}deg)`,
                transition: 'transform 0.25s ease-out',
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
