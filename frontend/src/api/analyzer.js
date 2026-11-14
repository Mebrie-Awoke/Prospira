import { api } from './client'

export const analyzerApi = {
  async analyze({ resume_text = '', resume_file = null, job_description = '', signal }) {
    let payload = { resume_text, job_description }
    if (resume_file) {
      payload = new FormData()
      payload.append('resume_file', resume_file)
      payload.append('job_description', job_description)
    }

    const { data } = await api.post('/analyzer/analyze/', payload, { signal })
    return data
  },
  async getHistory() {
    const { data } = await api.get('/analyzer/history/')
    return data
  },
  async deleteHistory(id) {
    await api.delete(`/analyzer/history/${id}/`)
  },
  async generateCoverLetter(payload) {
    const { data } = await api.post('/analyzer/cover-letters/generate/', payload)
    return data
  },
  async getCoverLetters() {
    const { data } = await api.get('/analyzer/cover-letters/')
    return data
  },
  async updateCoverLetter(id, payload) {
    const { data } = await api.patch(`/analyzer/cover-letters/${id}/`, payload)
    return data
  },
  async deleteCoverLetter(id) {
    await api.delete(`/analyzer/cover-letters/${id}/`)
  },
}
