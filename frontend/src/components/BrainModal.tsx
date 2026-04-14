import React, { useState } from 'react';
import { Cpu, Key, CheckCircle, Sparkles, ChevronRight } from 'lucide-react';
import { loadStoredConfig, saveStoredConfig, type ApiKeyConfig } from './ApiKeyModal';

interface BrainModalProps {
  onConfirm: (usingDefault: boolean) => void;
}

const OPENROUTER_PRESETS: Partial<ApiKeyConfig> = {
  provider: 'openrouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'google/gemma-3-27b-it:free',
};

export const BrainModal: React.FC<BrainModalProps> = ({ onConfirm }) => {
  const [choice, setChoice] = useState<'default' | 'custom'>('default');
  const [customKey, setCustomKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    if (choice === 'default') {
      // Clear any stored key so server uses .env default
      saveStoredConfig({ apiKey: '', baseUrl: '', model: '', provider: '' });
    } else {
      // Detect provider from key prefix
      const k = customKey.trim();
      let preset: Partial<ApiKeyConfig> = {};
      if (k.startsWith('sk-or-'))       preset = { provider: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'google/gemma-3-27b-it:free' };
      else if (k.startsWith('sk-ant-')) preset = { provider: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-20241022' };
      else if (k.startsWith('AIza'))    preset = { provider: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.0-flash' };
      else if (k.startsWith('gsk_'))    preset = { provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' };
      else if (k.startsWith('sk-'))     preset = { provider: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' };
      saveStoredConfig({
        apiKey: k,
        baseUrl: preset.baseUrl ?? '',
        model: preset.model ?? '',
        provider: preset.provider ?? (k ? 'custom' : ''),
      });
    }
    setTimeout(() => onConfirm(choice === 'default'), 350);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(12px)' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div style={{ width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(30,64,175,0.18) 0%, transparent 70%)' }} />
      </div>

      <div className="brain-modal-card animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="brain-modal-icon-ring mx-auto mb-4">
            <Cpu size={28} className="text-white" style={{ filter: 'drop-shadow(0 0 10px #00d4ff)' }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Choose Your AI Brain</h2>
          <p className="text-blue-300/50 text-sm">How would you like to power the analysis engine?</p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Default Brain */}
          <button
            type="button"
            onClick={() => setChoice('default')}
            className={`brain-option-card${choice === 'default' ? ' selected' : ''}`}
          >
            <div className="brain-option-icon default">
              <Sparkles size={20} className="text-cyan-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-sm">Default Brain</p>
              <p className="text-blue-300/50 text-xs mt-0.5">Powered by OpenRouter · Gemma 3 27B · No key needed</p>
            </div>
            <div className={`brain-radio${choice === 'default' ? ' active' : ''}`} />
          </button>

          {/* Custom API */}
          <button
            type="button"
            onClick={() => setChoice('custom')}
            className={`brain-option-card${choice === 'custom' ? ' selected' : ''}`}
          >
            <div className="brain-option-icon custom">
              <Key size={20} className="text-purple-300" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-white text-sm">Custom API Key</p>
              <p className="text-blue-300/50 text-xs mt-0.5">Use your own OpenAI, Groq, Anthropic, or Gemini key</p>
            </div>
            <div className={`brain-radio${choice === 'custom' ? ' active' : ''}`} />
          </button>
        </div>

        {/* Custom key input (animated) */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{ maxHeight: choice === 'custom' ? '100px' : '0', opacity: choice === 'custom' ? 1 : 0 }}
        >
          <div className="mb-5 relative">
            <label className="auth-label mb-2 block">Your API Key</label>
            <div className="relative">
              <input
                id="brain-custom-key"
                type={showKey ? 'text' : 'password'}
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="sk-…  sk-ant-…  AIza…  gsk_…  sk-or-…"
                className="input-neon auth-input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/30 hover:text-blue-300/70 transition-colors"
              >
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          id="brain-confirm-btn"
          type="button"
          disabled={choice === 'custom' && !customKey.trim()}
          onClick={handleConfirm}
          className="btn-neon w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{
            background: confirmed
              ? 'linear-gradient(135deg,#059669,#10b981)'
              : undefined,
            opacity: (choice === 'custom' && !customKey.trim()) ? 0.4 : 1,
          }}
        >
          {confirmed
            ? <><CheckCircle size={16} />Ready!</>
            : <>Continue <ChevronRight size={16} /></>}
        </button>

        <p className="text-center text-xs text-blue-300/25 mt-4">
          You can change this anytime via ⚙ Settings
        </p>
      </div>
    </div>
  );
};
