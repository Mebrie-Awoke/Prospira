import { api } from './client'

export const analyzerApi = {
  async analyze({ resume_text, job_description = '' }) {
    const { data } = await api.post('/analyzer/analyze/', {
      resume_text,
      job_description,
    })
    return data
  },
}
