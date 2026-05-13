import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import FrontDashboard from './pages/FrontDashboard.jsx'
import DriverDashboard from './pages/DriverDashboard.jsx'
import DriverHistoryWindow from './pages/DriverHistoryWindow.jsx'
import DriverNavigationPage from './pages/DriverNavigationPage.jsx'
import {
  DeliveryPage,
  PickupOrderPage,
  ReserveTablePage,
  WebsiteContactPage,
  WebsiteHomePage,
  WebsiteLocationsPage,
  WebsiteMenuPage
} from './pages/WebsitePages.jsx'
import { getSession } from './lib/session.js'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Decides where the user lands when opening '/'.
function HomeRedirect() {
  const session = getSession()

  if (!session) {
    return <Navigate to="/website" replace />
  }

  if (session.role === 'front') {
    return <Navigate to={`/front/${session.branch_id}`} replace />
  }

  return <Navigate to={`/driver/${session.driver_id}`} replace />
}

// Main app router: maps URLs to pages and protects role-specific routes.
function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/website" element={<WebsiteHomePage />} />
      <Route path="/website/menu" element={<WebsiteMenuPage />} />
      <Route path="/website/locations" element={<WebsiteLocationsPage />} />
      <Route path="/website/contact" element={<WebsiteContactPage />} />
      <Route path="/website/reserve" element={<ReserveTablePage />} />
      <Route path="/website/pickup" element={<PickupOrderPage />} />
      <Route path="/website/delivery" element={<DeliveryPage />} />
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
