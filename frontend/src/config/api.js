// API base URL - uses environment variable or falls back to relative path for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Build full API endpoint URL
export function apiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}
