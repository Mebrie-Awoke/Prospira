import { api } from './client'

export const analyzerApi = {
  async analyze({ resume_text, job_description = '', signal }) {
    const { data } = await api.post('/analyzer/analyze/', {
      resume_text,
      job_description,
    }, { signal })
    return data
  },
}
