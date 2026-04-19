import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  BarChart3,
  Bell,
  Bot,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
  Send,
  Inbox,
  BookOpen,
  X,
} from 'lucide-react'

const Sidebar = ({ collapsed, onCollapse, mobileOpen, onMobileClose }) => {
  const location = useLocation()
  const { user } = useAuth()

  const adminMenu = [
    {
      section: 'Main',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/users', label: 'Users', icon: Users },
        { path: '/admin/academics', label: 'Academics', icon: BookOpen },
        { path: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
        { path: '/admin/requests', label: 'Requests', icon: Inbox },
        { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
      ],
    },
    {
      section: 'Communication',
      items: [
        { path: '/admin/notifications', label: 'Notifications', icon: Bell },
      ],
    },
    {
      section: 'Advanced',
      items: [
        { path: '/admin/ai', label: 'AI Panel', icon: Bot },
        { path: '/admin/settings', label: 'Settings', icon: Settings },
        { path: '/admin/security', label: 'Security', icon: Shield },
      ],
    },
  ]

  const staffMenu = [
    {
      section: 'Main',
      items: [
        { path: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/staff/mark-attendance', label: 'Mark Attendance', icon: ClipboardCheck },
        { path: '/staff/classes', label: 'View Classes', icon: GraduationCap },
        { path: '/staff/requests', label: 'Requests', icon: Inbox },
        { path: '/staff/absentees', label: 'Absentees', icon: FileText },
      ],
    },
    {
      section: 'Advanced',
      items: [
        { path: '/staff/ai', label: 'AI Assistant', icon: Bot },
      ],
    },
  ]

  const studentMenu = [
    {
      section: 'Main',
      items: [
        { path: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/student/attendance', label: 'Attendance', icon: ClipboardCheck },
        { path: '/student/requests', label: 'Requests', icon: Send },
      ],
    },
    {
      section: 'Advanced',
      items: [
        { path: '/student/ai', label: 'AI Assistant', icon: Bot },
      ],
    },
  ]

  const menu = user?.role === 'admin'
    ? adminMenu
    : user?.role === 'staff'
    ? staffMenu
    : studentMenu

  const isActive = (path) => location.pathname === path

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-gray-900">AttendAI</span>
          </div>
        )}
        <button
          onClick={onCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hidden lg:block"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {menu.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.section}
              </h3>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onMobileClose}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                        ${isActive(item.path)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        ${collapsed ? 'justify-center px-2' : ''}
                      `}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon size={20} />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="px-3 py-4 border-t border-gray-200">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-medium text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          bg-white border-r border-gray-200
          transform transition-all duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64
        `}
      >
        {/* Mobile Close */}
        <button
          className="lg:hidden absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 z-10"
          onClick={onMobileClose}
        >
          <X size={20} />
        </button>

        <NavContent />
      </aside>
    </>
  )
}

export default Sidebar
