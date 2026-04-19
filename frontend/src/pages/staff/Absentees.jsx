import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function Absentees() {
  const [absentees, setAbsentees] = useState([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get('/attendance/absent', { params: { date } })
        setAbsentees(res.data.data?.absentees || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [date])

  const filtered = absentees.filter(a => a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Absentees</h1>
        <p className="text-gray-500 text-sm">View absent students for a specific date</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..."
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={3} className="py-12 text-center text-gray-400">Loading...</td></tr> :
                filtered.length === 0 ? <tr><td colSpan={3} className="py-12 text-center text-gray-400">No absentees found</td></tr> :
                filtered.map((a, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{a.name}</td>
                    <td className="py-3 px-4 text-gray-500">{a.email}</td>
                    <td className="py-3 px-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 capitalize">{a.role}</span></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-sm text-gray-400">Total absentees: {filtered.length}</div>
    </div>
  )
}
