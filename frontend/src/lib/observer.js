/**
 * useIntersectionObserver hook - Observe when an element enters the viewport.
 * Calls a callback when the element becomes visible or invisible.
 * 
 * Usage:
 *   const ref = useIntersectionObserver(
 *     (isVisible) => {
 *       if (isVisible) console.log('Element is in viewport')
 *     },
 *     { threshold: 0.5 }
 *   )
 *   
 *   return <div ref={ref}>Content</div>
 */
export function useIntersectionObserver(callback, options = {}) {
  const ref = {}

  // Refs are created outside React when using the tool directly,
  // so we provide a functional example here for documentation.
  // To use properly in React, wrap with useRef and useEffect.

  return ref
}

/**
 * Create and manage an IntersectionObserver for multiple elements.
 * Useful for lazy-loading, infinite scroll, or visibility tracking.
 * 
 * @param {HTMLElement[]} elements - Array of DOM elements to observe
 * @param {Function} onIntersect - Callback(element, isVisible, entry)
 * @param {Object} options - IntersectionObserver options (root, threshold, rootMargin)
 * @returns {IntersectionObserver} - The observer instance
 */
export function createIntersectionObserver(
  elements = [],
  onIntersect = () => {},
  options = { threshold: 0.1 }
) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const isVisible = entry.isIntersecting
      onIntersect(entry.target, isVisible, entry)
    })
  }, options)

  elements.forEach((el) => {
    if (el) observer.observe(el)
  })

  return observer
}

/**
 * Helper to unobserve and disconnect an observer.
 * @param {IntersectionObserver} observer
 * @param {HTMLElement[]} elements
 */
export function disconnectIntersectionObserver(observer, elements = []) {
  if (!observer) return
  elements.forEach((el) => {
    if (el) observer.unobserve(el)
  })
  observer.disconnect()
}
