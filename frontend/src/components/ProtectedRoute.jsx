/**
 * PROTECTED ROUTE COMPONENT
 * Auteur: GitHub Copilot
 * Doel: Route guard voor authenticated routes
 */

import { Navigate } from 'react-router-dom'
import { getSession } from '../lib/session.js'

// Route guard: only allow users with a valid session (and optional role).
export default function ProtectedRoute({ role, children }) {
  const session = getSession()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role && session.role !== role) {
    return <Navigate to="/login" replace />
  }

  return children
}
