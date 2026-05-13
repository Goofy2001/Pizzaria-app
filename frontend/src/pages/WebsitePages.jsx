import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { apiUrl } from '../config/api.js'
import './WebsitePages.css'

const logoUrl = 'https://www.anticopizza.be/wp-content/uploads/2020/06/Antico-Sourdoug-Pizza-IG-Logo.png'

function WebsiteLayout({ children }) {
  return (
    <div className="website-shell">
      <header className="site-header">
        <nav className="site-nav">
          <Link to="/website" className="site-logo">
            <img src={logoUrl} alt="Antico Pizza" />
            <span>Antico Pizza</span>
          </Link>

          <div className="site-links">
            <NavLink to="/website" end>Home</NavLink>
            <NavLink to="/website/menu">Menu</NavLink>
            <NavLink to="/website/reserve">Reserve</NavLink>
            <NavLink to="/website/pickup">Pick-up</NavLink>
            <NavLink to="/website/delivery">Delivery</NavLink>
            <NavLink to="/website/locations">Locations</NavLink>
            <NavLink to="/website/contact">Contact</NavLink>
            <NavLink to="/login">Login</NavLink>
          </div>
        </nav>
      </header>

      {children}

      <footer className="site-footer">© 2026 Antico Pizza – Leuven</footer>
    </div>
  )
}

function useBranches() {
  const fallback = useMemo(() => ([
    { id: 'hal5', name: 'HAL5', address: 'HAL 5, Vaartstraat 226, 3018 Kessel-Lo' },
    { id: 'muntstraat', name: 'Muntstraat 16', address: 'Muntstraat 16, 3000 Leuven' }
  ]), [])

  const [branches, setBranches] = useState(fallback)

  useEffect(() => {
    let mounted = true

    async function loadBranches() {
      try {
        const response = await fetch(apiUrl('/branch'))
        if (!response.ok) { return }
        const data = await response.json()
        if (mounted && Array.isArray(data) && data.length > 0) {
          setBranches(data)
        }
      } catch (_) {
        // keep fallback
      }
    }

    loadBranches()
    return () => { mounted = false }
  }, [fallback])

  return branches
}

function submitMessageStyle(kind) {
  return { color: kind === 'success' ? '#1c8a45' : kind === 'error' ? '#b91c1c' : '#333', marginTop: '1rem', fontWeight: 700 }
}

export function WebsiteHomePage() {
  return (
    <WebsiteLayout>
      <section className="site-hero">
        <div>
          <h1>Antico Pizza</h1>
          <p>Authentieke Neapolitaanse pizza, houtoven, verse ingrediënten en snelle service in Leuven.</p>
          <div className="hero-actions">
            <Link className="button" to="/website/delivery">Bestel delivery</Link>
            <Link className="button-outline" to="/website/pickup">Bestel pick-up</Link>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="section-heading">
          <h2>Onze locaties</h2>
          <p>Twee warme zaken in Leuven, elk met hun eigen sfeer.</p>
        </div>

        <div className="card-grid">
          <article className="site-card">
            <img src="https://www.anticopizza.be/wp-content/uploads/elementor/thumbs/IMG_2265-oqvmizbxcj0yloqhgyag0tzknosa9lxpc0uh8i55tk.jpg" alt="Antico HAL5" />
            <div className="site-card-body">
              <h3>HAL5</h3>
              <p className="muted">Ideaal voor een casual avond met vrienden of familie.</p>
              <Link className="button-outline" to="/website/locations">Bekijk locatie</Link>
            </div>
          </article>

          <article className="site-card">
            <img src="https://www.anticopizza.be/wp-content/uploads/elementor/thumbs/IMG_1206-scaled-pfus2sep6c38bvxroxn2jh537in5739z2d387akla0.jpg" alt="Antico Muntstraat" />
            <div className="site-card-body">
              <h3>Muntstraat 16</h3>
              <p className="muted">Gezellig in het centrum van Leuven.</p>
              <Link className="button-outline" to="/website/locations">Bekijk locatie</Link>
            </div>
          </article>

          <article className="site-card">
            <img src="/afbeeldingen/doughMakingMachine2.jpg" alt="Deegmachine" />
            <div className="site-card-body">
              <h3>Ambachtelijk deeg</h3>
              <p className="muted">72 uur gefermenteerd voor meer smaak en luchtigheid.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="site-section">
        <div className="split-layout">
          <div>
            <div className="section-heading" style={{ textAlign: 'left' }}>
              <h2>Pizza zoals het hoort</h2>
              <p>Neapolitaans, warm, snel en met aandacht voor kwaliteit.</p>
            </div>
            <div className="info-grid">
              <div className="info-card">
                <h3>Pick-up</h3>
                <p>Bestel online en haal je pizza snel af.</p>
              </div>
              <div className="info-card">
                <h3>Delivery</h3>
                <p>Laat het leveren tot aan de deur.</p>
              </div>
              <div className="info-card">
                <h3>Reserve</h3>
                <p>Plan je tafel vooraf via het reservatieformulier.</p>
              </div>
            </div>
          </div>
          <div className="split-image">
            <img src="/afbeeldingen/doughBallsMaturation.jpg" alt="Deegballen rijpen" />
          </div>
        </div>
      </section>
    </WebsiteLayout>
  )
}

