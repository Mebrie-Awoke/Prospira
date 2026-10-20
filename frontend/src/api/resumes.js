import { api } from './client'

export const resumesApi = {
  async list() {
    const { data } = await api.get('/resumes/')
    return data
  },
  async get(id) {
    const { data } = await api.get(`/resumes/${id}/`)
    return data
  },
  async create(resume) {
    const { data } = await api.post('/resumes/', resume)
    return data
  },
  async update(id, resume) {
    const { data } = await api.patch(`/resumes/${id}/`, resume)
    return data
  },
  async uploadPhoto(id, photo) {
    const formData = new FormData()
    formData.append('photo', photo)
    const { data } = await api.post(`/resumes/${id}/photo/`, formData)
    return data
  },
  async removePhoto(id) {
    const { data } = await api.delete(`/resumes/${id}/photo/`)
    return data
  },
  async remove(id) {
    await api.delete(`/resumes/${id}/`)
  },
}
