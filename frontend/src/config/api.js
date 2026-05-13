// API base URL - uses environment variable or falls back to relative path for development
// Resolve VITE_API_URL and ensure a trailing "/api" when a full host is provided.
const raw = import.meta.env.VITE_API_URL || '/api'
let API_BASE_URL = raw
if (raw.startsWith('http') && !raw.endsWith('/api')) {
  API_BASE_URL = raw.replace(/\/+$/g, '') + '/api'
}

// Build full API endpoint URL
export function apiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export { API_BASE_URL }
