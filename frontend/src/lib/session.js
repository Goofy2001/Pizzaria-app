/**
 * SESSION MANAGEMENT
 * Doel: Beheer user session via localStorage
 */

const SESSION_KEY = 'pizzeria_session' //key item voor localstorage

//opvragen van localstorage informatie voor sessie gegevens
export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY) //zoek naar key --> pizzeria_session
  if (!raw) { return null } //indien geen gegevens --> doe niks

  try {
    return JSON.parse(raw) //zet het object naar een json
  } catch (_) {
    return null
  }
}

//sla het key-value pair op in de localstorage
export function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

//verwijder het key-value pair uit de localstorage
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
