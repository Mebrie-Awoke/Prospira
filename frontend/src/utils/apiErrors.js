const FIELD_LABELS = {
  non_field_errors: 'Request',
  detail: 'Request',
  username: 'Username',
  email: 'Email address',
  password: 'Password',
  full_name: 'Full name',
  template_identifier: 'Resume template',
}

function humanizeMessage(message, field = '') {
  const value = String(message || '').trim()
  const normalized = value.toLowerCase()

  if (/already exists|already registered|is not unique|must be unique/.test(normalized)) {
    if (field === 'email' || normalized.includes('email')) return 'An account with this email address already exists. Try signing in instead.'
    if (field === 'username' || normalized.includes('username')) return 'This username is already taken. Please choose another.'
    return 'This information is already in use. Please review it and try again.'
  }
  if (normalized.includes('valid email') || normalized.includes('valid e-mail') || normalized.includes('enter a valid')) {
    return 'Enter a valid email address.'
  }
  if (normalized.includes('password') && (normalized.includes('too short') || normalized.includes('at least'))) {
    return 'Choose a stronger password with at least 8 characters.'
  }
  if (normalized.includes('password') && (normalized.includes('common') || normalized.includes('too similar') || normalized.includes('entirely numeric'))) {
    return 'Choose a stronger password that is not common, numeric-only, or too similar to your personal information.'
  }
  if (normalized.includes('this field is required') || normalized === 'required') {
    return 'This field is required.'
  }
  return value
}

function flattenMessages(value, prefix = '', field = '') {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenMessages(item, prefix, field))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => {
      const label = FIELD_LABELS[key] || key.replaceAll('_', ' ')
      return flattenMessages(item, label, key)
    })
  }
  if (typeof value === 'string' && value.trim()) {
    const message = humanizeMessage(value, field)
    return [prefix ? `${prefix}: ${message}` : message]
  }
  return []
}

export function getApiError(error) {
  if (!error?.response) {
    if (error?.code === 'ERR_CANCELED') return 'This request was cancelled. Please try again.'
    if (error?.code === 'ECONNABORTED') return 'The request took too long. Check your connection and try again.'
    return 'We could not connect to Prospira. Check your internet connection and try again.'
  }

  const { status, data } = error.response

  // Keep server exceptions and infrastructure details private.
  if (status >= 500) return 'Prospira is temporarily unavailable. Please try again in a few moments.'
  if (status === 429) return 'You have made too many requests. Please wait a moment before trying again.'
  if (status === 413) return 'The uploaded file is too large. Choose a smaller file and try again.'
  if (status === 401) return 'Your session has expired or your sign-in details are incorrect. Please check them and try again.'
  if (status === 403) return 'You do not have permission to complete this action.'
  if (status === 404) return 'We could not find what you were looking for. It may have been moved or deleted.'

  const messages = flattenMessages(data)
  if (messages.length) return messages.slice(0, 4).join(' ')

  if (status === 400 || status === 422) return 'Some information is missing or invalid. Review the highlighted fields and try again.'
  if (status === 409) return 'This information is already in use. Please review it and try again.'
  return 'We could not complete your request. Please try again.'
}
