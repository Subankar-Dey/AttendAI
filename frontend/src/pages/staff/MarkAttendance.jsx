import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function MarkAttendance() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get('/classes')
        setClasses(res.data.data?.classes || [])
      } catch (err) { console.error(err) }
    }
    fetchClasses()
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    const fetchStudents = async () => {
      try {
        const res = await api.get('/users', { params: { role: 'student' } })
        const classStudents = (res.data.data?.users || []).filter(u => u.class === selectedClass || u.class?._id === selectedClass)
        setStudents(classStudents)
        const initial = {}
        classStudents.forEach(s => { initial[s._id] = 'present' })
        setAttendance(initial)
      } catch (err) { console.error(err) }
    }
    fetchStudents()
  }, [selectedClass])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const records = Object.entries(attendance).map(([student, status]) => ({
        student, class: selectedClass, date, status
      }))
      await api.post('/attendance/mark', { attendance: records })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
    } catch (err) { alert(err.response?.data?.message || 'Error marking attendance') }
    finally { setLoading(false) }
  }

  const markAll = (status) => {
    const updated = {}
    students.forEach(s => { updated[s._id] = status })
    setAttendance(updated)
  }

  const statusColors = { present: 'bg-green-100 text-green-700 border-green-300', absent: 'bg-red-100 text-red-700 border-red-300', late: 'bg-yellow-100 text-yellow-700 border-yellow-300' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
        <p className="text-gray-500 text-sm">Select class, date and mark student attendance</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select Class</option>
          {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {students.length > 0 && (
        <>
          <div className="flex gap-2">
            <button onClick={() => markAll('present')} className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition">All Present</button>
            <button onClick={() => markAll('absent')} className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition">All Absent</button>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Student</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Roll No</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s, i) => (
                  <tr key={s._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4 text-gray-500">{s.rollNumber || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1.5">
                        {['present', 'absent', 'late'].map(status => (
                          <button key={status} onClick={() => setAttendance(p => ({...p, [s._id]: status}))}
                            className={`px-3 py-1 rounded-lg text-xs font-medium border transition capitalize ${attendance[s._id] === status ? statusColors[status] : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'}`}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Submitting...' : submitted ? '✓ Submitted!' : 'Submit Attendance'}
            </button>
          </div>
        </>
      )}

      {selectedClass && students.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">No students found in this class</div>
      )}
    </div>
  )
}
