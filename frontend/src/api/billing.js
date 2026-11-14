import { api } from './client'

export const billingApi = {
  async getSubscription() {
    const { data } = await api.get('/billing/subscription/')
    return data
  },
  async startCheckout(payload) {
    const { data } = await api.post('/billing/checkout/', payload)
    return data
  },
}
