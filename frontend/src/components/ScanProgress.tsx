import React, { useEffect, useMemo, useState } from 'react';
import type { ToolResult } from '../types';

interface ScanProgressProps {
  isVisible: boolean;
  stackName?: string;
  toolCount?: number;
  results?: ToolResult[];
}

function statusIcon(status: ToolResult['status']): string {
  if (status === 'ok') return '✓';
  if (status === 'outdated') return '⚠';
  return '✗';
}

function statusLineClass(status: ToolResult['status']): string {
  if (status === 'ok') return 'text-green-400';
  if (status === 'outdated') return 'text-yellow-400';
  return 'text-red-400';
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  isVisible,
  stackName,
  toolCount,
  results,
}) => {
  const staticLines = useMemo(() => {
    const base: string[] = [
      '$ dev-health-monitor --scan',
      'Connecting to Grok AI (xAI)...',
      'Analyzing project stack...',
    ];
    if (stackName) base.push(`Stack identified: ${stackName}`);
    if (toolCount !== undefined) base.push(`Found ${toolCount} required dependencies`);
    base.push('Scanning local environment...');
    return base;
  }, [stackName, toolCount]);

  const resultLines = useMemo(
    () =>
      (results ?? []).map((r) => ({
        key: r.name,
        text: `  checking ${r.display_name}... ${r.installed_version ?? 'not found'} ${statusIcon(r.status)}`,
        cls: statusLineClass(r.status),
      })),
    [results]
  );

  const tailLine = 'Generating health report...';
  const maxLines = staticLines.length + resultLines.length + 1;

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setVisibleCount((c) => Math.min(c + 1, maxLines));
      if (n >= maxLines) {
        window.clearInterval(id);
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [isVisible, maxLines, staticLines.length, resultLines.length]);

  if (!isVisible) return null;

  let remaining = visibleCount;
  const shownStatic = staticLines.slice(0, Math.min(remaining, staticLines.length));
  remaining -= shownStatic.length;
  const shownResults = resultLines.slice(0, Math.min(remaining, resultLines.length));
  remaining -= shownResults.length;
  const showTail = remaining > 0;

  return (
    <div className="bg-black rounded-xl border border-gray-800 font-mono text-sm p-4 min-h-48 text-gray-300">
      {shownStatic.map((line, i) => (
        <div key={`s-${i}`} className="whitespace-pre-wrap">
          {line}
        </div>
      ))}
      {shownResults.map((line, i) => (
        <div key={`${line.key}-${i}`} className={`whitespace-pre-wrap ${line.cls}`}>
          {line.text}
        </div>
      ))}
      {showTail && <div className="whitespace-pre-wrap">{tailLine}</div>}
      {visibleCount < maxLines && (
        <div className="mt-2 flex items-center gap-1 text-indigo-400">
          <span className="animate-pulse">▋</span>
        </div>
      )}
    </div>
  );
};
