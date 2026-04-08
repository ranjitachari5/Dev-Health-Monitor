import React, { useCallback, useMemo, useState } from 'react';
import { StackChips } from './StackChips';
import { analyzeGithub } from '../api/client';
import type { GithubAnalysis, InputMode, ProjectTemplate } from '../types';

const FRONTEND_CHIPS = [
  'React',
  'Next.js',
  'Vue',
  'Angular',
  'Svelte',
  'Astro',
  'Vite',
  'Webpack',
];
const BACKEND_CHIPS = [
  'Node.js',
  'FastAPI',
  'Django',
  'Flask',
  'Express',
  'Spring Boot',
  'Laravel',
  'Rails',
];
const DATABASE_CHIPS = [
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'SQLite',
  'Supabase',
  'Firebase',
  'Prisma',
];

const TEMPLATES: ProjectTemplate[] = [
  {
    name: 'MERN Stack',
    icon: '🌿',
    tools: ['MongoDB', 'Express', 'React', 'Node.js'],
    description: 'MongoDB, Express, React, Node.js',
  },
  {
    name: 'Next.js + Supabase',
    icon: '▲',
    tools: ['Node.js', 'npm', 'Next.js', 'PostgreSQL'],
    description: 'Next.js with Supabase & Postgres',
  },
  {
    name: 'Django + React',
    icon: '🐍',
    tools: ['Python', 'pip', 'Django', 'Node.js', 'npm'],
    description: 'Django API + React frontend',
  },
  {
    name: 'FastAPI + PostgreSQL',
    icon: '⚡',
    tools: ['Python', 'pip', 'FastAPI', 'PostgreSQL', 'uvicorn'],
    description: 'FastAPI backend with Postgres',
  },
  {
    name: 'Vue + Firebase',
    icon: '💚',
    tools: ['Node.js', 'npm', 'Vue'],
    description: 'Vue SPA with Firebase',
  },
  {
    name: 'Spring Boot + MySQL',
    icon: '☕',
    tools: ['Java', 'Maven', 'MySQL'],
    description: 'Java Spring Boot & MySQL',
  },
  {
    name: 'Flutter + Firebase',
    icon: '📱',
    tools: ['Flutter', 'Dart'],
    description: 'Flutter mobile with Firebase',
  },
  {
    name: 'Go + Redis',
    icon: '🐹',
    tools: ['Go', 'Redis'],
    description: 'Go services with Redis',
  },
];

interface ProjectInputProps {
  onScanStart: (req: { user_input: string; detected_tools: string[] }) => void;
}

function dedupe(list: string[]): string[] {
  return [...new Set(list)];
}

