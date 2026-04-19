import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { Bell, LogOut, User, ChevronDown, Menu, X } from 'lucide-react'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getDashboardPath = () => {
    switch (user?.role) {
      case 'admin': return '/admin/dashboard'
      case 'staff': return '/staff/dashboard'
      case 'student': return '/student/dashboard'
      default: return '/login'
    }
  }

  const closeAll = () => {
    setShowNotifications(false)
    setShowUserMenu(false)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Mobile Menu */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={onMenuClick}
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumb / Title */}
        <div className="hidden lg:block">
          <h1 className="text-lg font-semibold text-gray-900 capitalize">
            {user?.role} Dashboard
          </h1>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 ml-auto">

          {/* ── Notifications ── */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeAll}
                />
                {/* Dropdown */}
                <div
                  className="absolute right-0 mt-2 z-50 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-white rounded-xl shadow-xl border border-gray-200"
                  style={{ animation: 'fadeSlideDown 0.15s ease-out' }}
                >
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-gray-500 text-sm">
                        <Bell size={32} className="mx-auto mb-2 text-gray-300" />
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id || notif.id}
                          className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notif.isReadByMe && !notif.read ? 'bg-blue-50/60' : ''
                          }`}
                          onClick={() => markAsRead(notif._id || notif.id)}
                        >
                          {(!notif.isReadByMe && !notif.read) && (
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 align-middle" />
                          )}
                          {notif.title && <p className="text-xs font-semibold text-gray-700">{notif.title}</p>}
                          <p className="text-sm text-gray-800">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── User Menu ── */}
          <div className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeAll}
                />
                {/* Dropdown */}
                <div
                  className="absolute right-0 mt-2 z-50 w-56 sm:w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                  style={{ animation: 'fadeSlideDown 0.15s ease-out' }}
                >
                  {/* User info header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-800 font-bold text-base">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-0.5 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize font-medium">
                          {user?.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <Link
                      to={getDashboardPath()}
                      onClick={closeAll}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      <span>Dashboard</span>
                    </Link>
                    <div className="mx-3 border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </header>
  )
}

export default Navbar
