/**
 * Form validation utility helpers.
 */

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate numeric ID (must be positive integer)
 * @param {string|number} id
 * @returns {boolean}
 */
export function isValidId(id) {
  const num = Number(id)
  return Number.isInteger(num) && num > 0
}

/**
 * Validate password strength
 * @param {string} password
 * @returns {object} { isValid, feedback }
 */
export function validatePassword(password) {
  const feedback = []
  let score = 0

  if (password.length >= 6) {
    score += 1
  } else {
    feedback.push('Minimum 6 tekens vereist')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Voeg een hoofdletter toe')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Voeg een getal toe')
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('Voeg een speciaal teken toe')
  }

  return {
    isValid: score >= 2,
    score,
    feedback
  }
}

/**
 * Validate phone number (basic format)
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/ // numbers, spaces, dashes, plus, parens
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9
}

/**
 * Validate postal code (basic Belgium format: 1234 or 1234-1)
 * @param {string} code
 * @returns {boolean}
 */
export function isValidPostalCode(code) {
  const codeRegex = /^\d{4}(-\d)?$/
  return codeRegex.test(code)
}

/**
 * Validate street address (not empty, reasonable length)
 * @param {string} street
 * @returns {boolean}
 */
export function isValidStreet(street) {
  return typeof street === 'string' && street.trim().length >= 3
}

/**
 * Get error class for form control
 * @param {boolean} hasError
 * @returns {string} Bootstrap class
 */
export function getErrorClass(hasError) {
  return hasError ? 'is-invalid' : ''
}

/**
 * Get feedback element JSX
 * @param {string} feedback
 * @param {boolean} isError
 * @returns {string} className for div feedback
 */
export function getFeedbackClass(isError) {
  return isError ? 'invalid-feedback d-block' : 'valid-feedback d-block'
}
