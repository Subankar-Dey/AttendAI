import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import LineChart from '../../components/charts/LineChart'
import PieChart from '../../components/charts/PieChart'

export default function StaffDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/dashboard/stats')
        setStats(res.data.data?.stats)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}. Manage your classes and attendance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students', value: stats?.totalStudents || 0, color: 'bg-blue-50 text-blue-600' },
          { label: 'Present Today', value: stats?.todayPresent || 0, color: 'bg-green-50 text-green-600' },
          { label: 'Absent Today', value: stats?.todayAbsentees || 0, color: 'bg-red-50 text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart data={[
          { name: 'Present', value: stats?.todayPresent || 0 },
          { name: 'Absent', value: stats?.todayAbsentees || 0 },
        ]} title="Today's Overview" />
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {[
              { label: 'Mark Attendance', href: '/staff/mark-attendance', icon: '✏️' },
              { label: 'View Absentees', href: '/staff/absentees', icon: '📋' },
              { label: 'View Classes', href: '/staff/classes', icon: '🏫' },
              { label: 'AI Assistant', href: '/staff/ai', icon: '🤖' },
            ].map((a, i) => (
              <a key={i} href={a.href} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition">
                <span className="text-lg">{a.icon}</span>
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
