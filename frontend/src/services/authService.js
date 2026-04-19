import api from './api'

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token } = response.data
    const user = response.data.data?.user || response.data.user
    if (token) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    return { token, user }
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user')
      if (!user || user === 'undefined') return null
      return JSON.parse(user)
    } catch {
      return null
    }
  },

  getToken: () => localStorage.getItem('token'),

  isAuthenticated: () => !!localStorage.getItem('token'),

  verifyEmail: async (token) => {
    const response = await api.post('/auth/verify-email', { token })
    return response.data
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password })
    return response.data
  },
}

export default authService
