import React, { useEffect, useMemo, useState } from 'react';
import type { ToolCategory, ToolResult } from '../types';
import { getInstallCommand, type InstallCommandResponse } from '../api/client';
import { Terminal, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { formatValidUrl } from '../utils/urlFormatter';

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

const ToolDownloadRow: React.FC<{ tool: ToolResult }> = ({ tool }) => {
  const [loading, setLoading] = useState(false);
  const [installInfo, setInstallInfo] = useState<InstallCommandResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const validInstallUrl = formatValidUrl(tool.install_url);

  const handleFetchCommand = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getInstallCommand(tool.name);
      setInstallInfo(res);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch install command');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (installInfo?.command) {
      navigator.clipboard.writeText(installInfo.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{tool.display_name}</p>
          <span
            className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
              tool.status === 'missing'
                ? 'bg-red-900/60 text-red-200'
                : 'bg-yellow-900/60 text-yellow-200'
            }`}
          >
            {tool.status === 'missing' ? 'Missing' : 'Outdated'}
          </span>
        </div>
        {!installInfo && !loading && (
          <button
            onClick={handleFetchCommand}
            className="shrink-0 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium px-3 py-1.5 transition-colors flex items-center gap-1.5"
          >
            <Terminal size={14} />
            Get Command
          </button>
        )}
        {loading && (
          <div className="shrink-0 px-3 py-1.5 text-indigo-400 flex items-center gap-1.5 text-xs">
            <Loader2 size={14} className="animate-spin" />
            Generating...
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-xs text-red-400 flex items-start gap-1.5 bg-red-400/10 p-2 rounded border border-red-400/20">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {installInfo && (
        <div className="mt-1 flex flex-col gap-2">
          {installInfo.command ? (
            <div className="relative group">
              <pre className="text-xs bg-black p-2.5 rounded border border-gray-700 text-blue-300 font-mono overflow-x-auto whitespace-pre-wrap pr-10">
                {installInfo.command}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-gray-800/80 hover:bg-gray-700 text-gray-300 transition-colors"
                title="Copy command"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          ) : (
            <div className="text-xs text-yellow-400/80 italic">No automated command available.</div>
          )}
          {installInfo.notes && (
             <p className="text-[11px] text-gray-400 leading-snug break-words pr-2">{installInfo.notes}</p>
          )}
          {validInstallUrl && (
            <a
              href={validInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400 hover:underline mt-0.5 self-start"
            >
              Or download manually →
            </a>
          )}
        </div>
      )}
    </li>
  );
};

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
          Use AI to fetch the best installation command, or view alternative options.
        </p>

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
                    <ToolDownloadRow key={t.name} tool={t} />
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
