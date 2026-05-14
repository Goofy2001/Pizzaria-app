/**
 * DRIVER NAVIGATION PAGE
 * Auteur: GitHub Copilot
 * Doel: Full-screen kaart voor real-time navigatie tijdens deliveries
 * Beschrijving:
 * - Leaflet.js kaart met routing machine
 * - Socket.IO real-time order updates
 * - GPS tracking van driver
 * - Route planning
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import { apiUrl, getSocketServerUrl } from '../config/api.js'

// Full-screen map page used during an active delivery.
function DriverNavigationPage() {
  const { driverId, orderId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const userMarkerRef = useRef(null)
  const destinationMarkerRef = useRef(null)
  const routingRef = useRef(null)
  const trailRef = useRef(null)
  const socketRef = useRef(null)
  const watchIdRef = useRef(null)
  const currentPositionRef = useRef(null)
  const destinationRef = useRef(null)
  const isMountedRef = useRef(true)
  const routeSyncedRef = useRef(false)

  // UI state for route metrics and delivery completion.
  const [eta, setEta] = useState('-- min')
  const [distance, setDistance] = useState('-- km')
  const [gpsStatus, setGpsStatus] = useState('GPS wordt opgestart...')
  const [gpsTone, setGpsTone] = useState('warn')
  const [routeReady, setRouteReady] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [panelExpanded, setPanelExpanded] = useState(false)

  const customerName = searchParams.get('customer_name') || 'Onbekend'
  const street = searchParams.get('delivery_street') || ''
  const houseNumber = searchParams.get('delivery_house_number') || ''
  const postalCode = searchParams.get('delivery_postal_code') || ''
  const municipality = searchParams.get('delivery_municipality') || ''
  const branchId = searchParams.get('branch_id') || ''
  const appOrigin = searchParams.get('app_origin') || window.location.origin
  const isBranchReturn = Number(orderId) === 0

  // Human-readable address string from query params.
  const addressLabel = useMemo(() => {
    return [street, houseNumber, postalCode, municipality].filter(Boolean).join(' ') || 'Adres niet meegegeven'
  }, [street, houseNumber, postalCode, municipality])

  function setGpsState(tone, text) {
    setGpsTone(tone)
    setGpsStatus(text)
  }

  function setTrailFromPoints(points) {
    if (!mapRef.current) { return }

    if (trailRef.current) {
      trailRef.current.remove()
      trailRef.current = null
    }

    if (!Array.isArray(points) || points.length < 2) {
      return
    }

    trailRef.current = L.polyline(points, {
      color: '#0ea5e9',
      weight: 4,
      opacity: 0.7,
      dashArray: '3 6'
    }).addTo(mapRef.current)
  }

  async function loadRecentTrackedLocations() {
    try {
      const response = await fetch(apiUrl(`/drivers/${driverId}/locations?limit=10`))
      if (!response.ok) { return }
      const rows = await response.json()
      const ordered = [...rows].reverse()
      const points = ordered
        .filter((row) => row.latitude !== null && row.longitude !== null)
        .map((row) => [Number(row.latitude), Number(row.longitude)])

      setTrailFromPoints(points)
    } catch (_) {
      // Ignore tracking load errors; live navigation continues.
    }
  }

  // Rebuild navigation route whenever current position + destination are known.
  function syncRoute() {
    const current = currentPositionRef.current
    const destination = destinationRef.current

    if (!current || !destination || !mapRef.current) {
      return
    }

    // Only sync route once
    if (routeSyncedRef.current) {
      return
    }

    if (routingRef.current) {
      try {
        mapRef.current.removeControl(routingRef.current)
      } catch (_) {
        // ignore
      }
    }

    routingRef.current = L.Routing.control({
      waypoints: [current, destination],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      }),
      lineOptions: {
        styles: [{ color: '#2563eb', opacity: 0.9, weight: 6 }]
      },
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      showAlternatives: false,
      show: false,
      createMarker: () => null
    }).addTo(mapRef.current)

    routingRef.current.on('routesfound', (e) => {
      const summary = e.routes[0].summary
      const distanceKm = (summary.totalDistance / 1000).toFixed(1)
      const timeMin = Math.max(1, Math.round(summary.totalTime / 60))
      setDistance(`${distanceKm} km`)
      setEta(`${timeMin} min`)
      setRouteReady(true)
      setGpsState('ok', 'Route actief en GPS verbonden')
      routeSyncedRef.current = true
    })

    routingRef.current.on('routingerror', () => {
      setGpsState('bad', 'Route kon niet worden opgebouwd')
    })
  }

  // Geocode address text to destination coordinates.
  async function geocodeDestination() {
    if (!street || !municipality) {
      setGpsState('warn', 'Geen volledig leveradres meegegeven')
      return
    }

    const query = `${street} ${houseNumber}, ${postalCode} ${municipality}, Belgium`.trim()
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        {
          headers: { Accept: 'application/json' }
        }
      )

      if (!response.ok) {
        setGpsState('warn', 'Adres kon niet worden gegeocodeerd')
        return
      }

      const matches = await response.json()
      if (Array.isArray(matches) && matches.length > 0) {
        destinationRef.current = L.latLng(Number(matches[0].lat), Number(matches[0].lon))
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.setLatLng(destinationRef.current)
        } else {
          destinationMarkerRef.current = L.marker(destinationRef.current, {
            icon: L.divIcon({ html: '📍', className: 'dest-marker', iconSize: [36, 36] })
          }).addTo(mapRef.current)
        }
        destinationMarkerRef.current.bindPopup(`<strong>Leveradres</strong><br>${addressLabel}`)
        if (currentPositionRef.current) {
          syncRoute()
          mapRef.current.fitBounds(L.latLngBounds([currentPositionRef.current, destinationRef.current]), { padding: [30, 30] })
        }
      } else {
        setGpsState('warn', 'Adres niet gevonden op kaart')
      }
    } catch (error) {
      console.error('Geocode error:', error)
      setGpsState('bad', 'Geocoding mislukt')
    }
  }

  // Prefer destination coords from query; fallback to geocoding.
  async function loadDestinationFromQuery() {
    const destLat = searchParams.get('dest_lat')
    const destLng = searchParams.get('dest_lng')
    if (destLat && destLng) {
      destinationRef.current = L.latLng(Number(destLat), Number(destLng))
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng(destinationRef.current)
      } else if (mapRef.current) {
        destinationMarkerRef.current = L.marker(destinationRef.current, {
          icon: L.divIcon({ html: '📍', className: 'dest-marker', iconSize: [36, 36] })
        }).addTo(mapRef.current)
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.bindPopup(`<strong>Leveradres</strong><br>${addressLabel}`)
      }

      if (currentPositionRef.current) {
        syncRoute()
        mapRef.current?.fitBounds(L.latLngBounds([currentPositionRef.current, destinationRef.current]), { padding: [30, 30] })
      }
    } else {
      await geocodeDestination()
    }
  }

  // Notify backend that this delivery is complete.
  function completeDelivery() {
    if (isBranchReturn) {
      return
    }

    if (!socketRef.current) {
      return
    }

    setIsCompleting(true)
    socketRef.current.emit('driver:end_delivery', {
      bestelling_id: Number(orderId),
      driver_id: Number(driverId)
    })
  }

  // Setup map, socket listeners, GPS tracking, and cleanup.
  useEffect(() => {
    isMountedRef.current = true

    mapRef.current = L.map(mapNodeRef.current, { zoomControl: true }).setView([50.8503, 4.3517], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(mapRef.current)

    userMarkerRef.current = L.marker([50.8503, 4.3517], {
      icon: L.divIcon({ html: '🚚', className: 'user-marker', iconSize: [36, 36] })
    }).addTo(mapRef.current)

    socketRef.current = io(getSocketServerUrl(), { path: '/socket.io' })

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join_vestiging', {
        vestiging_id: Number(branchId || 1),
        user_type: 'driver',
        driver_id: Number(driverId)
      })
      setGpsState('warn', 'Verbonden met server')
    })

    socketRef.current.on('driver:delivery_ended', (data) => {
      setIsCompleting(false)
      alert(data?.message || 'Bestelling afgeleverd!')
      navigate(`/driver/${driverId}`)
    })

    socketRef.current.on('error', (data) => {
      setIsCompleting(false)
      alert(data?.message || 'Er ging iets fout tijdens communicatie met de server.')
    })

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMountedRef.current) { return }

          currentPositionRef.current = L.latLng(position.coords.latitude, position.coords.longitude)
          userMarkerRef.current?.setLatLng(currentPositionRef.current)

          socketRef.current?.emit('driver:update_location', {
            driver_id: Number(driverId),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          })

          if (trailRef.current) {
            const currentPoints = trailRef.current.getLatLngs().map((latLng) => [latLng.lat, latLng.lng])
            const nextPoints = [...currentPoints, [position.coords.latitude, position.coords.longitude]].slice(-120)
            setTrailFromPoints(nextPoints)
          }

          // Attempt to sync route once when destination is available
          if (destinationRef.current && !routeSyncedRef.current) {
            syncRoute()
          }

          setGpsState('ok', 'GPS verbonden')
        },
        (error) => {
          console.error('GPS error:', error)
          setGpsState('bad', `GPS fout: ${error.message}`)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    } else {
      setGpsState('bad', 'GPS niet ondersteund op dit toestel')
    }

    loadDestinationFromQuery()
    loadRecentTrackedLocations()

    return () => {
      isMountedRef.current = false
      if (watchIdRef.current !== null) {
        navigator.geolocation?.clearWatch(watchIdRef.current)
      }
      socketRef.current?.disconnect()
      socketRef.current = null
      if (routingRef.current && mapRef.current) {
        try {
          mapRef.current.removeControl(routingRef.current)
        } catch (_) {
          // ignore
        }
      }
      trailRef.current?.remove()
      trailRef.current = null
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [addressLabel, branchId, driverId, navigate, orderId])

  // Initial route sync when both position and destination are available
  useEffect(() => {
    if (destinationRef.current && currentPositionRef.current && !routeSyncedRef.current) {
      syncRoute()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinationRef])

  return (
    // Map-focused view with collapsible control panel
    <main className="position-relative" style={{ minHeight: '100vh' }}>
      <div ref={mapNodeRef} style={{ position: 'fixed', inset: 0 }} />

      {/* Compact header - always visible */}
      <div className="position-fixed top-0 start-0 end-0 p-2" style={{ zIndex: 1000, backgroundColor: 'rgba(255, 255, 255, 0.92)' }}>
        <div className="d-flex justify-content-between align-items-center gap-2">
          <div className="flex-grow-1">
            <div className="small text-muted mb-1">{isBranchReturn ? 'Terug naar branch' : `Order #${orderId}`}</div>
            <div className="fw-bold" style={{ fontSize: '1.1rem' }}>{eta} · {distance}</div>
          </div>
          <button 
            className={`btn btn-sm ${panelExpanded ? 'btn-primary' : 'btn-outline-primary'}`}
            type="button" 
            onClick={() => setPanelExpanded(!panelExpanded)}
            title={panelExpanded ? 'Minimaliseren' : 'Uitvouwen'}
          >
            {panelExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {/* Expanded panel - only shown when toggled */}
      {panelExpanded && (
        <div className="position-fixed top-0 start-0 end-0 p-3" style={{ zIndex: 999, marginTop: '52px', maxHeight: 'calc(100vh - 52px)', overflowY: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.98)' }}>
          <div className="pb-3">
            <div className="mb-3">
              <small className="text-muted d-block mb-1">Klant</small>
              <div className="fw-bold">{customerName}</div>
            </div>

            <div className="mb-3">
              <small className="text-muted d-block mb-1">Leveradres</small>
              <div>{addressLabel}</div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="p-2 rounded bg-light border text-center">
                  <div className="text-uppercase text-muted" style={{ fontSize: '0.75rem' }}>ETA</div>
                  <div className="fw-bold">{eta}</div>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 rounded bg-light border text-center">
                  <div className="text-uppercase text-muted" style={{ fontSize: '0.75rem' }}>Afstand</div>
                  <div className="fw-bold">{distance}</div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 mb-3 p-2 rounded bg-light">
              <span className={`badge text-bg-${gpsTone === 'ok' ? 'success' : gpsTone === 'bad' ? 'danger' : 'warning'}`}>
                {gpsTone === 'ok' ? 'Online' : gpsTone === 'bad' ? 'Probleem' : 'Bezig'}
              </span>
              <span className="text-muted small flex-grow-1">{gpsStatus}</span>
            </div>

            <div className="d-grid gap-2">
              <button className="btn btn-sm btn-primary" type="button" onClick={() => mapRef.current?.setView(currentPositionRef.current || [50.8503, 4.3517], 15)}>
                📍 Locatie volgen
              </button>
              {!isBranchReturn ? (
                <button className="btn btn-sm btn-success" type="button" onClick={completeDelivery} disabled={isCompleting}>
                  {isCompleting ? 'Bezig...' : '✅ Beëindigen'}
                </button>
              ) : null}
              <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => navigate(`/driver/${driverId}`)}>
                ← Terug naar dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating action buttons - always visible at bottom */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1000 }}>
        <div className="d-flex flex-column gap-2">
          {!isBranchReturn ? (
            <button 
              className="btn btn-lg btn-success rounded-circle shadow-lg"
              type="button" 
              onClick={completeDelivery} 
              disabled={isCompleting}
              title="Levering voltooien"
              style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✅
            </button>
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default DriverNavigationPage
