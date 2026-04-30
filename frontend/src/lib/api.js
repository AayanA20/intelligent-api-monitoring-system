import axios from 'axios'

const BASE_URL = 'https://intelligent-api-monitoring-system-3.onrender.com'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const url = config.url || ''
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return config
  }
  const token = localStorage.getItem('apg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('apg_token')
      localStorage.removeItem('apg_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// AUTH
export const login    = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data)

export const register = (name, username, email, password) =>
  api.post('/auth/register', { name, username, email, password }).then(r => r.data)

export const me = () => api.get('/auth/me').then(r => r.data)

// ANALYTICS
export const getStats                = ()             => api.get('/analytics/stats').then(r => r.data)
export const getRecentLogs           = (limit = 50)   => api.get('/analytics/recent-logs',        { params: { limit }   }).then(r => r.data)
export const getAbuseEvents          = (limit = 50)   => api.get('/analytics/abuse-events',        { params: { limit }   }).then(r => r.data)
export const getRequestsPerMinute    = (minutes = 30) => api.get('/analytics/requests-per-minute', { params: { minutes } }).then(r => r.data)
export const getStatusDistribution   = ()             => api.get('/analytics/status-distribution').then(r => r.data)
export const getDecisionDistribution = ()             => api.get('/analytics/decision-distribution').then(r => r.data)
export const getTopEndpoints         = (limit = 10)   => api.get('/analytics/top-endpoints',       { params: { limit }   }).then(r => r.data)
export const getTopUsers             = (limit = 10)   => api.get('/analytics/top-users',           { params: { limit }   }).then(r => r.data)
export const getSlowApis             = ()             => api.get('/analytics/slow-apis').then(r => r.data)
export const getFailedApis           = ()             => api.get('/analytics/failed-apis').then(r => r.data)
export const resetCounters           = ()             => api.post('/analytics/reset-counters').then(r => r.data)

// DEMO APIs — normal usage
export const callNormal = () =>
  api.get('/api/normal').then(r => r.data).catch(e => ({ error: e.response?.status }))

export const callHeavy = () =>
  api.get('/api/heavy').then(r => r.data).catch(e => ({ error: e.response?.status }))

// ── Pattern-Based Attack Simulations ──────────────────────────────────────────
export const callSQLInjection = () =>
  api.get("/api/normal?id=1' OR 1=1--&search=1 UNION SELECT * FROM users")
    .then(r => r.data).catch(e => ({ error: e.response?.status }))

export const callPathTraversal = () =>
  api.get('/api/normal?path=../../etc/passwd&file=%2e%2e%2f%2e%2e%2fwindows/system32')
    .then(r => r.data).catch(e => ({ error: e.response?.status }))

export const callXSSAttack = () =>
  api.get('/api/normal?q=<script>alert(1)</script>&input=<iframe+src=javascript:alert(1)>')
    .then(r => r.data).catch(e => ({ error: e.response?.status }))

export default api