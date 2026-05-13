import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { parseApiError } from '../lib/api.js'
import { apiUrl } from '../config/api.js'

// Driver dashboard: shows active orders and delivery actions.
export default function DriverDashboard() {
  const { driverId } = useParams()
  const navigate = useNavigate()
  // Core page state.
  const [driver, setDriver] = useState(null)
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')
  const socketRef = useRef(null)
  const historyStatuses = ['delivered', 'picked_up', 'on_table', 'cancelled']

  // Setup socket listeners and initial data load for this driver.
  useEffect(() => {
    let mounted = true
    const socket = io()
    socketRef.current = socket

    loadDriver()
    loadOrders()

    socket.on('driver:delivery_started', (data) => {
      if (!mounted) { return }
      setMessage(data.message)
      loadOrders()
    })

    socket.on('driver:delivery_ended', (data) => {
      if (!mounted) { return }
      setMessage(data.message)
      loadOrders()
    })

    socket.on('order:status_changed', (data) => {
      if (!mounted) { return }
      if (data.order && Number(data.order.driver_id) === Number(driverId)) {
        setMessage(`Order ${data.order_id} -> ${data.status}`)
        loadOrders()
      }
    })

    socket.on('error', (data) => {
      if (!mounted) { return }
      setMessage(data?.message || 'Socket error')
    })

    return () => {
      mounted = false
      socket.disconnect()
      socketRef.current = null
    }
  }, [driverId])

  // Fetch driver profile info.
  async function loadDriver() {
    try {
      const response = await fetch(apiUrl(`/drivers/${driverId}`))
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }
      const data = await response.json()
      setDriver(data)
    } catch (err) {
      setMessage(err.message)
    }
  }

  // Fetch all orders linked to this driver.
  async function loadOrders() {
    try {
      const response = await fetch(apiUrl(`/orders/drivers/${driverId}`))
      if (response.status === 404) {
        setOrders([])
        return
      }
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }
      const data = await response.json()
      setOrders(data)
    } catch (err) {
      setOrders([])
      setMessage(err.message)
    }
  }

  // Convert order address into latitude/longitude for navigation page.
  async function geocodeOrderDestination(order) {
    const street = order.delivery_streetName || order.delivery_streetname || ''
    const houseNumber = order.delivery_houseNumber || ''
    const postalCode = order.delivery_postalCode || ''
    const municipality = order.delivery_municipality || ''
    const query = `${street} ${houseNumber}, ${postalCode} ${municipality}, Belgium`.trim()

    if (!street || !municipality) { return null }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json'
      }
    })
    if (!response.ok) { return null }

    const matches = await response.json()
    if (!Array.isArray(matches) || matches.length === 0) { return null }

    return {
      lat: Number(matches[0].lat),
      lng: Number(matches[0].lon)
    }
  }

  async function geocodeAddress(address) {
    if (!address) { return null }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(`${address}, Belgium`)}`,
      {
        headers: {
          Accept: 'application/json'
        }
      }
    )

    if (!response.ok) { return null }

    const matches = await response.json()
    if (!Array.isArray(matches) || matches.length === 0) { return null }

    return {
      lat: Number(matches[0].lat),
      lng: Number(matches[0].lon)
    }
  }

  // Open in-app navigation page and pass needed order/driver context.
  async function openNavigationWindow(order = null) {
    const isBranchReturn = !order
    const params = new URLSearchParams()
    params.set('driver_id', String(driverId))
    params.set('order_id', String(order?.id || 0))
    if (driver?.branch_id) {
      params.set('branch_id', String(driver.branch_id))
    }

    try {
      if (isBranchReturn) {
        params.set('customer_name', 'Terug naar branch')

        if (driver?.branch_id) {
          const branchResponse = await fetch(apiUrl(`/branch/${driver.branch_id}`))
          if (branchResponse.ok) {
            const branch = await branchResponse.json()
            params.set('customer_name', `Terug naar ${branch.name || 'branch'}`)
            params.set('delivery_street', branch.address || '')
            params.set('delivery_house_number', '')
            params.set('delivery_postal_code', '')
            params.set('delivery_municipality', '')

            const destination = await geocodeAddress(branch.address)
            if (destination) {
              params.set('dest_lat', String(destination.lat))
              params.set('dest_lng', String(destination.lng))
            }
          }
        }
      } else {
        params.set('customer_name', order.customer_name || '')
        params.set('delivery_street', order.delivery_streetName || order.delivery_streetname || '')
        params.set('delivery_house_number', String(order.delivery_houseNumber || ''))
        params.set('delivery_postal_code', String(order.delivery_postalCode || ''))
        params.set('delivery_municipality', order.delivery_municipality || '')

        const destination = await geocodeOrderDestination(order)
        if (destination) {
          params.set('dest_lat', String(destination.lat))
          params.set('dest_lng', String(destination.lng))
        }
      }
    } catch (_) {
      // fallback zonder destination coords
    }

    navigate(`/driver/${driverId}/nav/${order?.id || 0}?${params.toString()}`)
  }

  // Trigger backend event to start delivery, then open navigation page.
  async function startDelivery(order) {
    if (!socketRef.current) {
      setMessage('Socket niet verbonden')
      return
    }

    socketRef.current.emit('driver:start_delivery', {
      bestelling_id: order.id,
      driver_id: Number(driverId)
    })

    await openNavigationWindow(order)
  }

  // Trigger backend event to finish delivery.
  function endDelivery(orderId) {
    if (!socketRef.current) {
      setMessage('Socket niet verbonden')
      return
    }

    socketRef.current.emit('driver:end_delivery', {
      bestelling_id: orderId,
      driver_id: Number(driverId)
    })
  }

  // Open separate history window for completed orders.
  function openHistoryWindow() {
    navigate(`/driver/${driverId}/history`)
  }

  // Derived lists used by the UI.
  const activeOrders = orders.filter((order) => !historyStatuses.includes(order.status))
  const navigationOrder = activeOrders.find((order) => order.status === 'loaded_for_delivery' || order.status === 'on_route')

  return (
    // Main dashboard UI with quick actions + active order cards.
    <DashboardLayout
      title={`Driver Dashboard (driver ${driverId})`}
      subtitle={driver ? `${driver.name} · Branch ${driver.branch_id} · ${driver.status}` : 'Driver info laden...'}
    >
      {message ? <div className="alert alert-info py-2">{message}</div> : null}

      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary" type="button" onClick={loadOrders}>Refresh orders</button>
          <button className="btn btn-outline-dark" type="button" onClick={openHistoryWindow}>Open history</button>
          <button
            className="btn btn-outline-primary"
            type="button"
            onClick={() => openNavigationWindow(navigationOrder)}
          >
            Open navigatie{navigationOrder ? '' : ' naar branch'}
          </button>
        </div>
      </div>

      <div className="row g-3">
        {activeOrders.length === 0 ? (
          <div className="col-12">
            <div className="card shadow-sm"><div className="card-body">Geen actieve orders voor deze driver.</div></div>
          </div>
        ) : (
          activeOrders.map((order) => (
            <div className="col-12 col-md-6" key={order.id}>
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title mb-2">Order #{order.id}</h5>
                  <p className="mb-1"><strong>Klant:</strong> {order.customer_name}</p>
                  <p className="mb-1"><strong>Status:</strong> <span className="badge text-bg-secondary">{order.status}</span></p>
                  <p className="mb-3"><strong>Adres:</strong> {order.delivery_streetname || order.delivery_streetName || '-'} {order.delivery_houseNumber || ''}</p>

                  {order.status === 'loaded_for_delivery' ? (
                    <button className="btn btn-success btn-sm" onClick={() => startDelivery(order)}>Start delivery</button>
                  ) : null}

                  {order.status === 'on_route' ? (
                    <button className="btn btn-primary btn-sm" onClick={() => endDelivery(order.id)}>End delivery</button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  )
}
