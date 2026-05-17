/**
 * APP ROUTER COMPONENT
 * Doel: Hoofd routing component met protected routes
 */

//importeren van de nodige functies
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import FrontDashboard from './pages/FrontDashboard.jsx'
import DriverDashboard from './pages/DriverDashboard.jsx'
import DriverHistoryWindow from './pages/DriverHistoryWindow.jsx'
import DriverNavigationPage from './pages/DriverNavigationPage.jsx'
import { getSession } from './lib/session.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'

//functie voor het navigeren naar de hoofdpagina
function HomeRedirect() {
  const session = getSession() //zoek key-value pair

  if (!session) { //geen sessie --> ga login
    return <Navigate to="/login" replace />
  }

  if (session.role === 'front') { //sessie front --> ga naar front dashboard
    return <Navigate to={`/front/${session.branch_id}`} replace />
  }

  return <Navigate to={`/driver/${session.driver_id}`} replace /> //sessie gevonden --> driver dashboard
}

// Main app router

/* routes bundeld alle routes
--> route: route naar iets
--> path: url vanaf de hoofdurl
--> element: functie dat pagina definieerd
--> protectedRoute: route met protection (localStorage) 
*/

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} /> 
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/front/:branchId"
        element={<ProtectedRoute role="front"><FrontDashboard /></ProtectedRoute>}
      />
      <Route
        path="/driver/:driverId"
        element={<ProtectedRoute role="driver"><DriverDashboard /></ProtectedRoute>}
      />
      <Route
        path="/driver/:driverId/history"
        element={<ProtectedRoute role="driver"><DriverHistoryWindow /></ProtectedRoute>}
      />
      <Route
        path="/driver/:driverId/nav/:orderId"
        element={<ProtectedRoute role="driver"><DriverNavigationPage /></ProtectedRoute>}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
