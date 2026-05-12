import { useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import DashboardLayout from '../components/DashboardLayout.jsx'
import { parseApiError } from '../lib/api.js'
import { useParams } from 'react-router-dom'

// Front-office dashboard to manage branch orders and assign drivers.
export default function FrontDashboard() {
  const { branchId } = useParams()
  const mapRef = useRef(null)
  const mapNodeRef = useRef(null)
  const markerLayerRef = useRef(null)
  const routeLayerRef = useRef(null)
  const socketRef = useRef(null)
  const driverMarkersRef = useRef(new Map())
  const driverRoutesRef = useRef(new Map())
  const orderDestinationCacheRef = useRef(new Map())
  const branchMarkerRef = useRef(null)

  const [dashboardTab, setDashboardTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [message, setMessage] = useState('')
  const [showDriverPicker, setShowDriverPicker] = useState(false)
  const [driverOptions, setDriverOptions] = useState([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState('')
  const [assigningOrderId, setAssigningOrderId] = useState(null)
  const [branch, setBranch] = useState(null)
  const [branchDrivers, setBranchDrivers] = useState([])

  const activeDeliveryStatuses = ['loaded_for_delivery', 'on_route']

  const historyStatuses = ['delivered', 'picked_up', 'on_table', 'cancelled']

  const branchCenter = useMemo(() => {
    if (branch?.latitude && branch?.longitude) {
      return [Number(branch.latitude), Number(branch.longitude)]
    }
    return [50.8503, 4.3517]
  }, [branch])

  useEffect(() => {
    loadOrders()
    loadBranch()
    loadBranchDrivers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId])

  useEffect(() => {
    if (!branchId) { return undefined }

    let mounted = true
    const socket = io()
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_vestiging', {
        vestiging_id: Number(branchId),
        user_type: 'front'
      })
    })

    socket.on('order:status_changed', (data) => {
      if (!mounted) { return }

      const orderBranchId = Number(data?.order?.branch_id)
      if (Number.isNaN(orderBranchId) || orderBranchId !== Number(branchId)) {
        return
      }

      setMessage(`Order ${data.order_id} -> ${data.status}`)
      loadOrders()

      const affectedDriverId = Number(data?.order?.driver_id)
      if (!Number.isNaN(affectedDriverId)) {
        setBranchDrivers((currentDrivers) => currentDrivers.map((driver) => {
          if (Number(driver.id) !== affectedDriverId) {
            return driver
          }

          return {
            ...driver,
            is_busy: ['loaded_for_delivery', 'on_route'].includes(data.status)
          }
        }))
      }
    })

    socket.on('driver:location_updated', (data) => {
      if (!mounted || !data?.driver_id) { return }

      setBranchDrivers((currentDrivers) => {
        const index = currentDrivers.findIndex((driver) => Number(driver.id) === Number(data.driver_id))
        if (index === -1) { return currentDrivers }

        const nextDrivers = [...currentDrivers]
        nextDrivers[index] = {
          ...nextDrivers[index],
          latitude: data.latitude,
          longitude: data.longitude,
          last_location_update: new Date().toISOString()
        }
        updateDriverMarker(nextDrivers[index])
        return nextDrivers
      })
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
  }, [branchId])

  useEffect(() => {
    if (dashboardTab !== 'drivers') { return }
    if (!mapNodeRef.current) { return }

    mapRef.current = L.map(mapNodeRef.current, { zoomControl: true }).setView(branchCenter, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapRef.current)

    markerLayerRef.current = L.layerGroup().addTo(mapRef.current)
    routeLayerRef.current = L.layerGroup().addTo(mapRef.current)

    branchMarkerRef.current = L.marker(branchCenter, {
      icon: L.divIcon({ html: '🏪', className: 'branch-marker', iconSize: [34, 34] })
    }).addTo(mapRef.current)
    branchMarkerRef.current.bindPopup(`<strong>Vestiging ${branchId}</strong>`)

    return () => {
      clearDriverMarkers()
      clearDriverRoutes()
      markerLayerRef.current?.remove()
      markerLayerRef.current = null
      routeLayerRef.current?.remove()
      routeLayerRef.current = null
      branchMarkerRef.current?.remove()
      branchMarkerRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, dashboardTab])

  useEffect(() => {
    if (!mapRef.current) { return }
    mapRef.current.setView(branchCenter, 13)
    branchMarkerRef.current?.setLatLng(branchCenter)
  }, [branchCenter])

  useEffect(() => {
    if (dashboardTab !== 'drivers') { return }
    if (!mapRef.current || !markerLayerRef.current) { return }

    clearDriverMarkers()
    clearDriverRoutes()

    let cancelled = false

    async function refreshDriverNavigation() {
      for (const driver of branchDrivers) {
        if (cancelled) { return }
        updateDriverMarker(driver)
        await updateDriverRoute(driver)
      }
    }

    refreshDriverNavigation()

    if (mapRef.current && branchDrivers.some((driver) => driver.latitude && driver.longitude)) {
      const coords = branchDrivers
        .filter((driver) => driver.latitude && driver.longitude)
        .map((driver) => [Number(driver.latitude), Number(driver.longitude)])
      if (coords.length > 0) {
        mapRef.current.fitBounds(L.latLngBounds([branchCenter, ...coords]), { padding: [30, 30] })
      }
    }

    return () => {
      cancelled = true
    }
  }, [dashboardTab, branchDrivers, branchCenter, orders])

  function clearDriverMarkers() {
    driverMarkersRef.current.forEach((marker) => marker.remove())
    driverMarkersRef.current.clear()
  }

  function clearDriverRoutes() {
    driverRoutesRef.current.forEach((route) => route.remove())
    driverRoutesRef.current.clear()
  }

  function findActiveOrderForDriver(driverId) {
    return orders.find((order) => Number(order.driver_id) === Number(driverId) && activeDeliveryStatuses.includes(order.status)) || null
  }

  async function geocodeOrderDestination(order) {
    if (!order?.id) { return null }

    const cached = orderDestinationCacheRef.current.get(Number(order.id))
    if (cached) {
      return cached
    }

    const street = order.delivery_streetName || order.delivery_streetname || ''
    const houseNumber = order.delivery_houseNumber || ''
    const postalCode = order.delivery_postalCode || ''
    const municipality = order.delivery_municipality || ''
    if (!street || !municipality) { return null }

    const query = `${street} ${houseNumber}, ${postalCode} ${municipality}, Belgium`.trim()
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`, {
        headers: {
          Accept: 'application/json'
        }
      })

      if (!response.ok) { return null }

      const matches = await response.json()
      if (!Array.isArray(matches) || matches.length === 0) { return null }

      const destination = {
        lat: Number(matches[0].lat),
        lng: Number(matches[0].lon)
      }
      orderDestinationCacheRef.current.set(Number(order.id), destination)
      return destination
    } catch (_) {
      return null
    }
  }

  function getDriverRouteTarget(driver) {
    const activeOrder = findActiveOrderForDriver(driver.id)

    if (activeOrder) {
      return {
        label: `Naar levering${activeOrder.id ? ` #${activeOrder.id}` : ''}`,
        subtitle: [activeOrder.delivery_streetName || activeOrder.delivery_streetname, activeOrder.delivery_houseNumber, activeOrder.delivery_postalCode, activeOrder.delivery_municipality].filter(Boolean).join(' ') || 'Leveradres'
      }
    }

    return {
      label: 'Terug naar branch',
      subtitle: branch?.name ? branch.name : `Vestiging ${branchId}`
    }
  }

  function updateDriverMarker(driver, routeLabel = null, routeSubtitle = null) {
    if (!mapRef.current || !markerLayerRef.current) { return }
    if (driver.latitude === null || driver.longitude === null || driver.latitude === undefined || driver.longitude === undefined) {
      return
    }

    const position = [Number(driver.latitude), Number(driver.longitude)]
    const availabilityLabel = driver.is_busy ? 'Bezig' : 'Beschikbaar'
    const availabilityClass = driver.is_busy ? 'danger' : 'success'
    const markerColor = driver.is_busy ? '#dc3545' : '#198754'
    const routeHtml = routeLabel ? `<br>Route: ${routeLabel}${routeSubtitle ? `<br><span class="text-muted">${routeSubtitle}</span>` : ''}` : ''
    const popupHtml = `<strong>${driver.name}</strong><br>Status: ${driver.status}<br>Beschikbaarheid: ${availabilityLabel}${routeHtml}<br>Bijgewerkt: ${driver.last_location_update ? new Date(driver.last_location_update).toLocaleTimeString() : '-'}`

    const existingMarker = driverMarkersRef.current.get(driver.id)
    if (existingMarker) {
      existingMarker.setLatLng(position)
      existingMarker.setPopupContent(popupHtml)
      return
    }

    const marker = L.marker(position, {
      icon: L.divIcon({
        html: `<span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:${markerColor};color:white;font-size:14px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);">🚚</span>`,
        className: `driver-marker-${availabilityClass}`,
        iconSize: [26, 26]
      })
    }).addTo(markerLayerRef.current)

    marker.bindPopup(popupHtml)
    driverMarkersRef.current.set(driver.id, marker)
  }

  async function updateDriverRoute(driver) {
    if (!mapRef.current || !routeLayerRef.current) { return }
    if (driver.latitude === null || driver.longitude === null || driver.latitude === undefined || driver.longitude === undefined) {
      const existingRoute = driverRoutesRef.current.get(driver.id)
      if (existingRoute) {
        existingRoute.remove()
        driverRoutesRef.current.delete(driver.id)
      }
      return
    }

    const currentPosition = L.latLng(Number(driver.latitude), Number(driver.longitude))
    const activeOrder = findActiveOrderForDriver(driver.id)
    const routeTargetInfo = getDriverRouteTarget(driver)

    let destination = null
    let routeColor = '#16a34a'

    if (activeOrder) {
      destination = await geocodeOrderDestination(activeOrder)
      routeColor = '#2563eb'
    } else {
      destination = L.latLng(branchCenter)
    }

    const existingRoute = driverRoutesRef.current.get(driver.id)
    if (existingRoute) {
      existingRoute.remove()
      driverRoutesRef.current.delete(driver.id)
    }

    updateDriverMarker(driver, routeTargetInfo.label, routeTargetInfo.subtitle)

    if (!destination) { return }

    const route = L.polyline([currentPosition, destination], {
      color: routeColor,
      weight: 4,
      opacity: 0.9,
      dashArray: activeOrder ? '6 8' : '4 8'
    }).addTo(routeLayerRef.current)

    route.bindPopup(`<strong>${driver.name}</strong><br>${routeTargetInfo.label}<br><span class="text-muted">${routeTargetInfo.subtitle}</span>`)
    driverRoutesRef.current.set(driver.id, route)
  }

  async function loadBranch() {
    try {
      const response = await fetch(`/api/branch/${branchId}`)
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      const data = await response.json()
      setBranch(data)
    } catch (err) {
      setMessage(err.message)
    }
  }

  async function loadBranchDrivers() {
    try {
      const response = await fetch(`/api/drivers/selection/branch/${branchId}`)
      if (!response.ok) {
        throw new Error(await parseApiError(response))
      }

      const drivers = await response.json()
      setBranchDrivers((currentDrivers) => {
        const currentById = new Map(currentDrivers.map((driver) => [Number(driver.id), driver]))
        return drivers.map((driver) => {
          const existingDriver = currentById.get(Number(driver.id))
          if (!existingDriver) {
            return driver
          }

          return {
            ...driver,
            latitude: existingDriver.latitude ?? driver.latitude,
            longitude: existingDriver.longitude ?? driver.longitude,
            last_location_update: existingDriver.last_location_update ?? driver.last_location_update
          }
        })
      })
    } catch (err) {
      setMessage(err.message)
      setBranchDrivers([])
      clearDriverMarkers()
    }
  }

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
      await loadBranchDrivers()
    } catch (err) {
      setMessage(err.message)
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') { return true }
    if (activeTab === 'history') { return historyStatuses.includes(order.status) }
    return order.status === activeTab
  })

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
    <DashboardLayout
      title={`Front Dashboard (branch ${branchId})`}
      subtitle="Bestellingen beheren en drivers toewijzen"
    >
      <div className="btn-group mb-3" role="group" aria-label="dashboard tabs">
        <button
          className={`btn btn-${dashboardTab === 'orders' ? 'primary' : 'outline-primary'}`}
          onClick={() => setDashboardTab('orders')}
        >
          Orders
        </button>
        <button
          className={`btn btn-${dashboardTab === 'drivers' ? 'primary' : 'outline-primary'}`}
          onClick={() => setDashboardTab('drivers')}
        >
          Driver live map
        </button>
      </div>

      {message ? <div className="alert alert-info py-2">{message}</div> : null}

      {dashboardTab === 'drivers' ? (
        <>
          <div className="card shadow-sm mb-3">
            <div className="card-body p-0">
              <div ref={mapNodeRef} style={{ height: '320px', width: '100%', borderRadius: '0.375rem' }} />
            </div>
          </div>

          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-8">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Live driver map</h5>
                    <button className="btn btn-sm btn-outline-secondary" type="button" onClick={loadBranchDrivers}>
                      Refresh drivers
                    </button>
                  </div>
                  <div className="text-muted small mb-2">
                    {branch ? `${branch.name} · ${branch.address}` : 'Branch wordt geladen...'}
                  </div>
                  <div className="small">
                    Online drivers: <strong>{branchDrivers.length}</strong>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="mb-3">Online drivers</h5>
                  {branchDrivers.length === 0 ? (
                    <div className="text-muted">Geen online drivers gevonden.</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {branchDrivers.map((driver) => (
                        <li key={driver.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                          <div>
                            <div>{driver.name}</div>
                            <div className="text-muted small">
                              {getDriverRouteTarget(driver).label} · {getDriverRouteTarget(driver).subtitle}
                            </div>
                          </div>
                          {driver.latitude === null || driver.longitude === null || driver.latitude === undefined || driver.longitude === undefined ? (
                            <span className="badge text-bg-secondary">Geen GPS</span>
                          ) : driver.is_busy ? (
                            <span className="badge text-bg-danger">Bezig</span>
                          ) : (
                            <span className="badge text-bg-success">Beschikbaar</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {dashboardTab === 'orders' ? (
        <>
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex gap-2 flex-wrap align-items-end">
              <button className="btn btn-outline-secondary" type="button" onClick={loadOrders}>Refresh</button>
            </div>
          </div>

          <div className="btn-group mb-3" role="group" aria-label="order tabs">
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
        </>
      ) : null}
    </DashboardLayout>
  )
}
