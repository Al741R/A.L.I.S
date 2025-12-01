import { ref, computed } from 'vue'

/**
 * Simple form validation composable
 * @param {Object} rules - Validation rules object
 * @returns {Object} - Validation state and methods
 */
export function useFormValidation(rules = {}) {
  const errors = ref({})
  const touched = ref({})

  /**
   * Validate a single field
   * @param {String} field - Field name
   * @param {any} value - Field value
   * @returns {String|null} - Error message or null
   */
  function validateField(field, value) {
    const fieldRules = rules[field]
    if (!fieldRules) return null

    for (const rule of fieldRules) {
      const error = rule(value)
      if (error) return error
    }
    return null
  }

  /**
   * Validate all fields
   * @param {Object} formData - Form data object
   * @returns {Boolean} - True if valid
   */
  function validate(formData) {
    const newErrors = {}
    let isValid = true

    Object.keys(rules).forEach((field) => {
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
        isValid = false
      }
    })

    errors.value = newErrors
    return isValid
  }

  /**
   * Mark field as touched
   * @param {String} field - Field name
   */
  function touch(field) {
    touched.value[field] = true
  }

  /**
   * Clear all errors
   */
  function clearErrors() {
    errors.value = {}
    touched.value = {}
  }

  /**
   * Clear error for specific field
   * @param {String} field - Field name
   */
  function clearError(field) {
    delete errors.value[field]
  }

  /**
   * Check if form is valid
   */
  const isValid = computed(() => Object.keys(errors.value).length === 0)

  /**
   * Get error for field
   * @param {String} field - Field name
   */
  function getError(field) {
    return touched.value[field] ? errors.value[field] : null
  }

  return {
    errors,
    touched,
    validate,
    validateField,
    touch,
    clearErrors,
    clearError,
    isValid,
    getError,
  }
}

// Common validation rules
export const validationRules = {
  required:
    (message = 'This field is required') =>
    (value) => {
      if (value === null || value === undefined || value === '') return message
      if (typeof value === 'string' && value.trim() === '') return message
      return null
    },

  minLength: (min, message) => (value) => {
    if (!value) return null
    if (value.length < min) return message || `Must be at least ${min} characters`
    return null
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null
    if (value.length > max) return message || `Must be at most ${max} characters`
    return null
  },

  email:
    (message = 'Invalid email address') =>
    (value) => {
      if (!value) return null
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) ? null : message
    },

  numeric:
    (message = 'Must be a number') =>
    (value) => {
      if (value === null || value === undefined || value === '') return null
      return !isNaN(value) ? null : message
    },

  min: (minValue, message) => (value) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return num >= minValue ? null : message || `Must be at least ${minValue}`
  },

  max: (maxValue, message) => (value) => {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return num <= maxValue ? null : message || `Must be at most ${maxValue}`
  },

  pattern:
    (regex, message = 'Invalid format') =>
    (value) => {
      if (!value) return null
      return regex.test(value) ? null : message
    },

  isbn:
    (message = 'Invalid ISBN format') =>
    (value) => {
      if (!value) return null
      // Accept ISBN-10 or ISBN-13 format (with or without hyphens)
      const isbn = value.replace(/[-\s]/g, '')
      const isValid = /^(\d{10}|\d{13})$/.test(isbn)
      return isValid ? null : message
    },

  year:
    (message = 'Invalid year') =>
    (value) => {
      if (!value) return null
      const year = Number(value)
      const currentYear = new Date().getFullYear()
      return year >= 1000 && year <= currentYear + 1 ? null : message
    },
}
