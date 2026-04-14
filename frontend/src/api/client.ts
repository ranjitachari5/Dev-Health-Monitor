import type { GithubAnalysis, ScanHistoryItem, ScanResponse } from '../types';
import { loadStoredConfig } from '../components/ApiKeyModal';

// If VITE_API_URL is empty/unset, use relative paths (Vite proxy handles /api/* → backend)
// If explicitly set (e.g. production), use that URL
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

function formatDetail(errBody: unknown): string {
  if (typeof errBody === 'object' && errBody !== null && 'detail' in errBody) {
    const d = (errBody as { detail: unknown }).detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d
        .map((x) => (typeof x === 'object' && x !== null ? JSON.stringify(x) : String(x)))
        .join('; ');
    }
    return String(d);
  }
  return 'Request failed';
}

async function post<T>(path: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(BASE_URL + path, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<T>;
}

function getAiHeaders(): Record<string, string> {
  const cfg = loadStoredConfig();
  if (cfg.mode !== 'custom' || !cfg.apiKey.trim()) return {};
  const headers: Record<string, string> = {
    'X-AI-Api-Key': cfg.apiKey.trim(),
  };
  if (cfg.baseUrl.trim()) headers['X-AI-Base-Url'] = cfg.baseUrl.trim();
  if (cfg.model.trim()) headers['X-AI-Model'] = cfg.model.trim();
  return headers;
}

const CLIENT_ID_STORAGE = 'devhealth_client_id';

function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_STORAGE);
    if (existing && existing.trim()) return existing;
    const generated = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLIENT_ID_STORAGE, generated);
    return generated;
  } catch {
    return 'anonymous';
  }
}

function withClientHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'X-Client-Id': getClientId(),
    ...extra,
  };
}

export const runScan = (req: { user_input: string; detected_tools: string[] }) =>
  post<ScanResponse>('/api/scan', req, withClientHeaders(getAiHeaders()));

export const analyzeGithub = (repo_url: string) =>
  post<GithubAnalysis>('/api/analyze-github', { repo_url }, withClientHeaders(getAiHeaders()));

export const getScanHistory = () => get<ScanHistoryItem[]>('/api/history', withClientHeaders());

export const getScanById = (id: number) => get<ScanResponse>(`/api/scan/${id}`, withClientHeaders());

export const pingApi = () => get<{ status: string }>('/api/ping');

export interface AiKeyStatus {
  ok: boolean;
  source: 'default' | 'custom';
  provider: string;
  model: string;
  message: string;
}

export const getAiKeyStatus = () => get<AiKeyStatus>('/api/ai-status', withClientHeaders(getAiHeaders()));

/** Legacy quick machine scan (all tools). */
export async function runHealthScan(): Promise<import('../types').HealthScanResponse> {
  const raw = await get<{
    scan_id: number;
    platform: string;
    overall_score: number;
    tools: import('../types').ToolHealth[];
    timestamp: string;
  }>('/api/health');
  return {
    scan_id: raw.scan_id,
    timestamp: raw.timestamp,
    scan_timestamp: raw.timestamp,
    overall_score: raw.overall_score,
    platform: raw.platform,
    tools: raw.tools,
  };
}
