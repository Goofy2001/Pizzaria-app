/**
 * SESSION MANAGEMENT
 * Auteur: GitHub Copilot
 * Doel: Beheer user session via localStorage
 */

const SESSION_KEY = 'pizzeria_session'

// Read the saved login session from localStorage.
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) { return null }

  try {
    return JSON.parse(raw)
  } catch (_) {
    return null
  }
}

// Save the logged-in user data so page refresh keeps the session.
export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

// Remove session data on logout.
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
