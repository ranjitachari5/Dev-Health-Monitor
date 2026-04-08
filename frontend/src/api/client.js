import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:5000',
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

export const runScan = async () => (await apiClient.post('/scan')).data
export const getReport = async () => (await apiClient.get('/report')).data

export default apiClient