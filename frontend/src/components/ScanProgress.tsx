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
  if (status === 'outdated') return '⚡';
  return '✗';
}

function statusLineColor(status: ToolResult['status']): string {
  if (status === 'ok') return '#34d399';
  if (status === 'outdated') return '#fbbf24';
  return '#f87171';
}

export const ScanProgress: React.FC<ScanProgressProps> = ({
  isVisible,
  stackName,
  toolCount,
  results,
}) => {
  const staticLines = useMemo(() => {
    const base: string[] = [
      '$ dev-health-monitor --scan --ai analyze',
      'Connecting to AI engine...',
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
        color: statusLineColor(r.status),
      })),
    [results]
  );

  const tailLine = 'Generating AI health report...';
  const maxLines = staticLines.length + resultLines.length + 1;
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!isVisible) { setVisibleCount(0); return; }
    setVisibleCount(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setVisibleCount((c) => Math.min(c + 1, maxLines));
      if (n >= maxLines) window.clearInterval(id);
    }, 130);
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
    <div
      className="terminal-glow rounded-xl font-mono text-sm p-5 min-h-48 overflow-hidden"
      style={{ fontSize: '0.8rem', lineHeight: '1.8' }}
    >
      {/* Terminal title bar */}
      <div className="flex items-center gap-2 mb-4 pb-3"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
        </div>
        <span className="text-blue-200/30 text-xs ml-2">dev-health-monitor</span>
      </div>

      {shownStatic.map((line, i) => (
        <div key={`s-${i}`} className="whitespace-pre-wrap"
          style={{ color: i === 0 ? '#00d4ff' : '#64748b' }}>
          {line}
        </div>
      ))}
      {shownResults.map((line, i) => (
        <div key={`${line.key}-${i}`} className="whitespace-pre-wrap"
          style={{ color: line.color }}>
          {line.text}
        </div>
      ))}
      {showTail && (
        <div className="whitespace-pre-wrap" style={{ color: '#a78bfa' }}>{tailLine}</div>
      )}
      {visibleCount < maxLines && (
        <div className="mt-2 flex items-center gap-1" style={{ color: '#00d4ff' }}>
          <span className="animate-pulse font-bold">▋</span>
        </div>
      )}
    </div>
  );
};
