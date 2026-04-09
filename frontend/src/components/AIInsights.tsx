import React, { useState } from 'react';
import { ChevronDown, Wrench, AlertTriangle, Clock, Lightbulb } from 'lucide-react';
import { AIAnalysis } from '../types/index';

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
    if (newExpanded.has(section)) newExpanded.delete(section);
    else newExpanded.add(section);
    setExpandedSections(newExpanded);
  };

  const handleFix = async (toolName: string, fixType: 'install' | 'path') => {
    setFixingTools(new Set([...fixingTools, `${toolName}-${fixType}`]));
    try {
      await onFixTool(toolName, fixType);
    } finally {
      setFixingTools((prev) => {
        const next = new Set(prev);
        next.delete(`${toolName}-${fixType}`);
        return next;
      });
    }
  };

  const Section = ({
    title, id, icon, children,
  }: { title: string; id: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ borderBottom: '1px solid rgba(59,130,246,0.08)' }} className="last:border-b-0">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors"
        style={{ background: expandedSections.has(id) ? 'rgba(30,64,175,0.06)' : 'transparent' }}
        data-hover
      >
        <div className="flex items-center gap-2.5">
          <span className="text-blue-400">{icon}</span>
          <span className="text-blue-100/80 font-semibold text-sm">{title}</span>
        </div>
        <ChevronDown
          size={16}
          className="text-blue-400/60 transition-transform duration-300"
          style={{ transform: expandedSections.has(id) ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      {expandedSections.has(id) && (
        <div className="px-4 py-4" style={{ background: 'rgba(5,5,16,0.4)', borderTop: '1px solid rgba(59,130,246,0.06)' }}>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold gradient-text mb-5">AI Insights</h3>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(5,5,16,0.6)', border: '1px solid rgba(59,130,246,0.12)' }}>

        {analysis.required_tools.length > 0 && (
          <Section title="Required Tools" id="required" icon={<Wrench size={14} />}>
            <div className="flex flex-wrap gap-2">
              {analysis.required_tools.map((tool) => (
                <span
                  key={tool}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd' }}
                >
                  {tool}
                </span>
              ))}
            </div>
          </Section>
        )}

        {analysis.missing_tools.length > 0 && (
          <Section title="Missing Tools" id="missing" icon={<AlertTriangle size={14} />}>
            <div className="space-y-2">
              {analysis.missing_tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(185,28,28,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
                >
                  <span className="text-red-200/80 font-medium text-sm">{tool}</span>
                  <button
                    onClick={() => handleFix(tool, 'install')}
                    disabled={fixingTools.has(`${tool}-install`)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}
                    data-hover
                  >
                    {fixingTools.has(`${tool}-install`) ? 'Installing…' : 'Install'}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {analysis.outdated_tools.length > 0 && (
          <Section title="Outdated Tools" id="outdated" icon={<Clock size={14} />}>
            <div className="space-y-2">
              {analysis.outdated_tools.map((tool) => (
                <div
                  key={tool}
                  className="flex items-center justify-between p-3 rounded-xl"
                  style={{ background: 'rgba(161,98,7,0.12)', border: '1px solid rgba(234,179,8,0.25)' }}
                >
                  <span className="text-yellow-200/80 font-medium text-sm">{tool}</span>
                  <button
                    onClick={() => handleFix(tool, 'install')}
                    disabled={fixingTools.has(`${tool}-install`)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', color: '#fde047' }}
                    data-hover
                  >
                    {fixingTools.has(`${tool}-install`) ? 'Updating…' : 'Update'}
                  </button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {analysis.recommendations.length > 0 && (
          <Section title="Recommendations" id="recommendations" icon={<Lightbulb size={14} />}>
            <ol className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <li key={idx} className="flex gap-3">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd' }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <input type="checkbox" readOnly className="mr-2" style={{ cursor: 'none', accentColor: '#3b82f6' }} />
                    <span className="text-blue-100/70 text-sm">{rec}</span>
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
