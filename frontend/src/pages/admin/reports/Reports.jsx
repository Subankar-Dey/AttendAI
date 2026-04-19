import { useState } from 'react'
import api from '../../../services/api'

export default function Reports() {
  const [tab, setTab] = useState('daily')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res
      if (tab === 'daily') res = await api.get('/reports/daily', { params: { date } })
      else res = await api.get('/reports/monthly', { params: { month, year } })
      setReport(res.data.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500 text-sm">Generate and export attendance reports</p>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {['daily', 'monthly'].map(t => (
          <button key={t} onClick={() => { setTab(t); setReport(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{t} Report</button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {tab === 'daily' ? (
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        ) : (
          <>
            <select value={month} onChange={e => setMonth(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', {month: 'long'})}</option>)}
            </select>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-24 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </>
        )}
        <button onClick={fetchReport} disabled={loading}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {report && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl"><p className="text-2xl font-bold text-gray-900">{report.total || 0}</p><p className="text-xs text-gray-500 mt-1">Total Records</p></div>
            <div className="text-center p-4 bg-green-50 rounded-xl"><p className="text-2xl font-bold text-green-600">{report.present || 0}</p><p className="text-xs text-gray-500 mt-1">Present</p></div>
            <div className="text-center p-4 bg-red-50 rounded-xl"><p className="text-2xl font-bold text-red-600">{report.absent || 0}</p><p className="text-xs text-gray-500 mt-1">Absent</p></div>
            <div className="text-center p-4 bg-yellow-50 rounded-xl"><p className="text-2xl font-bold text-yellow-600">{report.late || 0}</p><p className="text-xs text-gray-500 mt-1">Late</p></div>
          </div>

          {report.classWise && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Class-wise Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr><th className="text-left py-2 px-4 text-gray-600">Class</th><th className="text-left py-2 px-4 text-gray-600">Present</th><th className="text-left py-2 px-4 text-gray-600">Absent</th><th className="text-left py-2 px-4 text-gray-600">Late</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {Object.entries(report.classWise).map(([cls, data]) => (
                      <tr key={cls}><td className="py-2 px-4 font-medium">{cls}</td><td className="py-2 px-4 text-green-600">{data.present}</td><td className="py-2 px-4 text-red-600">{data.absent}</td><td className="py-2 px-4 text-yellow-600">{data.late}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
