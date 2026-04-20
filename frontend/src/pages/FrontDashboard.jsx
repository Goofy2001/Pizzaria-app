import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { parseApiError } from '../lib/api.js'
import { useParams } from 'react-router-dom'

// Front-office dashboard to manage branch orders and assign drivers.
export default function FrontDashboard() {
  const { branchId } = useParams()
  // Main page state.
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [message, setMessage] = useState('')
  const [showDriverPicker, setShowDriverPicker] = useState(false)
  const [driverOptions, setDriverOptions] = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [assigningOrderId, setAssigningOrderId] = useState(null)

  const historyStatuses = ['delivered', 'picked_up', 'on_table', 'cancelled']

  // Load data whenever we open a different branch dashboard.
  useEffect(() => {
    loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  // Fetch all orders for this branch.
  async function loadOrders() {
    try {
      const response = await fetch(`/api/orders/branch/${branchId}`)
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }
      const data = await response.json()
      setOrders(data)
      setMessage(`${data.length} orders geladen`)
    } catch (err) {
      setMessage(err.message)
    }
  }

  // Generic helper to move an order to the next status.
  async function updateStatus(orderId, newStatus) {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      setMessage(`Order ${orderId} aangepast naar ${newStatus}`)
      await loadOrders()
    } catch (err) {
      setMessage(err.message)
    }
  }

  // Open assignment UI and fetch online drivers for this branch.
  async function openDriverPicker(orderId) {
    setAssigningOrderId(orderId)
    setSelectedDriverId('')
    setShowDriverPicker(true)
    setLoadingDrivers(true)

    try {
      const response = await fetch(`/api/drivers/selection/branch/${branchId}`)
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      const drivers = await response.json()
      setDriverOptions(drivers)
      if (drivers.length === 0) {
        setMessage('Geen online drivers beschikbaar voor deze vestiging')
      }
    } catch (err) {
      setMessage(err.message)
      setShowDriverPicker(false)
    } finally {
      setLoadingDrivers(false)
    }
  }

  // Send selected driver assignment to backend.
  async function assignDriverToOrder() {
    if (!assigningOrderId || !selectedDriverId) {
      setMessage('Selecteer eerst een driver')
      return
    }

    const selectedDriver = driverOptions.find((driver) => Number(driver.id) === Number(selectedDriverId))
    if (selectedDriver && selectedDriver.is_busy) {
      setMessage(`${selectedDriver.name} is al bezig met een delivery`)
      return
    }

    try {
      const response = await fetch(`/api/orders/${assigningOrderId}/assign-driver`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: Number(selectedDriverId) })
      })

      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      const driverName = selectedDriver ? selectedDriver.name : `#${selectedDriverId}`
      setMessage(`Driver ${driverName} toegewezen aan order ${assigningOrderId}`)
      setShowDriverPicker(false)
      setAssigningOrderId(null)
      await loadOrders()
    } catch (err) {
      setMessage(err.message)
    }
  }

  // Build the list shown in the table based on active tab.
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') { return true }
    if (activeTab === 'history') { return historyStatuses.includes(order.status) }
    return order.status === activeTab
  })

  // Render the correct action button for each order row.
  function renderAction(order) {
    const isPickupOrder = order.type === 'pick-up' || order.type === 'pickup'
    const isInHouseOrder = order.type === 'inHouse' || order.type === 'inhouse'

    if (order.status === 'pending') {
      return <button className="btn btn-sm btn-outline-primary" onClick={() => updateStatus(order.id, 'paid')}>Mark paid</button>
    }
    if (order.status === 'paid') {
      return <button className="btn btn-sm btn-outline-primary" onClick={() => updateStatus(order.id, 'preparing')}>Start preparing</button>
    }
    if (order.status === 'preparing') {
      return <button className="btn btn-sm btn-outline-primary" onClick={() => updateStatus(order.id, 'ready')}>Mark ready</button>
    }
    if (order.status === 'ready' && isPickupOrder) {
      return <button className="btn btn-sm btn-outline-success" onClick={() => updateStatus(order.id, 'picked_up')}>Mark picked up</button>
    }
    if (order.status === 'ready' && isInHouseOrder) {
      return <button className="btn btn-sm btn-outline-success" onClick={() => updateStatus(order.id, 'on_table')}>Put on table</button>
    }
    if (order.status === 'ready' && order.type === 'delivery') {
      return <button className="btn btn-sm btn-outline-warning" onClick={() => openDriverPicker(order.id)}>Assign driver</button>
    }
    return <span className="text-muted">-</span>
  }

  return (
    // Main dashboard UI: controls, table, and optional driver picker panel.
    <DashboardLayout
      title={`Front Dashboard (branch ${branchId})`}
      subtitle="Bestellingen beheren en drivers toewijzen"
    >
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2 flex-wrap align-items-end">
          <button className="btn btn-outline-secondary" type="button" onClick={loadOrders}>Refresh</button>
        </div>
      </div>

      {message ? <div className="alert alert-info py-2">{message}</div> : null}

      <div className="btn-group mb-3" role="group" aria-label="tabs">
        <button className={`btn btn-${activeTab === 'all' ? 'primary' : 'outline-primary'}`} onClick={() => setActiveTab('all')}>Alle</button>
        <button className={`btn btn-${activeTab === 'pending' ? 'primary' : 'outline-primary'}`} onClick={() => setActiveTab('pending')}>Pending</button>
        <button className={`btn btn-${activeTab === 'paid' ? 'primary' : 'outline-primary'}`} onClick={() => setActiveTab('paid')}>Paid</button>
        <button className={`btn btn-${activeTab === 'preparing' ? 'primary' : 'outline-primary'}`} onClick={() => setActiveTab('preparing')}>Preparing</button>
        <button className={`btn btn-${activeTab === 'ready' ? 'primary' : 'outline-primary'}`} onClick={() => setActiveTab('ready')}>Ready</button>
        <button className={`btn btn-${activeTab === 'history' ? 'primary' : 'outline-primary'}`} onClick={() => setActiveTab('history')}>History</button>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Driver</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4">Geen orders</td></tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.customer_name}</td>
                    <td>{order.type}</td>
                    <td>{order.driver_name || '-'}</td>
                    <td><span className="badge text-bg-secondary">{order.status}</span></td>
                    <td>{renderAction(order)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDriverPicker ? (
        <div className="card shadow-sm mt-3 border-warning">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Selecteer driver voor order #{assigningOrderId}</h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDriverPicker(false)}>Sluiten</button>
            </div>

            {loadingDrivers ? (
              <div className="text-muted">Drivers laden...</div>
            ) : driverOptions.length === 0 ? (
              <div className="alert alert-warning py-2 mb-0">Geen online drivers beschikbaar.</div>
            ) : (
              <>
                <div className="list-group mb-3">
                  {driverOptions.map((driver) => (
                    <button
                      key={driver.id}
                      type="button"
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${driver.is_busy ? 'text-muted bg-light' : ''} ${Number(selectedDriverId) === Number(driver.id) ? 'active' : ''}`}
                      onClick={() => !driver.is_busy && setSelectedDriverId(String(driver.id))}
                      disabled={driver.is_busy}
                    >
                      <span>{driver.name}</span>
                      <span className={`badge ${driver.is_busy ? 'text-bg-secondary' : 'text-bg-success'}`}>
                        {driver.is_busy ? 'Bezig' : 'Beschikbaar'}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={assignDriverToOrder}
                  disabled={!selectedDriverId}
                >
                  Bevestig toewijzing
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  )
}
