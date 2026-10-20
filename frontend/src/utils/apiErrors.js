export function getApiError(error) {
  const data = error.response?.data
  if (!data) return 'Could not reach the API. Check that Django is running and try again.'
  if (typeof data === 'string') return data
  return Object.entries(data).map(([field, messages]) => {
    const message = Array.isArray(messages) ? messages.join(' ') : String(messages)
    return field === 'non_field_errors' ? message : `${field.replaceAll('_', ' ')}: ${message}`
  }).join(' ')
}
