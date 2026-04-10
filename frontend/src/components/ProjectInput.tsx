import React, { useCallback, useMemo, useState } from 'react';
import { StackChips } from './StackChips';
import { analyzeGithub } from '../api/client';
import type { GithubAnalysis, InputMode, ProjectTemplate } from '../types';
import { MessageSquare, Folder, Github, LayoutGrid, Zap } from 'lucide-react';

const FRONTEND_CHIPS = ['React','Next.js','Vue','Angular','Svelte','Astro','Vite','Webpack'];
const BACKEND_CHIPS = ['Node.js','FastAPI','Django','Flask','Express','Spring Boot','Laravel','Rails'];
const DATABASE_CHIPS = ['PostgreSQL','MySQL','MongoDB','Redis','SQLite','Supabase','Firebase','Prisma'];

const TEMPLATES: ProjectTemplate[] = [
  { name: 'MERN Stack', icon: '🌿', tools: ['MongoDB','Express','React','Node.js'], description: 'MongoDB, Express, React, Node.js' },
  { name: 'Next.js + Supabase', icon: '▲', tools: ['Node.js','npm','Next.js','PostgreSQL'], description: 'Next.js with Supabase & Postgres' },
  { name: 'Django + React', icon: '🐍', tools: ['Python','pip','Django','Node.js','npm'], description: 'Django API + React frontend' },
  { name: 'FastAPI + PostgreSQL', icon: '⚡', tools: ['Python','pip','FastAPI','PostgreSQL','uvicorn'], description: 'FastAPI backend with Postgres' },
  { name: 'Vue + Firebase', icon: '💚', tools: ['Node.js','npm','Vue'], description: 'Vue SPA with Firebase' },
  { name: 'Spring Boot + MySQL', icon: '☕', tools: ['Java','Maven','MySQL'], description: 'Java Spring Boot & MySQL' },
  { name: 'Flutter + Firebase', icon: '📱', tools: ['Flutter','Dart'], description: 'Flutter mobile with Firebase' },
  { name: 'Go + Redis', icon: '🐹', tools: ['Go','Redis'], description: 'Go services with Redis' },
];

interface ProjectInputProps {
  onScanStart: (req: { user_input: string; detected_tools: string[] }) => void;
}

function dedupe(list: string[]): string[] { return [...new Set(list)]; }

function detectFromFolderPaths(paths: string[]): string[] {
  const basenames = new Set(paths.map((p) => p.split(/[/\\]/).pop() || p));
  const detected: string[] = [];
  if (basenames.has('package.json')) detected.push('Node.js', 'npm');
  if (basenames.has('yarn.lock')) { const i = detected.indexOf('npm'); if (i >= 0) detected.splice(i, 1); detected.push('Yarn'); }
  if (basenames.has('pnpm-lock.yaml')) detected.push('pnpm');
  if (basenames.has('requirements.txt')) detected.push('Python', 'pip');
  if (basenames.has('go.mod')) detected.push('Go');
  if (basenames.has('pom.xml')) detected.push('Java', 'Maven');
  if (basenames.has('Dockerfile')) detected.push('Docker');
  if (basenames.has('docker-compose.yml') || basenames.has('docker-compose.yaml')) detected.push('Docker Compose');
  if (basenames.has('Cargo.toml')) detected.push('Rust', 'Cargo');
  if (basenames.has('pubspec.yaml')) detected.push('Flutter', 'Dart');
  return dedupe(detected);
}

const MODE_ICONS: Record<InputMode, React.ReactNode> = {
  chat: <MessageSquare size={14} />,
  folder: <Folder size={14} />,
  github: <Github size={14} />,
  template: <LayoutGrid size={14} />,
};

