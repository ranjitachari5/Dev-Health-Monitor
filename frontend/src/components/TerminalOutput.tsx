import React, { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface TerminalOutputProps {
  content: string;
  shell?: 'powershell' | 'bash';
}

export const TerminalOutput: React.FC<TerminalOutputProps> = ({
  content,
  shell = 'powershell'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedText(content.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 5);

    return () => clearInterval(interval);
  }, [content]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg overflow-hidden border border-white/10 backdrop-blur-sm bg-[#0a0a0f]">
      {/* Window header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-white/60 text-sm font-medium ml-3">
            {shell === 'powershell' ? 'PowerShell' : 'bash'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          title="Copy to clipboard"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>

      {/* Terminal body */}
      <div className="p-4 font-mono text-sm text-emerald-400 bg-[#0a0a0f] min-h-40 max-h-96 overflow-y-auto whitespace-pre-wrap break-words">
        {displayedText}
        {displayedText.length < content.length && (
          <span className="animate-pulse">▌</span>
        )}
      </div>
    </div>
  );
};