export function WebsiteMenuPage() {
  const menuSections = [
    { title: 'Margherita', price: '€12.50', desc: 'Tomaat, mozzarella, basilicum.' },
    { title: 'Diavola', price: '€14.50', desc: 'Pittige salami, tomaat, mozzarella.' },
    { title: 'Marinara', price: '€10.50', desc: 'Tomaat, oregano, knoflook.' },
    { title: 'Prosciutto', price: '€15.50', desc: 'Ham, mozzarella, tomaat.' },
    { title: 'Quattro Formaggi', price: '€16.50', desc: 'Vier kazen, rijk en romig.' },
    { title: 'Specials', price: 'Vanaf €14.50', desc: 'Wisselende seizoensspecials.' }
  ]

  return (
    <WebsiteLayout>
      <section className="page-hero">
        <h1>Menu</h1>
        <p>Een compacte selectie van onze klassiekers en specials.</p>
      </section>

      <div className="content-panel">
        <div className="menu-tabs">
          <span className="menu-pill active">HAL5</span>
          <span className="menu-pill">Muntstraat 16</span>
        </div>

        <div className="menu-list">
          {menuSections.map((item) => (
            <div className="menu-item" key={item.title}>
              <h4>{item.title} <span className="price">{item.price}</span></h4>
              <p className="muted">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </WebsiteLayout>
  )
}

export function WebsiteLocationsPage() {
  return (
    <WebsiteLayout>
      <section className="page-hero">
        <h1>Locations</h1>
        <p>Ontdek onze twee locaties in Leuven.</p>
      </section>

      <div className="site-section">
        <div className="info-grid">
          <div className="info-card">
            <h3>HAL5</h3>
            <p>HAL 5, Vaartstraat 226</p>
            <p>3018 Kessel-Lo (Leuven)</p>
            <p className="muted">Perfect voor een informele avond.</p>
            <a className="button-outline" href="https://maps.google.com/?q=HAL5+Kessel-Lo" target="_blank" rel="noreferrer">Open in Maps</a>
          </div>
          <div className="info-card">
            <h3>Muntstraat 16</h3>
            <p>Muntstraat 16</p>
            <p>3000 Leuven</p>
            <p className="muted">Gezellig in het hart van de stad.</p>
            <a className="button-outline" href="https://maps.google.com/?q=Muntstraat+16+Leuven" target="_blank" rel="noreferrer">Open in Maps</a>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  )
}

export function WebsiteContactPage() {
  return (
    <WebsiteLayout>
      <section className="page-hero">
        <h1>Contact</h1>
        <p>Contacteer ons voor vragen, reservaties of delivery-info.</p>
      </section>

      <div className="site-section">
        <div className="info-grid">
          <div className="info-card">
            <h3>HAL5</h3>
            <p>HAL 5, Vaartstraat 226<br />3018 Kessel-Lo (Leuven)</p>
            <p><strong>Email:</strong> hal5@anticopizza.be</p>
          </div>
          <div className="info-card">
            <h3>Muntstraat 16</h3>
            <p>Muntstraat 16<br />3000 Leuven</p>
            <p><strong>Email:</strong> muntstraat@anticopizza.be</p>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  )
}

export function ReserveTablePage() {
  const branches = useBranches()
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState('info')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('Versturen...')
    setMessageKind('info')

    try {
      const formData = new FormData(event.currentTarget)
      const payload = Object.fromEntries(formData.entries())
      const response = await fetch(apiUrl('/reservations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Reservatie kon niet worden opgeslagen')
      }

      event.currentTarget.reset()
      setMessage('Reservatie opgeslagen in de database.')
      setMessageKind('success')
    } catch (err) {
      setMessage(err.message)
      setMessageKind('error')
    }
  }

  return (
    <WebsiteLayout>
      <section className="page-hero">
        <h1>Reserveer een tafel</h1>
        <p>Kies je locatie en vul het formulier in.</p>
      </section>

      <div className="site-section">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="location">Locatie</label>
              <select id="location" name="location" required>
                <option value="">Kies locatie...</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="name">Naam</label>
              <input id="name" name="name" required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Telefoon</label>
              <input id="phone" name="phone" type="tel" required />
            </div>
            <div className="form-group">
              <label htmlFor="date">Datum</label>
              <input id="date" name="date" type="date" required />
            </div>
            <div className="form-group">
              <label htmlFor="time">Tijdstip</label>
              <input id="time" name="time" type="time" required />
            </div>
            <div className="form-group">
              <label htmlFor="guests">Aantal personen</label>
              <input id="guests" name="guests" type="number" min="1" max="20" defaultValue="2" required />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label htmlFor="notes">Opmerkingen / speciale wensen</label>
            <textarea id="notes" name="notes" placeholder="Allergieën, kinderstoel, etc..." />
          </div>
          <button className="button" type="submit">Reserveer aanvraag versturen</button>
          <p style={submitMessageStyle(messageKind)}>{message}</p>
        </form>
      </div>
    </WebsiteLayout>
  )
}

function OrderForm({ type }) {
  const branches = useBranches()
  const [message, setMessage] = useState('')
  const [messageKind, setMessageKind] = useState('info')

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('Versturen...')
    setMessageKind('info')

    try {
      const formData = new FormData(event.currentTarget)
      const payload = Object.fromEntries(formData.entries())
      payload.type = type

      const response = await fetch(apiUrl('/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Bestelling kon niet worden opgeslagen')
      }

      event.currentTarget.reset()
      setMessage('Bestelling opgeslagen in de database.')
      setMessageKind('success')
    } catch (err) {
      setMessage(err.message)
      setMessageKind('error')
    }
  }

  const isDelivery = type === 'delivery'

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="branch_id">Locatie</label>
          <select id="branch_id" name="branch_id" required>
            <option value="">Kies locatie...</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="name">Naam</label>
          <input id="name" name="name" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div className="form-group">
          <label htmlFor="phone">Telefoon</label>
          <input id="phone" name="phone" type="tel" required />
        </div>
        <div className="form-group">
          <label htmlFor="requested_hour">Gewenste tijd</label>
          <input id="requested_hour" name="requested_hour" type="time" required />
        </div>
        {isDelivery ? (
          <>
            <div className="form-group">
              <label htmlFor="street">Straat</label>
              <input id="street" name="street" required />
            </div>
            <div className="form-group">
              <label htmlFor="house_number">Huisnummer</label>
              <input id="house_number" name="house_number" required />
            </div>
            <div className="form-group">
              <label htmlFor="postal">Postcode</label>
              <input id="postal" name="postal" required />
            </div>
            <div className="form-group">
              <label htmlFor="municipality">Gemeente</label>
              <input id="municipality" name="municipality" required />
            </div>
          </>
        ) : null}
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label htmlFor="order_details">Bestelling</label>
        <textarea id="order_details" name="order_details" placeholder="Pizza's en aantal..." required />
        <small className="muted">De inhoud van de pizza's wordt niet opgeslagen in de database.</small>
      </div>

      <div className="form-group" style={{ marginTop: '1rem' }}>
        <label htmlFor="notes">Opmerkingen / allergieën</label>
        <textarea id="notes" name="notes" placeholder={isDelivery ? 'Verdieping, deurcode, allergieën...' : 'Extra wensen...'} />
      </div>

      <button className="button" type="submit">Bestelling plaatsen</button>
      <p style={submitMessageStyle(messageKind)}>{message}</p>
    </form>
  )
}

export function PickupOrderPage() {
  return (
    <WebsiteLayout>
      <section className="page-hero">
        <h1>Pick-up bestellen</h1>
        <p>Kies je locatie, geef je gegevens in en haal je pizza op wanneer het klaar is.</p>
      </section>

      <div className="site-section">
        <OrderForm type="pickup" />
      </div>
    </WebsiteLayout>
  )
}

export function DeliveryPage() {
  return (
    <WebsiteLayout>
      <section className="page-hero">
        <h1>Delivery bestellen</h1>
        <p>We brengen het warm tot aan je deur.</p>
      </section>

      <div className="site-section">
        <OrderForm type="delivery" />
      </div>
    </WebsiteLayout>
  )
}
