import React, { useState } from 'react';
import { Cpu, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { login, register } from '../api/client';

interface AuthPageProps {
  onAuth: (token: string, email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuth }) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = tab === 'signin'
        ? await login(email, password)
        : await register(email, password);
      onAuth(res.token, res.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="orb orb-blue" style={{ width: 600, height: 600, top: '-10%', left: '-10%', animationDelay: '0s' }} />
      <div className="orb orb-purple" style={{ width: 500, height: 500, bottom: '-10%', right: '-5%', animationDelay: '3s' }} />
      <div className="orb orb-cyan" style={{ width: 300, height: 300, top: '40%', right: '20%', animationDelay: '1.5s' }} />

      {/* Grid overlay */}
      <div className="grid-bg absolute inset-0 pointer-events-none" />

      {/* Glow rings */}
      <div className="hero-glow-ring" />
      <div className="hero-glow-ring" />

      {/* Card */}
      <div className="auth-card animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="auth-logo-ring mb-4">
            <Cpu size={32} className="text-white" style={{ filter: 'drop-shadow(0 0 12px #00d4ff)' }} />
          </div>
          <h1 className="text-2xl font-bold gradient-text mb-1">Dev Health Monitor</h1>
          <p className="text-blue-300/50 text-sm">AI-powered dev environment diagnostics</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tab-bar">
          {(['signin', 'signup'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(null); }}
              className={`auth-tab${tab === t ? ' active' : ''}`}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
          {/* Email */}
          <div className="auth-field-group">
            <label className="auth-label">Email</label>
            <div className="relative">
              <Mail size={15} className="auth-field-icon" />
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-neon auth-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label className="auth-label">Password</label>
            <div className="relative">
              <Lock size={15} className="auth-field-icon" />
              <input
                id="auth-password"
                type={showPass ? 'text' : 'password'}
                autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
                className="input-neon auth-input pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300/30 hover:text-blue-300/70 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="btn-neon auth-submit"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="auth-spinner" />
                {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {tab === 'signin' ? 'Sign In' : 'Create Account'}
                <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-center text-xs text-blue-300/30 mt-4">
          {tab === 'signin'
            ? "Don't have an account? "
            : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError(null); }}
            className="text-blue-400/70 hover:text-blue-300 transition-colors underline underline-offset-2"
          >
            {tab === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
};
