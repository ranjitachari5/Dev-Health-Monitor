import React, { useEffect, useState } from 'react';
import type { ScanResponse } from '../types';
import { ScanProgress } from './ScanProgress';
import { ToolCard } from './ToolCard';
import { DownloadModal } from './DownloadModal';

interface ScanDashboardProps {
  scanData: ScanResponse | null;
  isLoading: boolean;
  error: string | null;
  onReset: () => void;
}

export const ScanDashboard: React.FC<ScanDashboardProps> = ({
  scanData,
  isLoading,
  error,
  onReset,
}) => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [cardsMounted, setCardsMounted] = useState(false);

  useEffect(() => {
    if (scanData && !isLoading) {
      setCardsMounted(false);
      const id = requestAnimationFrame(() => setCardsMounted(true));
      return () => cancelAnimationFrame(id);
    }
  }, [scanData, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={onReset}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← New scan
            </button>
          </div>
          <div className="animate-pulse bg-gray-800 rounded-xl h-8 w-2/3 mb-6" />
          <ScanProgress
            isVisible
            stackName={scanData?.stack_name}
            toolCount={scanData?.results?.length}
            results={scanData?.results}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 py-8 flex items-center justify-center">
        <div className="max-w-lg w-full rounded-xl border border-red-800 bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-2">Scan failed</h2>
          <p className="text-gray-300 text-sm mb-6">{error}</p>
          <button
            type="button"
            onClick={onReset}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2 text-white font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return null;
  }

  const { summary } = scanData;
  const needsAttention = summary.outdated > 0 || summary.missing > 0;
  const ts = scanData.timestamp
    ? new Date(scanData.timestamp).toLocaleString()
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-28">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={onReset}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← New scan
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{scanData.stack_name}</h1>
            {ts && <p className="text-gray-400 text-sm mt-1">{ts}</p>}
            {scanData.environment && (
              <p className="text-gray-500 text-xs mt-2 font-mono">
                Host: {scanData.environment.system} ({scanData.environment.os_name})
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-800 text-gray-300">
              {summary.total} tools
            </span>
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-900 text-green-300">
              {summary.ok} ok
            </span>
            {summary.outdated > 0 && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-yellow-900 text-yellow-300">
                {summary.outdated} outdated
              </span>
            )}
            {summary.missing > 0 && (
              <span className="text-xs px-3 py-1 rounded-full font-medium bg-red-900 text-red-300">
                {summary.missing} missing
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {scanData.results.map((t, index) => (
            <div
              key={t.name + index}
              className={`transform transition-all duration-500 ease-out ${
                cardsMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
              style={{ transitionDelay: `${index * 50}ms` } as React.CSSProperties}
            >
              <ToolCard tool={t} />
            </div>
          ))}
        </div>
      </div>

      {needsAttention && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-gray-800 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 max-w-7xl mx-auto w-full px-4">
          <p className="text-gray-300 text-sm">
            {summary.outdated + summary.missing} tool(s) need attention
          </p>
          <button
            type="button"
            onClick={() => setShowDownloadModal(true)}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 font-medium shrink-0"
          >
            Download / Update all →
          </button>
        </div>
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        tools={scanData.results.filter((t) => t.status !== 'ok')}
      />

    </div>
  );
};
