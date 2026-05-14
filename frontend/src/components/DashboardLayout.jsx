/**
 * DASHBOARD LAYOUT COMPONENT
 * Auteur: GitHub Copilot
 * Doel: Gedeelde pagina shell voor dashboards
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../lib/session.js'
import { getTheme, toggleTheme } from '../lib/theme.js'

// Shared page shell used by front and driver dashboards.
export default function DashboardLayout({ title, subtitle, children }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getTheme())

  useEffect(() => {
    setTheme(getTheme())
  }, [])

  // Logout flow: clear local session and return to login page.
  async function logout() {
    const session = getSession()

    try {
      if (session?.role === 'driver' && session?.driver_id) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'driver', identifier: session.driver_id })
        })
      }
    } catch (_) {
      // ignore logout network errors and always clear local session
    } finally {
      clearSession()
      navigate('/login')
    }
  }

  return (
    <main className="container-fluid py-4 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-start mb-4 gap-2 flex-wrap">
        <div>
          <h1 className="h3 mb-1">{title}</h1>
          <p className="text-muted mb-0">{subtitle}</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" type="button" onClick={() => {
            const next = toggleTheme()
            setTheme(next)
          }} title="Wissel licht/donker modus">
            {theme === 'dark' ? '🌙 Donker' : '☀️ Licht'}
          </button>
          <button className="btn btn-outline-secondary" type="button" onClick={logout}>
            Uitloggen
          </button>
        </div>
      </div>
      {children}
    </main>
  )
}
