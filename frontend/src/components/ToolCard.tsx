import React, { useState } from 'react';
import {
  Code2,
  Braces,
  GitBranch,
  Box,
  Package,
  Database,
  Cloud,
  Terminal,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { ToolHealth } from '../types/index';
import { TerminalOutput } from './TerminalOutput';

interface ToolCardProps {
  tool: ToolHealth;
  onFix: (toolName: string, fixType: 'install' | 'path') => Promise<void>;
}

const getToolIcon = (toolName: string) => {
  const name = toolName.toLowerCase();
  if (name.includes('python')) return Code2;
  if (name.includes('node')) return Braces;
  if (name.includes('git')) return GitBranch;
  if (name.includes('docker')) return Box;
  if (name.includes('npm') || name.includes('yarn')) return Package;
  if (name.includes('sql') || name.includes('db') || name.includes('postgres')) return Database;
  if (name.includes('aws') || name.includes('cloud')) return Cloud;
  return Terminal;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Healthy':
      return {
        border: 'border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-emerald-500/20',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        icon: 'text-emerald-400'
      };
    case 'Warning':
      return {
        border: 'border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-yellow-500/20',
        badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        icon: 'text-yellow-400'
      };
    case 'Critical':
      return {
        border: 'border-red-500/30 hover:border-red-500/60 hover:shadow-red-500/20',
        badge: 'bg-red-500/20 text-red-300 border-red-500/50',
        icon: 'text-red-400'
      };
    default:
      return {
        border: 'border-white/10 hover:border-white/20',
        badge: 'bg-white/10 text-white/60 border-white/20',
        icon: 'text-white/60'
      };
  }
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onFix }) => {
  const [isFixing, setIsFixing] = useState<string | null>(null);
  const [fixOutput, setFixOutput] = useState<string>('');
  const [expandedOutput, setExpandedOutput] = useState(false);
  const [error, setError] = useState<string>('');

  const IconComponent = getToolIcon(tool.tool_name);
  const colors = getStatusColor(tool.status);

  const handleFix = async (fixType: 'install' | 'path') => {
    setIsFixing(fixType);
    setError('');
    setFixOutput('');
    try {
      await onFix(tool.tool_name, fixType);
      setFixOutput(`Successfully fixed ${tool.tool_name} with ${fixType} option`);
      setExpandedOutput(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setFixOutput(errorMsg);
      setExpandedOutput(true);
    } finally {
      setIsFixing(null);
    }
  };

  return (
    <div
      className={`rounded-xl border ${colors.border} bg-[#0f0f1a] backdrop-blur-sm overflow-hidden hover:shadow-lg transition-all duration-300`}
    >
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <IconComponent className={`w-6 h-6 ${colors.icon}`} />
            <h3 className="text-lg font-semibold text-white">{tool.tool_name}</h3>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge}`}>
            {tool.status}
          </span>
        </div>

        {/* Version Info */}
        <div className="font-mono text-xs text-white/60 space-y-1">
          {tool.is_installed ? (
            <>
              <div>Current: {tool.current_version || 'unknown'}</div>
              {tool.required_version && tool.current_version !== tool.required_version && (
                <div className="text-yellow-400">
                  Required: {tool.required_version}
                </div>
              )}
            </>
          ) : (
            <div className="text-red-400 font-semibold">Not Installed</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-2">
        {tool.status === 'Critical' && tool.is_installed && (
          <button
            onClick={() => handleFix('path')}
            disabled={isFixing !== null}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30 transition-colors disabled:opacity-50"
          >
            {isFixing === 'path' ? 'Fixing...' : 'Fix PATH'}
          </button>
        )}
        {!tool.is_installed && (
          <button
            onClick={() => handleFix('install')}
            disabled={isFixing !== null}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-500/50 transition-colors disabled:opacity-50"
          >
            {isFixing === 'install' ? 'Installing...' : 'Install'}
          </button>
        )}
        {tool.status === 'Warning' && (
          <button
            onClick={() => handleFix('install')}
            disabled={isFixing !== null}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-300 border border-yellow-500/30 transition-colors disabled:opacity-50"
          >
            {isFixing === 'install' ? 'Updating...' : 'Update'}
          </button>
        )}
      </div>

      {/* Divider */}
      {(fixOutput || error) && <div className="border-t border-white/10" />}

      {/* Terminal Output */}
      {expandedOutput && fixOutput && (
        <div className="p-4">
          <button
            onClick={() => setExpandedOutput(false)}
            className="w-full flex items-center justify-between mb-3 text-white/60 hover:text-white transition-colors"
          >
            <span className="text-xs font-medium">Terminal Output</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                expandedOutput ? 'rotate-180' : ''
              }`}
            />
          </button>
          {error ? (
            <div className="flex gap-2 p-3 rounded bg-red-500/10 border border-red-500/30">
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : (
            <TerminalOutput content={fixOutput} shell="powershell" />
          )}
        </div>
      )}
    </div>
  );
};
