import axios from 'axios'

const api = axios.create({
  // Always relative: routed through the Vite dev proxy (vite.config.ts) so
  // requests stay same-origin and never trigger a cross-origin preflight.
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ─── Request interceptor: attach JWT ─────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ss_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: handle 401 ────────────────────
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ss_token')
      localStorage.removeItem('ss_user')
      window.location.href = '/login'
    }

    // Validation errors (400) carry the generic message in `message` and the
    // real per-field reason in `errors` — surface the first field error so
    // toasts show why the request actually failed, not a generic sentence.
    const fieldErrors = error.response?.data?.errors
    if (fieldErrors && typeof fieldErrors === 'object') {
      const firstFieldError = Object.values(fieldErrors)[0]
      if (typeof firstFieldError === 'string') {
        error.response.data.message = firstFieldError
      }
    }

    return Promise.reject(error)
  }
)

export default api
