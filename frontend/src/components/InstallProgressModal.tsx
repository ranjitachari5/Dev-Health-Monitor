import React, { useEffect, useRef, useState } from 'react';
import { X, Terminal } from 'lucide-react';

interface InstallProgressModalProps {
  isOpen: boolean;
  toolName: string;
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export const InstallProgressModal: React.FC<InstallProgressModalProps> = ({
  isOpen,
  toolName,
  onClose,
  onComplete,
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'running' | 'success' | 'error'>('running');
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll as logs come in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!isOpen || !toolName) return;

    setLogs([`$ Starting installation for ${toolName}...`]);
    setStatus('running');

    // Make sure we connect to the correct backend host
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const es = new EventSource(`${baseUrl}/api/fix-stream/${encodeURIComponent(toolName)}?fix_type=install`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = event.data;
      if (data.startsWith('__DONE__:')) {
        const exitCode = parseInt(data.split(':')[1], 10);
        setStatus(exitCode === 0 ? 'success' : 'error');
        es.close();
        onComplete(exitCode === 0);
      } else {
        setLogs((prev) => [...prev, data]);
      }
    };

    es.onerror = (err) => {
      console.error('SSE Error:', err);
      // Wait a moment to see if it was a real done event that just caused a drop
      setTimeout(() => {
        if (eventSourceRef.current?.readyState !== EventSource.CLOSED) {
          setLogs((prev) => [...prev, '! Connection to install stream lost.']);
          setStatus('error');
          es.close();
          onComplete(false);
        }
      }, 500);
    };

    return () => {
      es.close();
    };
  }, [isOpen, toolName, onComplete]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => {
        // Prevent closing during run by clicking outside
        if (e.target === e.currentTarget && status !== 'running') onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(8,8,20,0.95), rgba(5,5,12,0.98))',
          border: '1px solid rgba(59,130,246,0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                status === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}
            >
              <Terminal size={18} />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">Installing {toolName}</h2>
              <p className="text-blue-300/50 text-xs">
                {status === 'running' ? 'Running installation scripts...' :
                 status === 'success' ? 'Installation complete.' : 'Installation failed.'}
              </p>
            </div>
          </div>
          {status !== 'running' && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-blue-300/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Terminal Window */}
        <div
          ref={scrollRef}
          className="w-full h-80 rounded-xl p-4 font-mono text-sm overflow-y-auto whitespace-pre-wrap select-text"
          style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px outset rgba(255,255,255,0.05)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)',
            color: '#a5b4fc', // indigo-300
          }}
        >
          {logs.map((L, i) => (
            <div key={i} className={`min-h-[1.5rem] leading-relaxed ${
              L.includes('ERROR:') || L.includes('failed') || L.includes('✗') ? 'text-red-400' :
              L.includes('SUCCESS:') || L.includes('✓') ? 'text-emerald-400' :
              L.startsWith('$ ') ? 'text-blue-300' : ''
            }`}>
              {L}
            </div>
          ))}
          {status === 'running' && (
            <div className="animate-pulse font-bold mt-1 inline-block">_</div>
          )}
        </div>

        {/* Action Bar */}
        {status !== 'running' && (
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
              }`}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
