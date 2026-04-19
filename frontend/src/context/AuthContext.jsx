import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const storedUser = authService.getCurrentUser()
          if (storedUser && storedUser._id) {
            setUser(storedUser)
          } else {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } catch (err) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const { user } = await authService.login(email, password)
      if (!user || !user._id) {
        throw new Error('Invalid response from server')
      }
      setUser(user)
      return user
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.register(userData)
      return data
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed'
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    setUser(prev => {
      const updated = { ...prev, ...userData }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
    isStudent: user?.role === 'student',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