function detectFromFolderPaths(paths: string[]): string[] {
  const basenames = new Set(paths.map((p) => p.split(/[/\\]/).pop() || p));
  const detected: string[] = [];

  if (basenames.has('package.json')) {
    detected.push('Node.js', 'npm');
  }
  if (basenames.has('yarn.lock')) {
    const i = detected.indexOf('npm');
    if (i >= 0) detected.splice(i, 1);
    detected.push('Yarn');
  }
  if (basenames.has('pnpm-lock.yaml')) {
    detected.push('pnpm');
  }
  if (basenames.has('requirements.txt')) {
    detected.push('Python', 'pip');
  }
  if (basenames.has('go.mod')) {
    detected.push('Go');
  }
  if (basenames.has('pom.xml')) {
    detected.push('Java', 'Maven');
  }
  if (basenames.has('Dockerfile')) {
    detected.push('Docker');
  }
  if (basenames.has('docker-compose.yml') || basenames.has('docker-compose.yaml')) {
    detected.push('Docker Compose');
  }
  if (basenames.has('Cargo.toml')) {
    detected.push('Rust', 'Cargo');
  }
  if (basenames.has('pubspec.yaml')) {
    detected.push('Flutter', 'Dart');
  }

  return dedupe(detected);
}

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
    if (!url) {
      setGithubAnalysis(null);
      setGithubError(null);
      return;
    }
    setGithubLoading(true);
    setGithubError(null);
    setGithubAnalysis(null);
    try {
      const data = await analyzeGithub(url);
      setGithubAnalysis(data);
    } catch (e) {
      setGithubError(e instanceof Error ? e.message : 'GitHub analysis failed');
    } finally {
      setGithubLoading(false);
    }
  }, [githubUrl]);

  const onFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      setFolderFiles([]);
      setDetectedFromFolder([]);
      return;
    }
    const paths: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i] as File & { webkitRelativePath?: string };
      paths.push(f.webkitRelativePath || f.name);
    }
    setFolderFiles(paths);
    setDetectedFromFolder(detectFromFolderPaths(paths));
  };

  const handleScanClick = () => {
    if (activeMode === 'chat') {
      if (!chatText.trim()) return;
      onScanStart({ user_input: chatText.trim(), detected_tools: selectedChips });
      return;
    }
    if (activeMode === 'folder') {
      onScanStart({
        user_input: folderLabel || 'Local project folder',
        detected_tools: detectedFromFolder,
      });
      return;
    }
    if (activeMode === 'github') {
      onScanStart({
        user_input: githubUrl.trim() || 'GitHub repository',
        detected_tools: githubAnalysis?.detected_tools ?? [],
      });
      return;
    }
    if (activeMode === 'template') {
      if (!selectedTemplate) return;
      onScanStart({
        user_input: selectedTemplate.name,
        detected_tools: selectedTemplate.tools,
      });
    }
  };

  const modes: { id: InputMode; label: string }[] = [
    { id: 'chat', label: 'Describe Project' },
    { id: 'folder', label: 'Local Folder' },
    { id: 'github', label: 'GitHub Repo' },
    { id: 'template', label: 'Templates' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Dev Health Monitor</h1>

        <div className="flex flex-wrap gap-2 rounded-full bg-gray-900 p-1 border border-gray-800 mb-8">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMode(m.id)}
              className={`flex-1 min-w-[120px] rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeMode === m.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {activeMode === 'chat' && (
          <div className="space-y-4">
            <textarea
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Describe your project... e.g. 'A Next.js app with Prisma, PostgreSQL and Redis'"
              className="w-full min-h-32 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600 resize-y"
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/50 p-3">
              <StackChips
                label="Frontend"
                options={FRONTEND_CHIPS}
                selected={selectedChips}
                onToggle={toggleChip}
              />
              <StackChips
                label="Backend"
                options={BACKEND_CHIPS}
                selected={selectedChips}
                onToggle={toggleChip}
              />
              <StackChips
                label="Database"
                options={DATABASE_CHIPS}
                selected={selectedChips}
                onToggle={toggleChip}
              />
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
              className="inline-flex cursor-pointer rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800"
            >
              Choose project folder…
            </label>
            {folderFiles.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
                <p className="text-white font-medium mb-1">{folderLabel}</p>
                <p className="text-gray-500 mb-3">{folderFiles.length} files</p>
                <p className="text-xs text-gray-500 uppercase mb-2">Detected</p>
                <div className="flex flex-wrap gap-2">
                  {detectedFromFolder.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-indigo-900/50 text-indigo-200 px-3 py-1 text-xs"
                    >
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runGithubAnalyze();
              }}
              placeholder="https://github.com/owner/repo"
              className="w-full rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {githubLoading && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="h-4 w-4 border-2 border-gray-600 border-t-indigo-400 rounded-full animate-spin" />
                Analyzing repository…
              </div>
            )}
            {githubError && <p className="text-sm text-red-400">{githubError}</p>}
            {githubAnalysis && !githubLoading && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <p className="text-xs text-gray-500 mb-2">Stack hint</p>
                <p className="text-sm text-gray-300 mb-3">{githubAnalysis.stack_hint}</p>
                <div className="flex flex-wrap gap-2">
                  {githubAnalysis.detected_tools.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-indigo-600/30 text-indigo-200 px-3 py-1 text-xs border border-indigo-500/40"
                    >
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
              const selected = selectedTemplate?.name === tpl.name;
              return (
                <button
                  key={tpl.name}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`text-left rounded-xl border p-4 cursor-pointer transition-colors ${
                    selected
                      ? 'border-indigo-500 bg-gray-700'
                      : 'border-gray-700 bg-gray-800 hover:bg-gray-700/80'
                  }`}
                >
                  <div className="text-2xl mb-2">{tpl.icon}</div>
                  <div className="font-semibold text-white text-sm">{tpl.name}</div>
                  <p className="text-[10px] text-gray-500 mt-2 leading-snug">{tpl.description}</p>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={handleScanClick}
          className="mt-8 w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3"
        >
          Scan my environment →
        </button>
      </div>
    </div>
  );
};
