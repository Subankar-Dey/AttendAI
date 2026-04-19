import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function ViewClasses() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/classes')
        setClasses(res.data.data?.classes || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-500 text-sm">View assigned classes and student lists</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map(c => (
          <div key={c._id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold text-sm">{c.name?.charAt(0)}</div>
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-xs text-gray-500">Section {c.section || '-'} • {c.year || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Teacher: {c.classTeacher?.name || 'Unassigned'}</span>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No classes assigned yet</div>
        )}
      </div>
    </div>
  )
}
