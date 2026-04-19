import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import socket from '../services/socket'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    socket.on('notification', (data) => {
      addNotification({
        title: data.title,
        message: data.message,
        createdAt: new Date().toISOString(),
      })
    })
    return () => {
      socket.off('notification')
    }
  }, [addNotification])

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      read: false,
      createdAt: new Date().toISOString(),
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const removed = prev.find(n => n.id === notificationId)
      if (removed && !removed.read) {
        setUnreadCount(c => Math.max(0, c - 1))
      }
      return prev.filter(n => n.id !== notificationId)
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      // Simulated - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const value = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    fetchNotifications,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

export default NotificationContext
