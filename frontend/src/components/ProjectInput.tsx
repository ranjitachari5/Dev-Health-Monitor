import React, { useState } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { Squares } from './Squares';
import { apiClient } from '../api/client';
import { AppState } from '../types/index';

interface ProjectInputProps {
  onNavigate: (state: Partial<AppState>) => void;
}

const EXAMPLE_CHIPS = [
  'React + Node App',
  'Python ML Project',
  'Flutter Mobile App',
  'Java Spring Boot',
  'DevOps / Kubernetes'
];

const LOADING_MESSAGES = [
  'Scanning your machine...',
  'Talking to AI advisor...',
  'Comparing versions...',
  'Building your report...'
];

export const ProjectInput: React.FC<ProjectInputProps> = ({ onNavigate }) => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      alert('Please describe your project');
      return;
    }

    setIsLoading(true);
    
    // Cycle through loading messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[messageIndex]);
    }, 1500);

    try {
      const data = await apiClient.analyzeProject(description);
      clearInterval(messageInterval);
      onNavigate({
        scanData: { ...data, tools: data.scan_results },
        aiAnalysis: data.ai_analysis,
        projectDescription: description,
        currentScreen: 'dashboard',
        isLoading: false
      });
    } catch (error) {
      clearInterval(messageInterval);
      console.error('Analysis failed:', error);
      alert('Failed to analyze. Make sure the backend is running.');
      setIsLoading(false);
    }
  };

  const handleChipClick = (chip: string) => {
    setDescription(chip);
  };

  const handleBack = () => {
    onNavigate({ currentScreen: 'landing' });
  };

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a0f] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Squares
          direction="diagonal"
          speed={0.2}
          borderColor="#1a1a2e"
          squareSize={50}
          hoverFillColor="#16213e"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 py-8 px-6">
        {/* Back button */}
        <button
          onClick={handleBack}
          disabled={isLoading}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
        >
          <ChevronLeft size={20} />
          <span>Back</span>
        </button>

        {/* Card */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-2xl p-8 sm:p-12">
            {/* Heading */}
            <h2 className="text-4xl font-bold text-white mb-2">
              Describe your project
            </h2>
            <p className="text-white/60 mb-8">
              Our AI will figure out exactly what you need installed
            </p>

            {/* Textarea */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder={`e.g. I'm building a React + Node.js web app with a PostgreSQL database, deployed to AWS using Docker...`}
              className="w-full h-32 mb-6 px-4 py-3 rounded-lg bg-[#0a0a0f] border border-white/10 text-white placeholder-white/30 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 resize-none"
            />

            {/* Example chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {EXAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isLoading}
                  className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/20 transition-all duration-300 disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Submit button or loading state */}
            {!isLoading ? (
              <button
                onClick={handleAnalyze}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all duration-300 border border-indigo-500/50 hover:border-indigo-400 shadow-lg hover:shadow-indigo-500/50"
              >
                Analyze & Scan
                <ArrowRight size={20} />
              </button>
            ) : (
              <div className="w-full px-8 py-4 rounded-lg bg-indigo-600/50 text-white font-semibold flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{loadingMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
