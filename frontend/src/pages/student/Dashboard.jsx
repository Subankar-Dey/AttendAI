import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import PieChart from '../../components/charts/PieChart'
import LineChart from '../../components/charts/LineChart'

export default function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/attendance/student/${user._id}`)
        setStats(res.data.data?.stats)
        setRecords(res.data.data?.records || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (user?._id) fetchData()
  }, [user])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  const percentage = stats?.percentage || 0
  const isAtRisk = percentage < 75

  // Build trend data from records
  const trendMap = {}
  records.slice(0, 30).reverse().forEach(r => {
    const d = new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    trendMap[d] = (trendMap[d] || 0) + (r.status === 'present' ? 1 : 0)
  })
  const trendData = Object.entries(trendMap).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}. Here's your attendance overview.</p>
      </div>

      {/* Alert */}
      {isAtRisk && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <span className="text-red-500 text-xl">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Low Attendance Alert</p>
            <p className="text-xs text-red-600">Your attendance is {percentage}% — below the required 75%. Attend more classes to avoid penalties.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
          <p className={`text-3xl font-bold ${isAtRisk ? 'text-red-600' : 'text-green-600'}`}>{percentage}%</p>
          <p className="text-xs text-gray-500 mt-1">Attendance</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-600">{stats?.present || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Present</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-red-600">{stats?.absent || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Absent</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
          <p className="text-3xl font-bold text-yellow-600">{stats?.late || 0}</p>
          <p className="text-xs text-gray-500 mt-1">Late</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChart data={[
          { name: 'Present', value: stats?.present || 0 },
          { name: 'Absent', value: stats?.absent || 0 },
          { name: 'Late', value: stats?.late || 0 },
        ]} title="Attendance Breakdown" />
        {trendData.length > 0 && (
          <LineChart data={trendData} title="Attendance Trend" color="#22c55e" height={280} />
        )}
      </div>
    </div>
  )
}
