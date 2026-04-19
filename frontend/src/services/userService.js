import api from './api'

export const userService = {
  getAll: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  create: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  update: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  getStudents: async (params = {}) => {
    const response = await api.get('/users/students', { params })
    return response.data
  },

  getStaff: async (params = {}) => {
    const response = await api.get('/users/staff', { params })
    return response.data
  },

  getAdmins: async (params = {}) => {
    const response = await api.get('/users/admins', { params })
    return response.data
  },

  updatePassword: async (id, currentPassword, newPassword) => {
    const response = await api.put(`/users/${id}/password`, {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  search: async (query) => {
    const response = await api.get('/users/search', { params: { q: query } })
    return response.data
  },
}

export default userService