export const ProjectInput: React.FC<ProjectInputProps> = ({ onScanStart }) => {
  const [activeMode, setActiveMode] = useState<InputMode>('chat');
  const [chatText, setChatText] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [folderFiles, setFolderFiles] = useState<string[]>([]);
  const [detectedFromFolder, setDetectedFromFolder] = useState<string[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [githubAnalysis, setGithubAnalysis] = useState<GithubAnalysis | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);

  const folderLabel = useMemo(() => {
    if (folderFiles.length === 0) return '';
    const first = folderFiles[0];
    const parts = first.split(/[/\\]/);
    return parts.length > 1 ? parts[0] : 'Selected folder';
  }, [folderFiles]);

  const toggleChip = useCallback((chip: string) => {
    setSelectedChips((prev) => {
      const on = prev.includes(chip);
      if (on) {
        setChatText((ct) => {
          const escaped = chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const next = ct.replace(new RegExp(`\\b${escaped}\\b`, 'g'), ' ');
          return next.replace(/\s+/g, ' ').trim();
        });
        return prev.filter((c) => c !== chip);
      }
      setChatText((ct) => (ct.trim() ? `${ct.trim()} ${chip}` : chip));
      return [...prev, chip];
    });
  }, []);

  const runGithubAnalyze = useCallback(async () => {
    const url = githubUrl.trim();
    if (!url) { setGithubAnalysis(null); setGithubError(null); return; }
    setGithubLoading(true); setGithubError(null); setGithubAnalysis(null);
    try {
      const data = await analyzeGithub(url);
      setGithubAnalysis(data);
    } catch (e) {
      setGithubError(e instanceof Error ? e.message : 'GitHub analysis failed');
    } finally { setGithubLoading(false); }
  }, [githubUrl]);

  const onFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) { setFolderFiles([]); setDetectedFromFolder([]); return; }
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i] as File & { webkitRelativePath?: string };
      paths.push(f.webkitRelativePath || f.name);
    }
    setFolderFiles(paths);
    setDetectedFromFolder(detectFromFolderPaths(paths));
  };

  const handleScanClick = () => {
    if (activeMode === 'chat') { if (!chatText.trim()) return; onScanStart({ user_input: chatText.trim(), detected_tools: selectedChips }); return; }
    if (activeMode === 'folder') { onScanStart({ user_input: folderLabel || 'Local project folder', detected_tools: detectedFromFolder }); return; }
    if (activeMode === 'github') { onScanStart({ user_input: githubUrl.trim() || 'GitHub repository', detected_tools: githubAnalysis?.detected_tools ?? [] }); return; }
    if (activeMode === 'template') { if (!selectedTemplate) return; onScanStart({ user_input: selectedTemplate.name, detected_tools: selectedTemplate.tools }); }
  };

  const modes: { id: InputMode; label: string }[] = [
    { id: 'chat', label: 'Describe Project' },
    { id: 'folder', label: 'Local Folder' },
    { id: 'github', label: 'GitHub Repo' },
    { id: 'template', label: 'Templates' },
  ];

  return (
    <div className="min-h-full flex flex-col text-white">
      <div className="max-w-3xl mx-auto relative z-10 w-full">
        {/* Header */}
        <div className="mb-10 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            <span className="gradient-text">Dev Health Monitor</span>
          </h1>
          <p className="text-blue-200/50 text-sm">Tell us about your project to get a tailored health report</p>
        </div>

        {/* Mode tabs */}
        <div
          className="flex flex-wrap gap-1.5 rounded-2xl p-1.5 mb-8 animate-fade-in-up"
          style={{
            background: 'rgba(5,5,20,0.8)',
            border: '1px solid rgba(59,130,246,0.15)',
            backdropFilter: 'blur(16px)',
            animationDelay: '100ms',
          }}
        >
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMode(m.id)}
              className="flex-1 min-w-[110px] rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
              style={activeMode === m.id ? {
                background: 'linear-gradient(135deg,#1e40af,#2563eb)',
                color: '#fff',
                boxShadow: '0 0 20px rgba(59,130,246,0.35)',
              } : {
                color: 'rgba(148,163,184,0.7)',
              }}
              data-hover
            >
              {MODE_ICONS[m.id]}
              {m.label}
            </button>
          ))}
        </div>

        {/* Mode content */}
        <div className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          {activeMode === 'chat' && (
            <div className="space-y-4">
              <textarea
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Describe your project... e.g. 'A Next.js app with Prisma, PostgreSQL and Redis'"
                className="input-neon w-full min-h-36 rounded-2xl px-5 py-4 text-sm resize-y focus:outline-none"
                style={{ minHeight: '9rem' }}
              />
              <div
                className="max-h-52 overflow-y-auto rounded-2xl p-4"
                style={{
                  background: 'rgba(5,5,20,0.7)',
                  border: '1px solid rgba(59,130,246,0.12)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <StackChips label="Frontend" options={FRONTEND_CHIPS} selected={selectedChips} onToggle={toggleChip} />
                <StackChips label="Backend" options={BACKEND_CHIPS} selected={selectedChips} onToggle={toggleChip} />
                <StackChips label="Database" options={DATABASE_CHIPS} selected={selectedChips} onToggle={toggleChip} />
              </div>
            </div>
          )}

          {activeMode === 'folder' && (
            <div className="space-y-4">
              <input
                type="file"
                id="folderPicker"
                className="hidden"
                multiple
                {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
                onChange={onFolderChange}
              />
              <label
                htmlFor="folderPicker"
                className="btn-neon inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
                style={{ cursor: 'none' }}
                data-hover
              >
                <Folder size={16} /> Choose project folder…
              </label>
              {folderFiles.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-white font-semibold mb-1">{folderLabel}</p>
                  <p className="text-blue-200/50 text-xs mb-4">{folderFiles.length} files</p>
                  <p className="text-blue-200/40 text-xs uppercase tracking-wider mb-3">Detected stack</p>
                  <div className="flex flex-wrap gap-2">
                    {detectedFromFolder.map((t) => (
                      <span key={t} className="rounded-full text-xs px-3 py-1"
                        style={{ background: 'rgba(37,99,235,0.2)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMode === 'github' && (
            <div className="space-y-4">
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onBlur={() => void runGithubAnalyze()}
                onKeyDown={(e) => { if (e.key === 'Enter') void runGithubAnalyze(); }}
                placeholder="https://github.com/owner/repo"
                className="input-neon w-full rounded-2xl px-5 py-4 text-sm"
              />
              {githubLoading && (
                <div className="flex items-center gap-3 text-blue-300 text-sm">
                  <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                  Analyzing repository…
                </div>
              )}
              {githubError && <p className="text-sm text-red-400">{githubError}</p>}
              {githubAnalysis && !githubLoading && (
                <div className="glass-card rounded-2xl p-5">
                  <p className="text-blue-200/40 text-xs uppercase tracking-wider mb-2">Stack hint</p>
                  <p className="text-sm text-blue-100/80 mb-4">{githubAnalysis.stack_hint}</p>
                  <div className="flex flex-wrap gap-2">
                    {githubAnalysis.detected_tools.map((t) => (
                      <span key={t} className="rounded-full text-xs px-3 py-1"
                        style={{ background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(59,130,246,0.35)', color: '#93c5fd' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMode === 'template' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TEMPLATES.map((tpl) => {
                const isSelected = selectedTemplate?.name === tpl.name;
                return (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => setSelectedTemplate(tpl)}
                    className="text-left rounded-2xl p-4 transition-all duration-300 tilt-card"
                    style={isSelected ? {
                      background: 'linear-gradient(135deg,rgba(30,64,175,0.5),rgba(124,58,237,0.3))',
                      border: '1px solid rgba(96,165,250,0.5)',
                      boxShadow: '0 0 25px rgba(59,130,246,0.25)',
                    } : {
                      background: 'rgba(8,8,32,0.6)',
                      border: '1px solid rgba(59,130,246,0.1)',
                    }}
                    data-hover
                  >
                    <div className="text-2xl mb-2">{tpl.icon}</div>
                    <div className="font-semibold text-white text-sm">{tpl.name}</div>
                    <p className="text-[10px] text-blue-200/40 mt-2 leading-snug">{tpl.description}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Scan button */}
        <button
          type="button"
          onClick={handleScanClick}
          className="btn-neon mt-8 w-full rounded-2xl py-4 text-white font-bold text-base flex items-center justify-center gap-3 animate-glow-pulse"
          style={{ animationDelay: '200ms' }}
          data-hover
        >
          <Zap size={18} />
          Scan my environment
        </button>
      </div>
    </div>
  );
};
