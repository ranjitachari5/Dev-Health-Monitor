import type {
  GithubAnalysis,
  ScanHistoryItem,
  ScanResponse,
} from '../types';
import { loadStoredConfig } from '../components/ApiKeyModal';

// If VITE_API_URL is empty/unset, use relative paths (Vite proxy handles /api/* → backend)
// If explicitly set (e.g. production), use that URL
const BASE_URL = import.meta.env.VITE_API_URL || "";

// ── JWT storage ────────────────────────────────────────────────────────────
export const JWT_STORAGE_KEY = 'devhealth_jwt';
export const BRAIN_CHOSEN_KEY = 'devhealth_brain_chosen';

export function getStoredToken(): string | null {
  return localStorage.getItem(JWT_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(JWT_STORAGE_KEY, token);
}

export function clearAuth(): void {
  localStorage.removeItem(JWT_STORAGE_KEY);
  localStorage.removeItem(BRAIN_CHOSEN_KEY);
}

// ── Header builders ────────────────────────────────────────────────────────

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

/** Build AI credential headers from localStorage config (if set). */
function getAiHeaders(): Record<string, string> {
  const cfg = loadStoredConfig();
  const headers: Record<string, string> = {};
  if (cfg.apiKey)  headers['X-AI-Api-Key']  = cfg.apiKey;
  if (cfg.baseUrl) headers['X-AI-Base-Url'] = cfg.baseUrl;
  if (cfg.model)   headers['X-AI-Model']    = cfg.model;
  return headers;
}

/** Build auth header from stored JWT. */
function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Merge all headers. AI key stays in custom headers; JWT in Authorization. */
function allHeaders(): Record<string, string> {
  return { ...getAuthHeaders(), ...getAiHeaders() };
}

// ── HTTP helpers ───────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...allHeaders(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE_URL + path, {
    headers: allHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<T>;
}

// ── Auth API ───────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  email: string;
  message: string;
}

/**
 * POST /api/auth/login — No JWT in header (unauthenticated endpoint).
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(BASE_URL + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<AuthResponse>;
}

/**
 * POST /api/auth/register — No JWT in header (unauthenticated endpoint).
 */
export async function register(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(BASE_URL + '/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<AuthResponse>;
}

export const getMe = () => get<{ id: number; email: string; created_at: string }>('/api/auth/me');

// ── Scan API ───────────────────────────────────────────────────────────────

export const runScan = (req: { user_input: string; detected_tools: string[] }) =>
  post<ScanResponse>('/api/scan', req);

export const analyzeGithub = (repo_url: string) =>
  post<GithubAnalysis>('/api/analyze-github', { repo_url });

export const getScanHistory = () => get<ScanHistoryItem[]>('/api/history');

export const getScanById = (id: number) => get<ScanResponse>(`/api/scan/${id}`);

export interface InstallCommandResponse {
  tool: string;
  platform: string;
  command: string;
  notes: string;
  error: string | null;
  raw_response: string | null;
}

export const getInstallCommand = (toolName: string) =>
  get<InstallCommandResponse>(`/api/install-command/${encodeURIComponent(toolName)}`);

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
