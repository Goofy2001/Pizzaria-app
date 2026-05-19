/**
 * LOGIN PAGE
 * Doel: Authenticatie interface voor drivers en restaurant managers
 * Beschrijving: Accepteert 'front' (manager) of 'driver' rollen met identifier/password
 */

//importeer functies
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveSession } from '../lib/session.js'
import { apiUrl } from '../config/api.js'

// Login screen for both front users and drivers.
export default function LoginPage() {
  const navigate = useNavigate()
  // Form state and UI feedback state.
  const [role, setRole] = useState('front')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  //inlog functie: wat gebeurd er als de knop wordt ingeklikt
  async function handleSubmit(event) {
    event.preventDefault() //geen reload
    setError('')
    setLoading(true)
    //upload json naar authorisatie api
    try {
      const response = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier, password })
      })
      //wacht op antwoord
      const payload = await response.json()
      if (!response.ok) { //not ok
        throw new Error(payload?.error || `HTTP ${response.status}`)
      }
      //haal user info uit response
      const user = payload.user
      saveSession(user) //maak key-value pair voor de user

      if (user.role === 'front') { //--> als response json front is: ga naar front dashboard
        navigate(`/front/${user.branch_id}`)
      } else {
        navigate(`/driver/${user.driver_id}`) //--> ga anders naar driver dashboard
      }
    } catch (err) {
      setError(err.message) //error handling
    } finally {
      setLoading(false) //stop met laden
    }
  }

  return ( //html informatie van de pagina
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
