import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    let current = 0;
    const increment = Math.ceil(score / 60);
    interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 76) return { stroke: '#10b981', glow: 'rgba(16,185,129,0.5)', label: 'Healthy', text: '#6ee7b7' };
    if (s >= 41) return { stroke: '#eab308', glow: 'rgba(234,179,8,0.5)', label: 'Warning', text: '#fde047' };
    return { stroke: '#ef4444', glow: 'rgba(239,68,68,0.5)', label: 'Critical', text: '#fca5a5' };
  };

  const cfg = getColor(displayScore);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="score-ring-container flex flex-col items-center justify-center">
      <div className="relative w-44 h-44">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${cfg.glow.replace('0.5', '0.08')} 0%, transparent 70%)`,
            animation: 'glow-pulse 2.5s ease-in-out infinite',
          }}
        />
        <svg width="176" height="176" viewBox="0 0 176 176" className="transform -rotate-90">
          {/* Track */}
          <circle cx="88" cy="88" r={radius} stroke="rgba(59,130,246,0.1)" strokeWidth="10" fill="none" />
          {/* Blue base ring */}
          <circle cx="88" cy="88" r={radius} stroke="rgba(30,64,175,0.15)" strokeWidth="10" fill="none"
            strokeDasharray={circumference} strokeDashoffset={0} />
          {/* Score arc */}
          <circle
            cx="88" cy="88" r={radius}
            stroke={cfg.stroke}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s cubic-bezier(0.23,1,0.32,1), stroke 0.5s ease-out',
              filter: `drop-shadow(0 0 12px ${cfg.glow})`,
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="text-5xl font-black" style={{ color: cfg.text, textShadow: `0 0 20px ${cfg.glow}` }}>
            {displayScore}
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: cfg.text, opacity: 0.7 }}>
            {cfg.label}
          </div>
        </div>
      </div>
      <p className="mt-5 text-blue-100/60 font-medium text-sm">Overall Health Score</p>
    </div>
  );
};
