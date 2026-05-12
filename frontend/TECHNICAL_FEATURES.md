# Pizzeria App Frontend - Technical Features Guide

## Overview
This is a React + Vite SPA for managing pizza ordering and delivery operations in real-time. The app demonstrates modern web technologies including web sockets, browser APIs (localStorage, IntersectionObserver), and responsive UI patterns.

---

## 1. Real-Time Updates (Socket.IO)

### Feature
Live driver location tracking and order status updates are pushed from the server to all connected clients.

### How It Works
- **Driver Location Updates**: Drivers emit their GPS coordinates via socket events (`driver:update_location`)
- **Server Broadcasts**: The backend broadcasts location updates to all connected front-office clients
- **Frontend Subscribers**: `FrontDashboard.jsx` listens to `driver:location_updated` and updates:
  - Leaflet map markers with real-time positions
  - Driver status badges
  - Online driver list

### Code Location
- **Frontend**: [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx#L60) - socket listeners (line 60 onwards)
- **Backend**: `backend/sockets/handlers/driverHandlers.js` - emits `driver:location_updated`

### Example: Order Status Change
```javascript
socket.on('order:status_changed', (data) => {
  setMessage(`Order ${data.order_id} -> ${data.status}`)
  loadOrders() // Refresh order list
})
```

### Events Handled
| Event | Payload | Effect |
|-------|---------|--------|
| `driver:location_updated` | `{driver_id, latitude, longitude}` | Update map markers, driver list |
| `order:status_changed` | `{order_id, status, order}` | Refresh orders, update driver busy state |
| `error` | `{message}` | Display error alert |

---

## 2. Personalization & Favorites (localStorage)

### Feature
Users can mark drivers as favorites and their preferences are saved across sessions.

### How It Works
- Favorites stored in `localStorage` under key `pizzeria_favorites`
- Data structure: `{ drivers: [1, 5, 10], orders: [], places: [] }`
- Star icons (☆/★) show favorite state
- Starred drivers appear highlighted with yellow button styling

### Code Location
- **Helper**: [frontend/src/lib/favorites.js](src/lib/favorites.js)
- **Integration**: [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx#L35-40)

### Usage Example
```javascript
import { toggleFavorite, isFavorite, getFavorites } from '../lib/favorites.js'

// Toggle favorite status
toggleFavorite('drivers', driverId)

// Check if driver is favorited
if (isFavorite('drivers', 5)) {
  console.log('Driver 5 is a favorite')
}

// Get all favorite drivers
const favs = getFavorites('drivers') // returns: [1, 5, 10]
```

### API
| Function | Parameters | Returns |
|----------|------------|---------|
| `toggleFavorite(type, id)` | `'drivers'/'orders'/'places'`, numeric id | `boolean` (new state) |
| `isFavorite(type, id)` | type, id | `boolean` |
| `addFavorite(type, id)` | type, id | void |
| `removeFavorite(type, id)` | type, id | void |
| `getFavorites(type)` | type (default: 'drivers') | `array` of IDs |

---

## 3. API Response Caching (localStorage)

### Feature
API responses are cached with a 5-minute TTL to reduce server load and improve UX.

### How It Works
- Each endpoint response cached under key `pizzeria_cache__[endpoint_name]`
- TTL (time-to-live) defaults to 5 minutes (300,000 ms)
- Stale cache is automatically cleared and fresh data is fetched
- Users see instant data on page reload (within cache validity)

### Code Location
- **Helper**: [frontend/src/lib/cache.js](src/lib/cache.js)
- **Integration**: [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx#L370-385)

### Cached Endpoints
| Endpoint | Cache Key | TTL | Data |
|----------|-----------|-----|------|
| `/api/branch/{id}` | `branch_{branchId}` | 5 min | Branch info (name, address, coords) |
| `/api/drivers/selection/branch/{id}` | `drivers_{branchId}` | 5 min | Online drivers list |
| `/api/orders/branch/{id}` | `orders_{branchId}` | 5 min | Orders table data |

### Usage Example
```javascript
import { getCached, setCache, clearCache } from '../lib/cache.js'

// Check cache first (5 min TTL)
const cached = getCached('branch_1', 5 * 60 * 1000)
if (cached) {
  setBranch(cached)
  return
}

// Fetch and cache
const res = await fetch('/api/branch/1')
const data = await res.json()
setCache('branch_1', data)
setBranch(data)

// Clear specific cache or all
clearCache('orders_1') // clear one
clearCache() // clear all pizzeria cache
```

### API
| Function | Returns |
|----------|---------|
| `getCached(key, ttl)` | `data \| null` |
| `setCache(key, data)` | void |
| `clearCache(key?)` | void (clears one or all) |

---

## 4. Browser Observer API (IntersectionObserver)

### Feature
When viewing order tables, rows highlight with a subtle blue background as they scroll into view, demonstrating lazy-loading and visibility tracking.

### How It Works
- **Effect**: [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx#L200-235) sets up observer when orders tab active
- **Target**: All `<tr data-order-id>` rows in the orders table
- **Callback**: When row is ≥50% visible, background highlights for 500ms
- **Cleanup**: Observer is disconnected when tab changes

### Code Location
- **Helper**: [frontend/src/lib/observer.js](src/lib/observer.js)
- **Integration**: [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx#L200-235)

### Use Cases
- Infinite scroll pagination (lazy-load more rows)
- Performance monitoring (track which rows users see)
- Image lazy-loading (load images only when visible)
- Analytics (detect user engagement)

### Usage Example
```javascript
import { createIntersectionObserver } from '../lib/observer.js'

const rows = document.querySelectorAll('tbody tr')
const observer = createIntersectionObserver(
  Array.from(rows),
  (element, isVisible, entry) => {
    if (isVisible) {
      console.log('Row is in viewport:', element.id)
      // Lazy-load data, log analytics, etc.
    }
  },
  { threshold: 0.5 } // Fire when 50% visible
)

// Later: clean up
observer.disconnect()
```

### API
| Function | Purpose |
|----------|---------|
| `createIntersectionObserver(elements, callback, options)` | Create observer for elements |
| `disconnectIntersectionObserver(observer, elements)` | Stop observing and cleanup |

---

## 5. Form Validation

### Feature
Login form includes real-time validation with visual feedback. Submit button disabled until form is valid.

### How It Works
- **Real-time Checks**: Validates ID format and password presence on blur
- **Visual Feedback**: Invalid fields show red border + error message; valid show green checkmark
- **Submit Gate**: Button disabled if form invalid (prevents submit of bad data)

### Code Location
- **Validation Helper**: [frontend/src/lib/validation.js](src/lib/validation.js)
- **Integration**: [frontend/src/pages/LoginPage.jsx](src/pages/LoginPage.jsx)

### Validation Rules
| Field | Rule | Example |
|-------|------|---------|
| Branch/Driver ID | Must be positive integer | `1`, `42`, `105` |
| Password | Must not be empty | `anything123` |

### Validation Functions Available
```javascript
import { 
  isValidId, 
  isValidEmail, 
  isValidPassword, 
  isValidPhone,
  getErrorClass,
  getFeedbackClass 
} from '../lib/validation.js'

isValidId('42') // true
isValidId('-5') // false
isValidId('abc') // false

isValidEmail('user@example.com') // true
isValidPassword('Pass123!').isValid // true (if strong enough)
```

### UI Example (LoginPage)
```jsx
const isIdentifierValid = identifier.trim().length > 0 && isValidId(identifier)

<input
  className={getErrorClass(!isIdentifierValid && touched)}
  onBlur={() => setTouched(true)}
/>
{touched && !isIdentifierValid && (
  <div className={getFeedbackClass(true)}>
    Geef een geldige ID in
  </div>
)}
```

---

## 6. Real-Time Driver Navigation

### Feature
Front-office staff can see driver routes on the map and drivers can navigate back to branch when idle.

### How It Works
- **Front Map**: Shows polylines from each driver → their destination (order or branch)
- **Route Color**: Blue dashed = delivery destination; green dashed = branch return
- **Driver Navigation**: When no active order, driver gets "Navigate to branch" option
- **Order Destination**: Addresses geocoded via Nominatim (cached for performance)

### Code Locations
- **Front Map Routes**: [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx#L320-345)
- **Driver Navigation**: [frontend/src/pages/DriverNavigationPage.jsx](src/pages/DriverNavigationPage.jsx) (branch-return at orderId=0)

---

## 7. Data Availability

### Database Snapshot
The app ships with test data:
- **2 Branches** (Downtown, Eastside)
- **4 Drivers** (2 per branch)
- **20 Orders** (10 per branch, all statuses)
- **4 Reservations** (for in-house dining)

### API Endpoints (Sample)
```
GET /api/orders/branch/1          → [20 orders] (10 per branch × 2 branches)
GET /api/drivers/selection/branch/1 → [2+ drivers]
GET /api/branch/1                 → {branch info}
```

All listings support pagination or filtering if extended. Current setup returns ≥20 objects total.

---

## 8. Theme Persistence

### Feature
App detects system dark/light preference and saves user's theme choice.

### How It Works
- Detects `prefers-color-scheme: dark` on load
- Saves preference to `localStorage` key `pizzeria_theme`
- Applies CSS class `.theme-dark` to `<html>` element
- User can toggle theme via button in header

### Code Location
- **Theme Helper**: [frontend/src/lib/theme.js](src/lib/theme.js)
- **Bootstrap**: [frontend/src/main.jsx](src/main.jsx#L4) - calls `initTheme()`
- **Toggle Button**: [frontend/src/components/DashboardLayout.jsx](src/components/DashboardLayout.jsx)

---

## 9. Development Setup

### Prerequisites
- Node.js 16+
- npm or yarn
- PostgreSQL (for backend)

### Frontend Installation
```bash
cd pizzeria-app/frontend
npm install
npm run dev         # Start dev server on http://localhost:5173
npm run build       # Production build
npm run lint        # Check code quality
```

### Backend Installation
```bash
cd pizzeria-app/backend
npm install
npm run dev         # Start backend + socket server on http://localhost:3000
```

### Database Setup
```bash
# Initialize database schema
node scripts/init_db.js

# Insert test data (20 orders, 4 drivers, etc.)
node scripts/insert_testData.js

# Drop all data (for reset)
node scripts/drop_tables.js
```

---

## 10. Key Files Reference

| File | Purpose |
|------|---------|
| [frontend/src/lib/favorites.js](src/lib/favorites.js) | Favorites storage & retrieval |
| [frontend/src/lib/cache.js](src/lib/cache.js) | API response caching |
| [frontend/src/lib/observer.js](src/lib/observer.js) | IntersectionObserver wrapper |
| [frontend/src/lib/validation.js](src/lib/validation.js) | Form validation helpers |
| [frontend/src/lib/theme.js](src/lib/theme.js) | Theme detection & toggle |
| [frontend/src/pages/FrontDashboard.jsx](src/pages/FrontDashboard.jsx) | Live order & driver management |
| [frontend/src/pages/DriverDashboard.jsx](src/pages/DriverDashboard.jsx) | Driver order view & stats |
| [frontend/src/pages/LoginPage.jsx](src/pages/LoginPage.jsx) | Login with validation |

---

## 11. Project Features Summary

✅ **Real-time Updates**: Socket.IO broadcasts driver location & order status  
✅ **Personalization**: Favorite drivers stored in localStorage  
✅ **Performance**: API responses cached for 5 minutes  
✅ **Observer API**: IntersectionObserver highlights visible order rows  
✅ **Form Validation**: LoginPage prevents invalid submissions  
✅ **Dark Mode**: Theme detection & persistence  
✅ **Routing**: Leaflet map with driver polylines & geocoding  
✅ **Data**: 20+ orders in test database  

---

## 12. Testing the Features

### 1. Test Favorites
1. Go to Front Dashboard → Driver live map tab
2. Click star (☆) next to any driver → turns yellow (★)
3. Refresh page → star remains yellow (persisted)

### 2. Test Caching
1. Open Network tab in DevTools
2. Load orders → watch API call
3. Load orders again within 5 min → no API call (from cache)
4. Wait 5+ min → API call resumes

### 3. Test IntersectionObserver
1. Go to Front Dashboard → Orders tab
2. Scroll through order table → rows highlight blue as they enter view

### 4. Test Form Validation
1. Go to Login page
2. Type invalid ID (negative, letters) → error message + red border
3. Fix ID → green checkmark, button enabled
4. Submit → logs in only if both fields valid

### 5. Test Dark Mode
1. System prefers dark → app loads dark
2. Click theme toggle in header → switches theme, saves to localStorage
3. Refresh → theme persists

---

## License
Internal project for Pizzeria Operations Management.
