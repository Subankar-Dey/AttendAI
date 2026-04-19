import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function Security() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/attendance/logs')
        setLogs(res.data.data?.logs || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchLogs()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Access Control & Security</h1>
        <p className="text-gray-500 text-sm">Audit logs and role permissions</p>
      </div>

      {/* Role Permissions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { role: 'Admin', perms: ['Full system access', 'Manage all users', 'Edit any attendance', 'System settings'], color: 'border-purple-200 bg-purple-50' },
          { role: 'Staff', perms: ['Mark attendance', 'View assigned classes', 'Class reports', 'AI assistant'], color: 'border-blue-200 bg-blue-50' },
          { role: 'Student', perms: ['View own attendance', 'Request corrections', 'AI assistant', 'Notifications'], color: 'border-green-200 bg-green-50' },
        ].map(r => (
          <div key={r.role} className={`rounded-xl border p-5 ${r.color}`}>
            <h3 className="font-semibold text-gray-900 mb-3">{r.role}</h3>
            <ul className="space-y-1.5">
              {r.perms.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Audit Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Action</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Entity</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-600">Time</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">Loading...</td></tr> :
                logs.length === 0 ? <tr><td colSpan={4} className="py-12 text-center text-gray-400">No audit logs yet</td></tr> :
                logs.map(l => (
                  <tr key={l._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-medium">{l.action}</td>
                    <td className="py-3 px-4 text-gray-600">{l.user?.name || 'System'}</td>
                    <td className="py-3 px-4 text-gray-500">{l.entity}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
