/**
 * THEME MANAGEMENT
 * Auteur: GitHub Copilot
 * Doel: Light/dark mode theme handling
 */

const THEME_KEY = 'pizzeria_theme'

export function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY)
  } catch (_) {
    return null
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (_) {
    // ignore
  }
}

export function systemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (!root) { return }

  if (theme === 'dark') {
    root.classList.add('theme-dark')
  } else {
    root.classList.remove('theme-dark')
  }
}

export function initTheme() {
  const saved = getSavedTheme()
  const theme = saved || (systemPrefersDark() ? 'dark' : 'light')
  applyTheme(theme)
  return theme
}

export function toggleTheme() {
  const current = getSavedTheme() || (systemPrefersDark() ? 'dark' : 'light')
  const next = current === 'dark' ? 'light' : 'dark'
  saveTheme(next)
  applyTheme(next)
  return next
}

export function getTheme() {
  return getSavedTheme() || (systemPrefersDark() ? 'dark' : 'light')
}

export default {
  initTheme,
  toggleTheme,
  getTheme,
  applyTheme,
}
