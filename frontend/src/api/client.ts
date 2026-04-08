import type {
  GithubAnalysis,
  ScanHistoryItem,
  ScanResponse,
} from '../types';

// If VITE_API_URL is empty/unset, use relative paths (Vite proxy handles /api/* → backend)
// If explicitly set (e.g. production), use that URL
const BASE = import.meta.env.VITE_API_URL || '';

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

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(formatDetail(err));
  }
  return res.json() as Promise<T>;
}

export const runScan = (req: { user_input: string; detected_tools: string[] }) =>
  post<ScanResponse>('/api/scan', req);

export const analyzeGithub = (repo_url: string) =>
  post<GithubAnalysis>('/api/analyze-github', { repo_url });

export const getScanHistory = () => get<ScanHistoryItem[]>('/api/history');

export const getScanById = (id: number) => get<ScanResponse>(`/api/scan/${id}`);

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
