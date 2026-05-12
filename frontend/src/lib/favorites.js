const STORAGE_KEY = 'pizzeria_favorites'

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { drivers: [], orders: [], places: [] }
    return JSON.parse(raw)
  } catch (_) {
    return { drivers: [], orders: [], places: [] }
  }
}

function writeStore(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (_) {
    // ignore
  }
}

function getFavorites(type = 'drivers') {
  const store = readStore()
  return Array.isArray(store[type]) ? store[type] : []
}

function isFavorite(type, id) {
  const list = getFavorites(type)
  return list.map(Number).includes(Number(id))
}

function addFavorite(type, id) {
  const store = readStore()
  store[type] = Array.isArray(store[type]) ? store[type].map(Number) : []
  if (!store[type].includes(Number(id))) {
    store[type].push(Number(id))
    writeStore(store)
  }
}

function removeFavorite(type, id) {
  const store = readStore()
  if (!Array.isArray(store[type])) { return }
  store[type] = store[type].filter((x) => Number(x) !== Number(id))
  writeStore(store)
}

function toggleFavorite(type, id) {
  if (isFavorite(type, id)) {
    removeFavorite(type, id)
    return false
  }
  addFavorite(type, id)
  return true
}

export { getFavorites, isFavorite, addFavorite, removeFavorite, toggleFavorite }
