import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import api from '../services/api'
import socket from '../services/socket'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([])
  const [requests, setRequests] = useState([])
  const [responses, setResponses] = useState([])
  
  const [unreadCounts, setUnreadCounts] = useState({ announcements: 0, requests: 0, responses: 0 })
  const [loading, setLoading] = useState(false)

  /* ── Fetch from DB ── */
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch Announcements
      const resAnn = await api.get('/notifications?category=announcement')
      const annList = resAnn.data.data?.notifications || []
      setAnnouncements(annList)

      // Fetch Request Updates (Categorized locally into Requests vs Responses for performance or via separate calls)
      const resReq = await api.get('/notifications?category=request')
      const reqList = resReq.data.data?.notifications || []
      
      // Split into Requests vs Responses based on title or content patterns if needed, 
      // but strictly we can just show them in the relevant panel based on user role.
      // For Admin: These are incoming "New" items.
      // For Student: These are "Approved/Rejected" items.
      setRequests(reqList.filter(n => n.title.includes('New')))
      setResponses(reqList.filter(n => n.title.includes('Approved') || n.title.includes('Rejected')))

      setUnreadCounts({
        announcements: annList.filter(n => !n.isReadByMe).length,
        requests: reqList.filter(n => !n.isReadByMe && n.title.includes('New')).length,
        responses: reqList.filter(n => !n.isReadByMe && (n.title.includes('Approved') || n.title.includes('Rejected'))).length
      })
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
    
    if (notification.category === 'request') {
      if (notification.title.includes('New')) {
        setRequests(prev => [newNotification, ...prev])
        setUnreadCounts(prev => ({ ...prev, requests: prev.requests + 1 }))
      } else {
        setResponses(prev => [newNotification, ...prev])
        setUnreadCounts(prev => ({ ...prev, responses: prev.responses + 1 }))
      }
    } else {
      setAnnouncements(prev => [newNotification, ...prev])
      setUnreadCounts(prev => ({ ...prev, announcements: prev.announcements + 1 }))
    }
  }, [])

  useEffect(() => {
    socket.on('notification', (data) => {
      addNotification({ title: data.title, message: data.message })
    })
    return () => socket.off('notification')
  }, [addNotification])

  /* ── Mark single as read (DB + local) ── */
  const markAsRead = useCallback(async (notificationId, bucket) => {
    try {
      await api.put(`/notifications/${notificationId}/read`)
    } catch { /* silently ignore */ }
    
    const updater = prev => prev.map(n => n._id === notificationId ? { ...n, isReadByMe: true } : n);
    
    if (bucket === 'requests') {
      setRequests(updater)
      setUnreadCounts(prev => ({ ...prev, requests: Math.max(0, prev.requests - 1) }))
    } else if (bucket === 'responses') {
      setResponses(updater)
      setUnreadCounts(prev => ({ ...prev, responses: Math.max(0, prev.responses - 1) }))
    } else {
      setAnnouncements(updater)
      setUnreadCounts(prev => ({ ...prev, announcements: Math.max(0, prev.announcements - 1) }))
    }
  }, [])

  /* ── Mark all as read ── */
  const markAllAsRead = useCallback(async (bucket) => {
    const list = bucket === 'requests' ? requests : bucket === 'responses' ? responses : announcements;
    const unread = list.filter(n => !n.isReadByMe)
    await Promise.allSettled(unread.map(n => api.put(`/notifications/${n._id}/read`)))
    
    const updater = prev => prev.map(n => ({ ...n, isReadByMe: true }));
    if (bucket === 'requests') {
      setRequests(updater); setUnreadCounts(prev => ({ ...prev, requests: 0 }));
    } else if (bucket === 'responses') {
      setResponses(updater); setUnreadCounts(prev => ({ ...prev, responses: 0 }));
    } else {
      setAnnouncements(updater); setUnreadCounts(prev => ({ ...prev, announcements: 0 }));
    }
  }, [announcements, requests, responses])

  /* ── Remove locally (after delete) ── */
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const removed = prev.find(n => n._id === notificationId)
      if (removed && !removed.isReadByMe) setUnreadCount(c => Math.max(0, c - 1))
      return prev.filter(n => n._id !== notificationId)
    })
  }, [])

  const clearAll = useCallback(() => {
    setAnnouncements([])
    setRequests([])
    setResponses([])
    setUnreadCounts({ announcements: 0, requests: 0, responses: 0 })
  }, [])

  const value = {
    announcements,
    requests,
    responses,
    unreadCounts,
    loading,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
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
