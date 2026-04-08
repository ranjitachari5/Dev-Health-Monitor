import React, { useEffect, useState } from 'react';

interface ScoreRingProps {
  score: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score }) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let current = 0;
    const increment = Math.ceil(score / 50);

    interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 76) return '#10b981';
    if (s >= 41) return '#eab308';
    return '#ef4444';
  };

  const getLabel = (s: number) => {
    if (s >= 76) return 'Healthy';
    if (s >= 41) return 'Warning';
    return 'Critical';
  };

  const color = getColor(displayScore);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        <svg
          width="160"
          height="160"
          viewBox="0 0 160 160"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 0.5s ease-out, stroke 0.5s ease-out',
              filter: `drop-shadow(0 0 8px ${color}80)`
            }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="text-5xl font-bold text-white">{displayScore}</div>
          <div className="text-xs text-white/60 uppercase tracking-widest">
            {getLabel(displayScore)}
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-white/80 font-medium">Overall Health Score</p>
      </div>
    </div>
  );
};
