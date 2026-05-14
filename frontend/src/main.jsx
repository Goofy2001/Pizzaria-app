/**
 * APP ENTRY POINT
 * Auteur: GitHub Copilot
 * Doel: React app bootstrap en DOM mounting
 */

// App bootstrap: load React app into the root DOM element.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { initTheme } from './lib/theme.js'
import App from './App.jsx'

// Wrap app with StrictMode + BrowserRouter so all pages can use React Router.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Initialize theme early so CSS class is present before React paints
try {
  initTheme()
} catch (_) {
  // ignore
}
