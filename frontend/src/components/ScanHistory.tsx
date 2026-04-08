import React, { useEffect, useState } from 'react';
import { getScanById, getScanHistory } from '../api/client';
import type { ScanHistoryItem, ScanResponse } from '../types';

interface ScanHistoryProps {
  onBack: () => void;
  onSelectScan?: (data: ScanResponse) => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({ onBack, onSelectScan }) => {
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getScanHistory();
        if (!cancelled) setItems(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load history');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openScan = async (id: number) => {
    if (!onSelectScan) return;
    setOpeningId(id);
    try {
      const full = await getScanById(id);
      onSelectScan(full);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to open scan');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Scan history</h1>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Back
          </button>
        </div>

        {loading && (
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-800 rounded-xl" />
            <div className="h-16 bg-gray-800 rounded-xl" />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 text-red-200 text-sm p-4">
            {error}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="text-gray-500 text-sm">No scans yet. Run a scan from the home screen.</p>
        )}

        <ul className="space-y-3 mt-4">
          {items.map((row) => (
            <li key={row.scan_id}>
              <button
                type="button"
                disabled={!onSelectScan || openingId === row.scan_id}
                onClick={() => void openScan(row.scan_id)}
                className="w-full text-left rounded-xl border border-gray-800 bg-gray-900 hover:bg-gray-800/80 p-4 transition-colors disabled:opacity-60"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-white">{row.stack_name}</span>
                  <span className="text-xs text-gray-500">
                    {row.timestamp ? new Date(row.timestamp).toLocaleString() : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{row.user_input_summary}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                    {row.summary?.total ?? 0} tools
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                    {row.summary?.ok ?? 0} ok
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-900 text-yellow-300">
                    {row.summary?.outdated ?? 0} outdated
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900 text-red-300">
                    {row.summary?.missing ?? 0} missing
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
