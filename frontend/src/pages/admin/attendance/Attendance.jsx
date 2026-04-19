import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { getSeverityColor } from '../../../utils/helpers'

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('records')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recRes, defRes] = await Promise.all([
          api.get('/attendance', { params: { startDate: dateFilter, endDate: dateFilter, limit: 100 } }),
          api.get('/attendance/low-attendance', { params: { threshold: 75 } })
        ])
        setRecords(recRes.data.data?.records || [])
        setDefaulters(defRes.data.data?.defaulters || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [dateFilter])

  const statusBadge = (status) => {
    const colors = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', late: 'bg-yellow-100 text-yellow-700' }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 text-sm">View records and identify defaulters</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['records', 'defaulters'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'defaulters' ? `Below 75% (${defaulters.length})` : 'Records'}
          </button>
        ))}
      </div>

      {tab === 'records' && (
        <>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600">Marked By</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">Loading...</td></tr> :
                    records.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">No records for this date</td></tr> :
                    records.map(r => (
                      <tr key={r._id} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-medium">{r.student?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-500">{r.class?.name || '-'}</td>
                        <td className="py-3 px-4">{statusBadge(r.status)}</td>
                        <td className="py-3 px-4 text-gray-500">{r.markedBy?.name || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'defaulters' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Attendance %</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Present Days</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Severity</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {defaulters.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">No defaulters found</td></tr> :
                  defaulters.map((d, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium">{d.student?.name}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSeverityColor(d.percentage)}`}>{d.percentage}%</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{d.presentDays} / {d.totalWorkingDays}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                          ${d.severity === 'critical' ? 'bg-red-100 text-red-700' : d.severity === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {d.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
