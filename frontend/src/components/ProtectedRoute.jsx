/**
 * PROTECTED ROUTE COMPONENT
 * Doel: Route guard voor authenticated routes
 */

import { Navigate } from 'react-router-dom'
import { getSession } from '../lib/session.js'

// Route guard: only allow users with a valid session (and optional role).
export default function ProtectedRoute({ role, children }) {
  const session = getSession() //zoek session gegevens
  if (!session) { //geen gegevens
    return <Navigate to="/login" replace />
  }

  if (role && session.role !== role) { //is rol aanwezig en niet gelijk aan de session rol
    return <Navigate to="/login" replace />
  }

  return children // rol aanwezig en gelijk aan session rol
}
