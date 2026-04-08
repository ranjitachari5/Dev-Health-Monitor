import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err?.response?.data || err.message)
    return Promise.reject(err)
  }
)

// Normalize backend tool shape → frontend tool shape
function normalizeTool(t) {
  const statusMap = {
    'Healthy': 'ok',
    'Outdated': 'outdated',
    'Not Installed': 'missing',
    'Missing': 'missing',
  }
  return {
    name: t.tool_name ?? t.name,
    version: t.current_version ?? t.version ?? null,
    status: statusMap[t.status] ?? (t.is_installed ? 'ok' : 'missing'),
    required_version: t.required_version,
  }
}

// GET /api/health — runs a scan and returns tool health data
export const runScan = async () => {
  const res = await apiClient.get('/api/health')
  return {
    overall_score: res.data.overall_score,
    scan_timestamp: res.data.scan_timestamp,
    tools: (res.data.tools || []).map(normalizeTool),
  }
}

// Alias for compatibility — both runScan and getReport call the same endpoint
export const getReport = async () => runScan()

// POST /api/fix/{tool_name}?fix_type=install|path
export const fixTool = async (toolName, fixType = 'install') => {
  const res = await apiClient.post(`/api/fix/${encodeURIComponent(toolName)}`, null, {
    params: { fix_type: fixType },
  })
  return res.data
}

export default apiClient