// Get API URL from window (injected by server) or environment variable
const API_BASE_URL = 
  window.__API_URL__ || 
  import.meta.env.VITE_API_URL || 
  'http://localhost:8000'

export { API_BASE_URL }

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`
}
