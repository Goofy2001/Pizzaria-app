/**
 * API ERROR HANDLING
 * Auteur: GitHub Copilot
 * Doel: Parse en format backend error responses
 */

// Convert backend error responses into user-friendly text.
export async function parseApiError(response) {
  let payload = null
  try {
    payload = await response.json()
  } catch (_) {
    payload = null
  }

  // Prefer backend message; fallback to HTTP status.
  const backendMessage = payload?.error || `HTTP ${response.status}`
  // Map specific conflict errors to a clearer message for the UI.
  if (response.status === 409 && backendMessage.includes('actieve levering')) {
    return 'Deze driver is al onderweg met een andere bestelling en kan geen tweede levering krijgen.'
  }
  return backendMessage
}
