import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { AIAnalysis } from '../types/index';
import { apiClient } from '../api/client';

interface AIInsightsProps {
  analysis: AIAnalysis;
  onFixTool: (toolName: string, fixType: 'install' | 'path') => Promise<void>;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ analysis, onFixTool }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['recommendations'])
  );
  const [fixingTools, setFixingTools] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleFix = async (toolName: string, fixType: 'install' | 'path') => {
    setFixingTools(new Set([...fixingTools, `${toolName}-${fixType}`]));
    try {
      await onFixTool(toolName, fixType);
    } finally {
      setFixingTools(prev => {
        const next = new Set(prev);
        next.delete(`${toolName}-${fixType}`);
        return next;
      });
    }
  };

  const Section = ({
    title,
    id,
    children
  }: {
    title: string;
    id: string;
    children: React.ReactNode;
  }) => (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <span className="text-white/80 font-medium">{title}</span>
        <ChevronDown
          size={20}
          className={`text-white/60 transition-transform duration-300 ${
            expandedSections.has(id) ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expandedSections.has(id) && (
        <div className="px-4 py-3 bg-black/20 border-t border-white/10">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white mb-4">AI Insights</h3>

      <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {/* What you need */}
        {analysis.required_tools.length > 0 && (
          <Section title="What you need" id="required">
            <div className="flex flex-wrap gap-2">
              {analysis.required_tools.map((tool) => (
                <span
                  key={tool}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/50"
                >
                  {tool}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Missing Tools */}
        {analysis.missing_tools.length > 0 && (
          <Section title="Missing Tools" id="missing">
            <div className="space-y-2">
              {analysis.missing_tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between p-2 rounded bg-red-500/10 border border-red-500/30"
                >
                  <span className="text-white/80 font-medium">{tool}</span>
                  <button
                    onClick={() => handleFix(tool, 'install')}
                    disabled={fixingTools.has(`${tool}-install`)}
                    className="px-3 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
                  >
                    {fixingTools.has(`${tool}-install`) ? 'Installing...' : 'Install'}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Outdated Tools */}
        {analysis.outdated_tools.length > 0 && (
          <Section title="Outdated Tools" id="outdated">
            <div className="space-y-2">
              {analysis.outdated_tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between p-2 rounded bg-yellow-500/10 border border-yellow-500/30"
                >
                  <span className="text-white/80 font-medium">{tool}</span>
                  <button
                    onClick={() => handleFix(tool, 'install')}
                    disabled={fixingTools.has(`${tool}-install`)}
                    className="px-3 py-1 rounded text-xs font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors disabled:opacity-50"
                  >
                    {fixingTools.has(`${tool}-install`) ? 'Updating...' : 'Update'}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recommendations */}
        {analysis.recommendations.length > 0 && (
          <Section title="Recommendations" id="recommendations">
            <ol className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-xs font-bold text-indigo-300">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <input
                      type="checkbox"
                      readOnly
                      className="mr-2 cursor-pointer"
                    />
                    <span className="text-white/80">{rec}</span>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    </div>
  );
};
