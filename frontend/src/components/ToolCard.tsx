import React from 'react';
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

function categoryBadgeClass(cat: ToolCategory): string {
  if (cat === 'runtime' || cat === 'language') {
    return 'bg-indigo-900 text-indigo-300';
  }
  if (cat === 'package_manager') {
    return 'bg-purple-900 text-purple-300';
  }
  if (cat === 'database') {
    return 'bg-blue-900 text-blue-300';
  }
  return 'bg-gray-800 text-gray-400';
}

function borderClass(status: ToolResult['status']): string {
  if (status === 'ok') return 'border-green-800';
  if (status === 'outdated') return 'border-yellow-700';
  return 'border-red-800';
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const { status } = tool;
  const category = normalizeCategory(tool.category);

  return (
    <div
      className={`rounded-xl bg-gray-900 border p-4 flex flex-col gap-2 ${borderClass(status)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-white">{tool.display_name}</h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${categoryBadgeClass(category)}`}
        >
          {category.replace('_', ' ')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 text-sm">
        {status === 'ok' && (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-1" />
            <span className="text-gray-300">Installed</span>
            {tool.installed_version && (
              <span className="font-mono text-green-400">v{tool.installed_version}</span>
            )}
          </>
        )}
        {status === 'outdated' && (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1" />
            <span className="text-gray-300">Outdated</span>
            <span className="font-mono text-yellow-400">
              v{tool.installed_version ?? '?'} → needs v{tool.min_version ?? '?'}
            </span>
          </>
        )}
        {status === 'missing' && (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1" />
            <span className="text-gray-300">Not installed</span>
            <span className="font-mono text-red-400">Required</span>
          </>
        )}
      </div>

      {tool.why_needed ? (
        <p className="text-xs text-gray-500 italic">{tool.why_needed}</p>
      ) : null}

      {(status === 'outdated' || status === 'missing') && tool.install_url ? (
        <a
          href={tool.install_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 text-sm underline mt-1"
        >
          Install / Update →
        </a>
      ) : null}
    </div>
  );
};
