import { useState, useEffect } from 'react'
import api from '../../../services/api'
import { getSeverityColor } from '../../../utils/helpers'

export default function Attendance() {
  const [records, setRecords] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('records')
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [showMarkModal, setShowMarkModal] = useState(false)
  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [classStudents, setClassStudents] = useState([])
  const [manualAttendance, setManualAttendance] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])

  const toast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }

  const fetchRecords = async () => {
    setLoading(true)
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

  useEffect(() => {
    fetchRecords()
  }, [dateFilter])

  useEffect(() => {
    if (showMarkModal) {
      api.get('/classes').then(res => setClasses(res.data.data?.classes || []))
    }
  }, [showMarkModal])

  useEffect(() => {
    if (!selectedClass) return
    api.get('/users', { params: { role: 'student' } }).then(res => {
      const filtered = (res.data.data?.users || []).filter(u => u.class?._id === selectedClass || u.class === selectedClass)
      setClassStudents(filtered)
      const initial = {}
      filtered.forEach(s => { initial[s._id] = 'present' })
      setManualAttendance(initial)
    })
  }, [selectedClass])

  const handleMarkSubmit = async () => {
    setSubmitting(true)
    try {
      const entries = Object.entries(manualAttendance).map(([student, status]) => ({
        student, class: selectedClass, date: dateFilter, status
      }))
      await api.post('/attendance/mark', { attendance: entries })
      toast('Attendance marked successfully!')
      setShowMarkModal(false)
      fetchRecords()
    } catch (err) { toast('Failed to mark attendance', 'error') }
    finally { setSubmitting(false) }
  }

  const handleQuickStatusUpdate = async (studentId, status) => {
    try {
      await api.post('/attendance/mark', { 
        attendance: [{ student: studentId, date: dateFilter, status }] 
      })
      toast('Status updated')
      fetchRecords()
    } catch (err) { toast('Update failed', 'error') }
  }

  const statusBadge = (status, studentId = null) => {
    const colors = { present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700', late: 'bg-yellow-100 text-yellow-700' }
    
    if (studentId) {
      return (
        <select 
          value={status} 
          onChange={(e) => handleQuickStatusUpdate(studentId, e.target.value)}
          className={`px-2 py-0.5 rounded-lg text-xs font-medium border-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${colors[status]}`}
        >
          {['present', 'absent', 'late'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status]}`}>{status}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 text-sm">View records and identify defaulters</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
          {['records', 'defaulters'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'defaulters' ? `Below 75% (${defaulters.length})` : 'Records'}
            </button>
          ))}
        </div>
        
        {tab === 'records' && (
          <button 
            onClick={() => setShowMarkModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100"
          >
            <span>➕</span> Mark Attendance
          </button>
        )}
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
                         <td className="py-3 px-4">{statusBadge(r.status, r.student?._id)}</td>
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

      <MarkAttendanceModal 
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        classes={classes}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        students={classStudents}
        attendance={manualAttendance}
        setAttendance={setManualAttendance}
        onSubmit={handleMarkSubmit}
        submitting={submitting}
        date={dateFilter}
      />

      <Toast toasts={toasts} />
    </div>
  )
}

function MarkAttendanceModal({ isOpen, onClose, classes, selectedClass, setSelectedClass, students, attendance, setAttendance, onSubmit, submitting, date }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Manual Attendance Entry</h2>
            <p className="text-xs text-gray-400 mt-1">Marking for: {new Date(date).toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">✕</button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Class</label>
            <select 
              value={selectedClass} 
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            >
              <option value="">Choose a class...</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {selectedClass && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <h3 className="text-sm font-bold text-gray-700">Student List</h3>
                 <div className="flex gap-2">
                   <button onClick={() => {
                     const upd = {}; students.forEach(s => upd[s._id] = 'present'); setAttendance(upd);
                   }} className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">All Present</button>
                   <button onClick={() => {
                     const upd = {}; students.forEach(s => upd[s._id] = 'absent'); setAttendance(upd);
                   }} className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">All Absent</button>
                 </div>
               </div>
               
               <div className="divide-y divide-gray-50 border border-gray-50 rounded-2xl overflow-hidden">
                 {students.length === 0 ? (
                   <div className="p-10 text-center text-gray-400 text-sm italic">No students in this class</div>
                 ) : students.map(s => (
                   <div key={s._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                     <span className="text-sm font-medium text-gray-900">{s.name}</span>
                     <div className="flex gap-1">
                       {['present', 'absent', 'late'].map(st => (
                         <button 
                           key={st}
                           onClick={() => setAttendance(p => ({...p, [s._id]: st}))}
                           className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition
                             ${attendance[s._id] === st 
                               ? (st==='present' ? 'bg-green-600 text-white' : st==='absent' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white')
                               : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                         >
                           {st.charAt(0)}
                         </button>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-50 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition">Cancel</button>
          <button 
            disabled={!selectedClass || students.length === 0 || submitting}
            onClick={onSubmit} 
            className="flex-[2] px-4 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {submitting ? 'Processing...' : 'Submit Attendance'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-in slide-in-from-right duration-300 ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span> {t.msg}
        </div>
      ))}
    </div>
  )
}
