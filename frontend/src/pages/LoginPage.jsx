import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveSession } from '../lib/session.js'

// Login screen for both front users and drivers.
export default function LoginPage() {
  const navigate = useNavigate()
  // Form state and UI feedback state.
  const [role, setRole] = useState('front')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Submit credentials, store session, then route to correct dashboard.
  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, password })
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || `HTTP ${response.status}`)
      }

      const user = payload.user
      saveSession(user)

      if (user.role === 'front') {
        navigate(`/front/${user.branch_id}`)
      } else {
        navigate(`/driver/${user.driver_id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Basic card-based login UI.
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <form className="card shadow-sm" onSubmit={handleSubmit}>
            <div className="card-body p-4">
              <h1 className="h3 mb-2">Pizzeria Login</h1>
              <p className="text-muted mb-4">Log in als front of driver en ga direct naar je dashboard.</p>

              <div className="mb-3">
                <label className="form-label">Rol</label>
                <select className="form-select" value={role} onChange={(event) => setRole(event.target.value)}>
                  <option value="front">Front</option>
                  <option value="driver">Driver</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">{role === 'front' ? 'Branch ID' : 'Driver ID'}</label>
                <input
                  className="form-control"
                  type="number"
                  min="1"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder={role === 'front' ? 'bv. 1' : 'bv. 2'}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Wachtwoord</label>
                <input
                  className="form-control"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Vul je login wachtwoord in"
                  required
                />
              </div>

              {error ? <div className="alert alert-danger py-2">{error}</div> : null}

              <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                {loading ? 'Inloggen...' : 'Inloggen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
