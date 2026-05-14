/**
 * API CONFIGURATION
 * Auteur: GitHub Copilot
 * Doel: API URL configuratie voor development/production
 */

// API base URL - uses environment variable or falls back to relative path for development
// Resolve VITE_API_URL and ensure a trailing "/api" when a full host is provided.
const raw = import.meta.env.VITE_API_URL || '/api'
const socketRaw = import.meta.env.VITE_SOCKET_URL || ''
let API_BASE_URL = raw
if (raw.startsWith('http') && !raw.endsWith('/api')) {
  API_BASE_URL = raw.replace(/\/+$/g, '') + '/api'
}

// Socket.IO should connect to the backend origin, not the frontend host.
export function getSocketServerUrl() {
  if (socketRaw.startsWith('http')) {
    return socketRaw.replace(/\/+$/g, '')
  }

  if (raw.startsWith('http')) {
    return raw.replace(/\/api\/?$/g, '').replace(/\/+$/g, '')
  }

  if (!raw.startsWith('http')) {
    return undefined
  }

  return raw.replace(/\/api\/?$/g, '').replace(/\/+$/g, '')
}

// Build full API endpoint URL
export function apiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
}

export { API_BASE_URL }
