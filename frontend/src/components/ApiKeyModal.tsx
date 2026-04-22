import React, { useEffect, useState } from 'react';
import { X, Key, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export interface ApiKeyConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: string;
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ApiKeyConfig) => void;
  currentConfig: ApiKeyConfig;
}

// Provider presets — resolved from key prefix automatically
const PROVIDER_PRESETS: Record<string, { provider: string; baseUrl: string; model: string; label: string }> = {
  'sk-or-': {
    provider: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
    label: 'OpenRouter',
  },
  'sk-ant-': {
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    label: 'Anthropic (Claude)',
  },
  'AIza': {
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    label: 'Google Gemini',
  },
  'gsk_': {
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    label: 'Groq (LLaMA)',
  },
  'sk-': {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    label: 'OpenAI (ChatGPT)',
  },
};

function resolvePreset(key: string) {
  const k = (key || '').trim();
  // Check most specific prefixes first
  for (const prefix of ['sk-or-', 'sk-ant-', 'AIza', 'gsk_', 'sk-']) {
    if (k.startsWith(prefix)) return PROVIDER_PRESETS[prefix];
  }
  return null;
}

export const AI_KEY_STORAGE = 'devhealth_ai_config';

export function loadStoredConfig(): ApiKeyConfig {
  try {
    const raw = localStorage.getItem(AI_KEY_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as ApiKeyConfig & { mode?: string };
      // Migrate old format (had mode field) to new format
      return {
        apiKey: parsed.apiKey || '',
        baseUrl: parsed.baseUrl || '',
        model: parsed.model || '',
        provider: parsed.provider || '',
      };
    }
  } catch {
    // ignore
  }
  return { apiKey: '', baseUrl: '', model: '', provider: '' };
}

export function saveStoredConfig(cfg: ApiKeyConfig): void {
  localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(cfg));
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}) => {
  const [apiKey, setApiKey] = useState(currentConfig.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const preset = resolvePreset(apiKey);
  const hasKey = apiKey.trim().length > 0;

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setApiKey(currentConfig.apiKey);
      setSaved(false);
      setShowKey(false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    const p = resolvePreset(trimmed);
    const cfg: ApiKeyConfig = {
      apiKey: trimmed,
      baseUrl: p?.baseUrl ?? '',
      model: p?.model ?? '',
      provider: p?.provider ?? (trimmed ? 'custom' : ''),
    };
    saveStoredConfig(cfg);
    onSave(cfg);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setApiKey('');
    const cfg: ApiKeyConfig = { apiKey: '', baseUrl: '', model: '', provider: '' };
    saveStoredConfig(cfg);
    onSave(cfg);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'linear-gradient(135deg, rgba(10,10,30,0.98), rgba(5,5,20,0.99))',
          border: '1px solid rgba(59,130,246,0.25)',
          boxShadow: '0 0 60px rgba(59,130,246,0.15), 0 25px 50px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#1e40af,#4f46e5)', boxShadow: '0 0 20px rgba(79,70,229,0.4)' }}
            >
              <Key size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base">AI API Key</h2>
              <p className="text-blue-300/50 text-xs">Powers the health analysis engine</p>
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-300/40 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Status */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
          style={
            hasKey && preset
              ? { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }
              : hasKey
              ? { background: 'rgba(100,100,120,0.12)', border: '1px solid rgba(180,180,200,0.15)' }
              : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }
          }
        >
          {hasKey
            ? <CheckCircle size={15} className="text-blue-400" />
            : <AlertCircle size={15} className="text-red-400/70" />}
          <span className={hasKey ? 'text-blue-300/80' : 'text-red-300/70'}>
            {hasKey && preset
              ? <><span>Auto-detected: </span><strong className="text-white">{preset.label}</strong><span> · {preset.model}</span></>
              : hasKey
              ? 'Custom provider — will auto-route'
              : 'No key set — AI features require your API key'}
          </span>
        </div>

        {/* API Key input */}
        <div>
          <label className="text-blue-200/40 text-xs uppercase tracking-widest block mb-2">
            Your API Key
          </label>
          <div className="relative">
            <input
              id="ai-api-key-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…  or  sk-ant-…  or  AIza…  or  gsk_…"
              className="w-full rounded-xl px-4 py-3.5 pr-11 text-sm font-mono bg-white/5 border border-white/10 text-white placeholder-blue-300/20 focus:outline-none focus:border-blue-500/40 transition-all"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/30 hover:text-blue-300/70 transition-colors"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Supported providers hint */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              { label: 'OpenRouter', prefix: 'sk-or-', color: '#8b5cf6' },
              { label: 'ChatGPT', prefix: 'sk-', color: '#10a37f' },
              { label: 'Claude', prefix: 'sk-ant-', color: '#d4a56a' },
              { label: 'Gemini', prefix: 'AIza…', color: '#4285f4' },
              { label: 'Groq', prefix: 'gsk_', color: '#f55036' },
            ].map((p) => (
              <span
                key={p.label}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${p.color}18`, border: `1px solid ${p.color}33`, color: `${p.color}cc` }}
              >
                {p.label}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          {apiKey && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-3 rounded-xl text-sm text-red-400/60 hover:text-red-400 border border-red-500/10 hover:border-red-500/30 transition-all"
            >
              Clear Key
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all"
            style={{
              background: saved
                ? 'linear-gradient(135deg,#059669,#10b981)'
                : 'linear-gradient(135deg,#1e40af,#4f46e5)',
              boxShadow: saved
                ? '0 0 20px rgba(16,185,129,0.3)'
                : '0 0 20px rgba(79,70,229,0.3)',
            }}
          >
            {saved ? <><CheckCircle size={16} /> Saved!</> : <><Key size={16} /> Save Key</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/** Small trigger button — shows in nav */
export const ApiKeyButton: React.FC<{ onClick: () => void; hasKey: boolean }> = ({ onClick, hasKey }) => (
  <button
    type="button"
    id="api-key-settings-btn"
    onClick={onClick}
    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
    style={
      hasKey
        ? { background: 'rgba(16,163,127,0.12)', border: '1px solid rgba(16,163,127,0.3)', color: '#34d399' }
        : { background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }
    }
    data-hover
    title="Configure AI API key"
  >
    <Key size={12} />
    {hasKey ? '🔑 Key Set' : '⚠ Add API Key'}
  </button>
);
