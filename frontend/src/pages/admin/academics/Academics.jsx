import { useState, useEffect } from 'react'
import api from '../../../services/api'

export default function Academics() {
  const [tab, setTab] = useState('departments')
  const [departments, setDepartments] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [deptRes, classRes, subRes] = await Promise.all([
          api.get('/departments'), api.get('/classes'), api.get('/subjects')
        ])
        setDepartments(deptRes.data.data?.departments || [])
        setClasses(classRes.data.data?.classes || [])
        setSubjects(subRes.data.data?.subjects || [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchAll()
  }, [])

  const tabs = [
    { key: 'departments', label: 'Departments', count: departments.length },
    { key: 'classes', label: 'Classes', count: classes.length },
    { key: 'subjects', label: 'Subjects', count: subjects.length },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic Management</h1>
        <p className="text-gray-500 text-sm">Manage departments, classes and subjects</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label} <span className="ml-1 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {tab === 'departments' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {departments.map(d => <tr key={d._id} className="hover:bg-gray-50/50"><td className="py-3 px-4 font-medium">{d.name}</td><td className="py-3 px-4"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">{d.code}</span></td><td className="py-3 px-4 text-gray-500">{d.description || '-'}</td></tr>)}
                  {departments.length === 0 && <tr><td colSpan={3} className="py-12 text-center text-gray-400">No departments yet</td></tr>}
                </tbody>
              </table>
            )}
            {tab === 'classes' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Section</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Year</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Teacher</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {classes.map(c => <tr key={c._id} className="hover:bg-gray-50/50"><td className="py-3 px-4 font-medium">{c.name}</td><td className="py-3 px-4">{c.section || '-'}</td><td className="py-3 px-4">{c.year || '-'}</td><td className="py-3 px-4 text-gray-500">{c.classTeacher?.name || 'Unassigned'}</td></tr>)}
                  {classes.length === 0 && <tr><td colSpan={4} className="py-12 text-center text-gray-400">No classes yet</td></tr>}
                </tbody>
              </table>
            )}
            {tab === 'subjects' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th><th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {subjects.map(s => <tr key={s._id} className="hover:bg-gray-50/50"><td className="py-3 px-4 font-medium">{s.name}</td><td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-mono">{s.code}</span></td><td className="py-3 px-4 text-gray-500">{s.class?.name || '-'}</td></tr>)}
                  {subjects.length === 0 && <tr><td colSpan={3} className="py-12 text-center text-gray-400">No subjects yet</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
