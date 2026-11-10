const FIELD_LABELS = {
  non_field_errors: 'Request',
  detail: 'Request',
  username: 'Username',
  email: 'Email address',
  password: 'Password',
  full_name: 'Full name',
  template_identifier: 'Resume template',
}

function flattenMessages(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenMessages(item, prefix))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      flattenMessages(item, FIELD_LABELS[key] || key.replaceAll('_', ' ')),
    )
  }
  if (typeof value === 'string' && value.trim()) {
    return [prefix ? `${prefix}: ${value.trim()}` : value.trim()]
  }
  return []
}

export function getApiError(error) {
  if (!error?.response) {
    if (error?.code === 'ERR_CANCELED') return 'This request was cancelled.'
    if (error?.code === 'ECONNABORTED') return 'The request took too long. Please try again.'
    return 'We could not connect to Prospira. Check your internet connection and try again.'
  }

  const { status, data } = error.response
  const messages = flattenMessages(data)
  if (messages.length) return messages.slice(0, 4).join(' ')

  if (status === 400) return 'Some information is missing or invalid. Review the form and try again.'
  if (status === 401) return 'Your session has expired. Please sign in again.'
  if (status === 403) return 'You do not have permission to complete this action.'
  if (status === 404) return 'We could not find the requested item.'
  if (status === 413) return 'The uploaded file is too large. Choose a smaller file.'
  if (status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (status >= 500) return 'Prospira is temporarily unavailable. Please try again shortly.'
  return 'We could not complete your request. Please try again.'
}
