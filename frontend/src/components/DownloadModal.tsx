import React, { useEffect, useMemo } from 'react';
import type { ToolCategory, ToolResult } from '../types';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tools: ToolResult[];
}

const CATEGORY_ORDER: ToolCategory[] = [
  'language',
  'runtime',
  'package_manager',
  'database',
  'container',
  'devtool',
];

const VALID_CAT = new Set<ToolCategory>(CATEGORY_ORDER);

function normalizeCat(c: string): ToolCategory {
  return VALID_CAT.has(c as ToolCategory) ? (c as ToolCategory) : 'devtool';
}

function categoryLabel(c: ToolCategory): string {
  switch (c) {
    case 'package_manager':
      return 'Package managers';
    case 'devtool':
      return 'Dev tools';
    default:
      return c.replace('_', ' ');
  }
}

export const DownloadModal: React.FC<DownloadModalProps> = ({
  isOpen,
  onClose,
  tools,
}) => {
  const grouped = useMemo(() => {
    const need = tools.filter((t) => t.status === 'outdated' || t.status === 'missing');
    const map = new Map<ToolCategory, ToolResult[]>();
    for (const t of need) {
      const cat = normalizeCat(t.category);
      const list = map.get(cat) ?? [];
      list.push(t);
      map.set(cat, list);
    }
    return map;
  }, [tools]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-white text-lg">Required installs & updates</h2>
        <p className="text-gray-400 text-sm mt-1">
          Open each link to install, then re-scan to verify.
        </p>
        <div className="mt-4 rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-3 py-2 text-yellow-200 text-sm">
          This tool does not auto-install software. Please install manually.
        </div>

        <div className="mt-6 space-y-6">
          {CATEGORY_ORDER.map((cat) => {
            const list = grouped.get(cat);
            if (!list?.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                  {categoryLabel(cat)}
                </h3>
                <ul className="space-y-3">
                  {list.map((t) => (
                    <li
                      key={t.name}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{t.display_name}</p>
                        <span
                          className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            t.status === 'missing'
                              ? 'bg-red-900/60 text-red-200'
                              : 'bg-yellow-900/60 text-yellow-200'
                          }`}
                        >
                          {t.status === 'missing' ? 'Missing' : 'Outdated'}
                        </span>
                      </div>
                      <a
                        href={t.install_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-xl border border-gray-700 py-2 text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
