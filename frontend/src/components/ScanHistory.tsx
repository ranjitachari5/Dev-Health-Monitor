import React, { useEffect, useState } from 'react';
import { ScanLog } from '../types/index';
import { apiClient } from '../api/client';

interface ScanHistoryProps {
  currentScore?: number;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ currentScore = 0 }) => {
  const [history, setHistory] = useState<ScanLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const logs = await apiClient.getScanHistory();
        const last5 = logs.slice(-5).reverse();
        setHistory(last5);
      } catch (error) {
        console.error('Failed to fetch scan history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Scans</h3>
        <div className="text-center text-white/60">Loading history...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Scans</h3>
        <div className="text-center text-white/60">No scan history yet</div>
      </div>
    );
  }

  const maxScore = Math.max(...history.map(h => h.overall_score), currentScore, 100);
  const minScore = Math.min(...history.map(h => h.overall_score), currentScore, 0);
  const range = maxScore - minScore || 1;

  const getScoreColor = (score: number) => {
    if (score >= 76) return 'bg-emerald-500';
    if (score >= 41) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-6">Score Over Time</h3>

      {/* Chart visualization */}
      <div className="flex items-end justify-center gap-2 h-32 mb-6">
        {history.map((scan, idx) => {
          const normalizedHeight = ((scan.overall_score - minScore) / range) * 100;
          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
            >
              <div className="relative w-full h-full flex items-end justify-center">
                <div
                  className={`w-3/4 rounded-t transition-all duration-300 group-hover:w-full ${getScoreColor(
                    scan.overall_score
                  )}`}
                  style={{
                    height: `${Math.max(normalizedHeight, 5)}%`,
                    opacity: 0.8
                  }}
                />
              </div>
              <div className="text-xs text-white/60 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {scan.overall_score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {history.map((scan, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreColor(scan.overall_score)}`}>
                <span className="text-xs font-bold text-white">
                  {Math.round(scan.overall_score)}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/80 font-medium truncate">{scan.platform}</p>
              <p className="text-white/40 text-xs">
                {new Date(scan.scan_timestamp).toLocaleDateString()} {new Date(scan.scan_timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
