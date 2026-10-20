import { api } from './client'

export const authApi = {
  async login(credentials) {
    const { data } = await api.post('/token/', credentials)
    return data
  },
  async register(details) {
    const { data } = await api.post('/register/', details)
    return data
  },
}
