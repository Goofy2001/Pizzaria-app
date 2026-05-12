import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { apiUrl } from '../lib/config.js'
import { parseApiError } from '../lib/api.js'

// Driver page that only shows completed/cancelled history orders.
export default function DriverHistoryWindow() {
  const { driverId } = useParams()
  const navigate = useNavigate()
  // History data + UI feedback.
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')
  const historyStatuses = ['delivered', 'picked_up', 'on_table', 'cancelled']

  // Reload history when driver changes.
  useEffect(() => {
    loadHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverId])

  // Fetch all orders for driver, then keep only history statuses.
  async function loadHistory() {
    try {
      const response = await fetch(apiUrl(`/api/orders/drivers/${driverId}`))
      if (response.status === 404) {
        setOrders([])
        return
      }
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      const data = await response.json()
      setOrders(data.filter((order) => historyStatuses.includes(order.status)))
    } catch (err) {
      setMessage(err.message)
      setOrders([])
    }
  }

  return (
    // Simple table view for historical deliveries.
    <DashboardLayout
      title={`Driver History (driver ${driverId})`}
      subtitle="Historische bestellingen"
    >
      {message ? <div className="alert alert-info py-2">{message}</div> : null}

      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary" type="button" onClick={loadHistory}>Refresh history</button>
          <button className="btn btn-outline-primary" type="button" onClick={() => navigate(`/driver/${driverId}`)}>
            Terug naar dashboard
          </button>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Klant</th>
                <th>Status</th>
                <th>Adres</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-4">Geen historische bestellingen.</td></tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td><span className="badge text-bg-secondary">{order.status}</span></td>
                    <td>{order.delivery_streetName || order.delivery_streetname || '-'} {order.delivery_houseNumber || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
