import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api').replace(/\/+$/, '')

export const api = axios.create({
  baseURL: apiBaseUrl,
})

api.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('prospira.access')
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

let refreshRequest

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const isTokenRequest = originalRequest?.url?.includes('/token/')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || isTokenRequest) {
      return Promise.reject(error)
    }

    const refreshToken = localStorage.getItem('prospira.refresh')
    if (!refreshToken) return Promise.reject(error)

    originalRequest._retried = true
    try {
      refreshRequest ||= axios.post(`${apiBaseUrl}/token/refresh/`, { refresh: refreshToken })
      const { data } = await refreshRequest
      localStorage.setItem('prospira.access', data.access)
      originalRequest.headers.Authorization = `Bearer ${data.access}`
      return api(originalRequest)
    } catch (refreshError) {
      localStorage.removeItem('prospira.access')
      localStorage.removeItem('prospira.refresh')
      window.dispatchEvent(new Event('prospira:session-expired'))
      return Promise.reject(refreshError)
    } finally {
      refreshRequest = undefined
    }
  },
)
