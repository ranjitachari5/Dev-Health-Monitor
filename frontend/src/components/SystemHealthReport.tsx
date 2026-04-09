import React from 'react';
import type { ScanResponse } from '../types';
import { ScoreRing } from './ScoreRing';
import { AIInsights } from './AIInsights';

interface SystemHealthReportProps {
  scanData: ScanResponse;
}

export const SystemHealthReport: React.FC<SystemHealthReportProps> = ({ scanData }) => {
  const score = scanData.overall_score ?? 100;
  const analysis = scanData.ai_analysis;

  return (
    <div className="mt-8 pt-8 border-t border-gray-800/80">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Grok AI Health Report
        </h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score Panel */}
        <div className="col-span-1 bg-gradient-to-b from-gray-900/60 to-gray-950 border border-gray-800/60 rounded-2xl p-6 flex flex-col items-center backdrop-blur-sm shadow-xl">
          <ScoreRing score={score} />
          {analysis && analysis.health_summary && (
            <div className="mt-8 w-full p-4 bg-black/40 rounded-xl border border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Executive Summary
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                {analysis.health_summary}
              </p>
            </div>
          )}
        </div>

        {/* AI Insights Panel */}
        <div className="col-span-1 lg:col-span-2">
          {analysis ? (
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-full">
              <AIInsights 
                analysis={analysis} 
                onFixTool={async (toolName, fixType) => {
                  window.open(`https://google.com/search?q=install+${toolName}`, '_blank');
                }} 
              />
            </div>
          ) : (
            <div className="bg-gray-900/40 border border-gray-800/60 rounded-2xl p-6 h-full flex flex-col items-center justify-center backdrop-blur-sm shadow-xl">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4" />
              <p className="text-gray-400 font-medium">Generating Grok AI Insights...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
