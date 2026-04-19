import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function AttendanceView() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const year = new Date().getFullYear()
        const startDate = new Date(year, Number(month) - 1, 1).toISOString()
        const endDate = new Date(year, Number(month), 0).toISOString()
        const res = await api.get(`/attendance/student/${user._id}`, { params: { startDate, endDate } })
        setRecords(res.data.data?.records || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    if (user?._id) fetch()
  }, [user, month])

  const statusBadge = (status) => {
    const colors = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', late: 'bg-yellow-100 text-yellow-700' }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status]}`}>{status}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-gray-500 text-sm">View your daily attendance records</p>
      </div>

      <select value={month} onChange={e => setMonth(e.target.value)}
        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', {month: 'long'})}</option>)}
      </select>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Day</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">Loading...</td></tr> :
                records.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">No records for this month</td></tr> :
                records.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(r.date).toLocaleDateString('en', { weekday: 'long' })}</td>
                    <td className="py-3 px-4 text-gray-500">{r.class?.name || '-'}</td>
                    <td className="py-3 px-4">{statusBadge(r.status)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-400">Showing {records.length} records</div>
    </div>
  )
}
