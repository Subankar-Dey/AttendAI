import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'
import socket from '../services/socket'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  /* ── Fetch from DB ── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      const list = res.data.data?.notifications || []
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.isReadByMe).length)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Load on mount ── */
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  /* ── Socket real-time push ── */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      _id: Date.now().toString(),
      ...notification,
      isReadByMe: false,
      createdAt: new Date().toISOString(),
    }
    setNotifications(prev => [newNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  useEffect(() => {
    socket.on('notification', (data) => {
      addNotification({ title: data.title, message: data.message })
    })
    return () => socket.off('notification')
  }, [addNotification])

  /* ── Mark single as read (DB + local) ── */
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
    } catch { /* silently ignore */ }
    setNotifications(prev =>
      prev.map(n => n._id === notificationId ? { ...n, isReadByMe: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  /* ── Mark all as read ── */
  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter(n => !n.isReadByMe)
    await Promise.allSettled(unread.map(n => api.put(`/notifications/${n._id}/read`)))
    setNotifications(prev => prev.map(n => ({ ...n, isReadByMe: true })))
    setUnreadCount(0)
  }, [notifications])

  /* ── Remove locally (after delete) ── */
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const removed = prev.find(n => n._id === notificationId)
      if (removed && !removed.isReadByMe) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(n => n._id !== notificationId)
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export default NotificationContext
