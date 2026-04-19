import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { Bell, LogOut, User, ChevronDown, Menu, X, Inbox, History, Check } from 'lucide-react'

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { announcements, requests, responses, unreadCounts, markAsRead, markAllAsRead } = useNotifications()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showRequests, setShowRequests] = useState(false)
  const [showResponses, setShowResponses] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const notifRef = useRef(null)
  const requestRef = useRef(null)
  const responseRef = useRef(null)
  const userMenuRef = useRef(null)

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (requestRef.current && !requestRef.current.contains(event.target)) setShowRequests(false);
      if (responseRef.current && !responseRef.current.contains(event.target)) setShowResponses(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setShowRequests(false)
    setShowResponses(false)
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

          {/* ── 1. Notifications (Announcements) ── */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { closeAll(); setShowNotifications(!showNotifications); }}
              className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
              title="Notifications"
            >
              <Bell size={20} className={showNotifications ? 'text-blue-600' : 'text-gray-600'} />
              {unreadCounts.announcements > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCounts.announcements}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-[fadeSlideDown_0.2s_ease]">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications 🔔</h3>
                  <button onClick={() => markAllAsRead('announcements')} className="text-[10px] text-blue-600 font-bold hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {announcements.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-xs italic">No announcements</div>
                  ) : (
                    announcements.map(n => (
                      <div key={n._id} onClick={() => markAsRead(n._id, 'announcements')} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isReadByMe ? 'bg-blue-50/40' : ''}`}>
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold text-gray-800 underline decoration-blue-200 decoration-2">{n.title}</p>
                          <span className="text-[9px] text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2 italic">"{n.message}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── 2. Requests (Admin/Teacher Only) ── */}
          {(user?.role === 'admin' || user?.role === 'staff') && (
            <div className="relative" ref={requestRef}>
              <button
                onClick={() => { closeAll(); setShowRequests(!showRequests); }}
                className={`relative p-2 rounded-lg transition-colors ${showRequests ? 'bg-orange-50' : 'hover:bg-gray-100'}`}
                title="Incoming Requests"
              >
                <Inbox size={20} className={showRequests ? 'text-orange-600' : 'text-gray-600'} />
                {unreadCounts.requests > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCounts.requests}
                  </span>
                )}
              </button>

              {showRequests && (
                <div className="absolute right-0 mt-2 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-[fadeSlideDown_0.2s_ease]">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-orange-50/30">
                    <h3 className="font-bold text-gray-900 text-sm">Action Required 📥</h3>
                    <button onClick={() => markAllAsRead('requests')} className="text-[10px] text-orange-600 font-bold hover:underline">Clear Badges</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {requests.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 text-xs italic">No pending requests</div>
                    ) : (
                      requests.map(n => (
                        <div key={n._id} onClick={() => { markAsRead(n._id, 'requests'); navigate('/admin/requests') }} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isReadByMe ? 'bg-orange-50/40' : ''}`}>
                          <p className="text-xs font-bold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{n.message}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase transition hover:scale-105">View & Action</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 3. Responses (Student Only) ── */}
          {user?.role === 'student' && (
            <div className="relative" ref={responseRef}>
              <button
                onClick={() => { closeAll(); setShowResponses(!showResponses); }}
                className={`relative p-2 rounded-lg transition-colors ${showResponses ? 'bg-green-50' : 'hover:bg-gray-100'}`}
                title="Your Responses"
              >
                <History size={20} className={showResponses ? 'text-green-600' : 'text-gray-600'} />
                {unreadCounts.responses > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCounts.responses}
                  </span>
                )}
              </button>

              {showResponses && (
                <div className="absolute right-0 mt-2 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-[fadeSlideDown_0.2s_ease]">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-green-50/30">
                    <h3 className="font-bold text-gray-900 text-sm">Your Outcomes 📤</h3>
                    <button onClick={() => markAllAsRead('responses')} className="text-[10px] text-green-600 font-bold hover:underline">Clear Badges</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {responses.length === 0 ? (
                      <div className="p-10 text-center text-gray-400 text-xs italic">No processed updates</div>
                    ) : (
                      responses.map(n => (
                        <div key={n._id} onClick={() => markAsRead(n._id, 'responses')} className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isReadByMe ? 'bg-green-50/40' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            {n.title.includes('Approved') ? <Check size={12} className="text-green-600" /> : <X size={12} className="text-red-600" />}
                            <p className="text-xs font-bold text-gray-800">{n.title}</p>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                          <p className="text-[9px] text-gray-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── User Menu ── */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${showUserMenu ? 'bg-gray-100 text-blue-600' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${showUserMenu ? 'bg-blue-600' : 'bg-blue-100'}`}>
                <span className={`font-semibold text-sm ${showUserMenu ? 'text-white' : 'text-blue-700'}`}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
                {user?.name}
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 z-50 w-56 sm:w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
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
