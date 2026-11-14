import { api } from './client'

export const accountApi = {
  async getProfile() {
    const { data } = await api.get('/account/profile/')
    return data
  },
  async updateProfile(payload) {
    const { data } = await api.patch('/account/profile/', payload)
    return data
  },
  async changePassword(payload) {
    const { data } = await api.post('/account/password/', payload)
    return data
  },
}
