/**
 * THEME MANAGEMENT
 * Doel: Light/dark mode theme handling
 */

const THEME_KEY = 'pizzeria_theme' //localstorage key

export function getSavedTheme() {
  try {
    return localStorage.getItem(THEME_KEY) //zoek naar de localstorage key
  } catch (_) {
    return null
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme) //sla het key-value pair op
  } catch (_) {
    // ignore
  }
}

export function systemPrefersDark() { 
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyTheme(theme) { //gebruik het thema op de root
  const root = document.documentElement //sla root op
  if (!root) { return }

  if (theme === 'dark') { //als thema dark --> zet class op root
    root.classList.add('theme-dark')
  } else { //anders --> haal class eraf
    root.classList.remove('theme-dark')
  }
}

export function initTheme() { //zoek thema && thema preference --> gebruik het thema
  const saved = getSavedTheme()
  const theme = saved || (systemPrefersDark() ? 'dark' : 'light')
  applyTheme(theme)
  return theme
}

export function toggleTheme() { //switch van thema
  const current = getSavedTheme() || (systemPrefersDark() ? 'dark' : 'light')
  const next = current === 'dark' ? 'light' : 'dark'
  saveTheme(next)
  applyTheme(next)
  return next
}

export function getTheme() { //zoek thema
  return getSavedTheme() || (systemPrefersDark() ? 'dark' : 'light')
}

export default { //globaal maken
  initTheme,
  toggleTheme,
  getTheme,
  applyTheme,
}
