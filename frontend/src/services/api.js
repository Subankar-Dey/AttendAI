/**
 * API Service Configuration
 * Centralized Axios instance for all API requests with JWT authentication
 * Handles automatic token injection, error handling, and session management
 * 
 * Features:
 * - Automatic JWT token attachment to Authorization header
 * - Automatic logout on 401 Unauthorized response
 * - Configured for JSON requests/responses
 * - Environment-based base URL configuration
 * 
 * @module api
 * @requires axios - HTTP client library
 * @requires VITE_API_URL - Environment variable for backend URL (defaults to localhost:5000)
 * 
 * @example
 * import api from '@/services/api'
 * const response = await api.get('/users')  // JWT token auto-attached
 * const data = await api.post('/attendance/mark', payload)
 */

import axios from 'axios'

/**
 * Axios instance configured for AttendAI backend communication
 * @type {AxiosInstance}
 * @property {string} baseURL - Backend API base URL
 * @property {object} headers - Default headers for all requests
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Request Interceptor
 * Automatically adds JWT token from localStorage to Authorization header
 * Enables secure API communication without manual token handling in each request
 * 
 * @param {object} config - Axios request configuration
 * @returns {object} Modified config with Authorization header
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api