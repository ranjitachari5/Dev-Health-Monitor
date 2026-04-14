import React, { useRef } from 'react';
import type { ToolCategory, ToolResult } from '../types';

const VALID_CATEGORIES: ToolCategory[] = [
  'runtime',
  'package_manager',
  'database',
  'devtool',
  'container',
  'language',
];

function normalizeCategory(c: string): ToolCategory {
  return VALID_CATEGORIES.includes(c as ToolCategory) ? (c as ToolCategory) : 'devtool';
}

interface ToolCardProps {
  tool: ToolResult;
}

function categoryBadgeStyle(cat: ToolCategory): React.CSSProperties {
  if (cat === 'runtime' || cat === 'language') {
    return {
      background: 'linear-gradient(135deg,rgba(67,56,202,0.4),rgba(99,102,241,0.2))',
      border: '1px solid rgba(99,102,241,0.4)',
      color: '#a5b4fc',
      boxShadow: '0 0 10px rgba(99,102,241,0.2)',
    };
  }
  if (cat === 'package_manager') {
    return {
      background: 'linear-gradient(135deg,rgba(109,40,217,0.4),rgba(139,92,246,0.2))',
      border: '1px solid rgba(139,92,246,0.4)',
      color: '#c4b5fd',
      boxShadow: '0 0 10px rgba(139,92,246,0.2)',
    };
  }
  if (cat === 'database') {
    return {
      background: 'linear-gradient(135deg,rgba(7,89,133,0.4),rgba(14,165,233,0.2))',
      border: '1px solid rgba(14,165,233,0.4)',
      color: '#7dd3fc',
      boxShadow: '0 0 10px rgba(14,165,233,0.2)',
    };
  }
  if (cat === 'container') {
    return {
      background: 'linear-gradient(135deg,rgba(5,96,96,0.4),rgba(20,184,166,0.2))',
      border: '1px solid rgba(20,184,166,0.4)',
      color: '#5eead4',
      boxShadow: '0 0 10px rgba(20,184,166,0.2)',
    };
  }
  return {
    background: 'linear-gradient(135deg,rgba(30,64,175,0.3),rgba(59,130,246,0.1))',
    border: '1px solid rgba(59,130,246,0.3)',
    color: '#93c5fd',
    boxShadow: '0 0 10px rgba(59,130,246,0.15)',
  };
}

function statusConfig(status: ToolResult['status']) {
  if (status === 'ok') return {
    dot: '#10b981',
    glow: 'rgba(16,185,129,0.4)',
    label: 'Installed',
    border: 'rgba(16,185,129,0.3)',
    bg: 'rgba(5,150,105,0.08)',
  };
  if (status === 'outdated') return {
    dot: '#eab308',
    glow: 'rgba(234,179,8,0.4)',
    label: 'Outdated',
    border: 'rgba(234,179,8,0.3)',
    bg: 'rgba(161,98,7,0.08)',
  };
  return {
    dot: '#ef4444',
    glow: 'rgba(239,68,68,0.4)',
    label: 'Missing',
    border: 'rgba(239,68,68,0.3)',
    bg: 'rgba(185,28,28,0.08)',
  };
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const { status } = tool;
  const category = normalizeCategory(tool.category);
  const cfg = statusConfig(status);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    card.style.boxShadow = `
      ${x * -8}px ${y * -8}px 30px rgba(0,0,0,0.4),
      0 0 30px ${cfg.glow},
      inset 0 1px 0 rgba(255,255,255,0.05)
    `;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(600px) rotateY(0deg) rotateX(0deg) scale(1)';
    card.style.boxShadow = '';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="tool-card-3d rounded-xl p-4 flex flex-col gap-2"
      style={{
        background: `linear-gradient(135deg, rgba(8,8,32,0.9) 0%, ${cfg.bg} 100%)`,
        border: `1px solid ${cfg.border}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      data-hover
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white text-sm">{tool.display_name}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
          style={categoryBadgeStyle(category)}
        >
          {category.replace('_', ' ')}
        </span>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-x-2 text-sm">
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ background: cfg.dot, boxShadow: `0 0 8px ${cfg.glow}` }}
        />
        <span className="text-blue-100/70 text-xs">{cfg.label}</span>
        {status === 'ok' && tool.installed_version && (
          <span className="font-mono text-emerald-400 text-xs">v{tool.installed_version}</span>
        )}
        {status === 'outdated' && (
          <span className="font-mono text-yellow-400 text-xs">
            v{tool.installed_version ?? '?'} → v{tool.min_version ?? '?'}
          </span>
        )}
        {status === 'missing' && (
          <span className="font-mono text-red-400 text-xs">Required</span>
        )}
      </div>

      {/* Why needed */}
      {tool.why_needed ? (
        <p className="text-xs text-blue-200/40 italic leading-snug">{tool.why_needed}</p>
      ) : null}

      {/* Install link */}
      {(status === 'outdated' || status === 'missing') && tool.install_url ? (
        <a
          href={tool.install_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors underline-offset-2 hover:underline"
          data-hover
        >
          {status === 'missing' ? 'Install →' : 'Update →'}
        </a>
      ) : null}
    </div>
  );
};
