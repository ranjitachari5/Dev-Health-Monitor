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

// ---------------------------------------------------------------------------
// Smart Project Bootstrapper
// ---------------------------------------------------------------------------

/**
 * POST /api/test-env
 * Check if the current environment has all prerequisites for the given stack.
 * @param {string} stackName  e.g. "react_vite" | "fastapi" | "mern"
 * @returns {Promise<object>} readiness report with per-tool check results
 */
export const testStackEnvironment = async (stackName) => {
  const res = await apiClient.post('/api/test-env', { stack: stackName })
  return res.data
}

/**
 * POST /api/build-stack
 * Bootstrap a new project scaffold for the given stack.
 * Uses a longer timeout (300 s) because npm/pip downloads can be slow.
 * @param {string} stackName   e.g. "react_vite"
 * @param {string} projectName Name for the new project directory
 * @returns {Promise<object>}  { success, stdout, stderr, ... }
 */
export const bootstrapProject = async (stackName, projectName) => {
  const res = await apiClient.post(
    '/api/build-stack',
    { stack: stackName, project_name: projectName },
    { timeout: 300_000 },   // 5-minute timeout for heavy scaffolding
  )
  return res.data
}

export default apiClient