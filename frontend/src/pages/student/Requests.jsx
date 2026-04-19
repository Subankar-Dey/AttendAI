import { useState, useEffect } from 'react'
import api from '../../services/api'

/* ── Toast Notification ── */
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white animate-[fadeSlideUp_0.3s_ease] ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span> {t.msg}
        </div>
      ))}
    </div>
  )
}

export default function Requests() {
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toasts, setToasts] = useState([])

  const toast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests')
      setRequests(res.data.data || [])
    } catch (err) {
      toast('Failed to load requests', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason.trim() || !date || submitting) return

    setSubmitting(true)
    try {
      await api.post('/requests', {
        type: 'ATTENDANCE_CORRECTION',
        data: { date, reason }
      })
      toast('Correction request submitted successfully!')
      setReason('')
      setDate('')
      fetchRequests()
    } catch (err) {
      toast(err.response?.data?.message || 'Submission failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const statusBadge = (status) => {
    const colors = { 
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200', 
      approved: 'bg-green-100 text-green-700 border-green-200', 
      rejected: 'bg-red-100 text-red-700 border-red-200' 
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${colors[status]}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <Toast toasts={toasts} />
      
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Correction Requests</h1>
        <p className="text-gray-500 text-sm">Request attendance corrections or report errors to administration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-lg">📝</span> New Correction Request
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Issue</label>
                <input 
                  type="date" 
                  value={date} 
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)} 
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Detailed Reason</label>
                <textarea 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  rows={4} 
                  required 
                  placeholder="e.g. My attendance was marked absent but I was present in the second half..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed" 
                />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>

        {/* History Panel */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <span>📂</span> My Request History
                <span className="text-xs font-normal text-gray-400">({requests.length})</span>
              </h2>
              <button 
                onClick={fetchRequests} 
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition"
                title="Refresh"
              >
                🔄
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                <p className="text-sm text-gray-400">Loading your history...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-24 text-center">
                <div className="text-5xl mb-4">🍂</div>
                <p className="text-gray-400 text-sm font-medium">No requests found</p>
                <p className="text-xs text-gray-300 mt-1">When you submit a request, it will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {requests.map(r => (
                  <div key={r._id} className="p-5 hover:bg-gray-50/80 transition-colors group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-gray-900">
                            {new Date(r.data?.date).toLocaleDateString('en-IN', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </p>
                          {statusBadge(r.status)}
                        </div>
                        <p className="text-xs text-gray-400">
                          {r.type.replace(/_/g, ' ')} • Submitted {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mt-3 border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-all">
                      <p className="text-sm text-gray-700 leading-relaxed italic">"{r.data?.reason}"</p>
                    </div>
                    {r.adminNote && (
                      <div className="mt-3 flex gap-2 items-start pl-2 border-l-2 border-red-200">
                        <span className="text-xs font-bold text-red-600 mt-0.5">Note:</span>
                        <p className="text-xs text-gray-600 bg-red-50 p-2 rounded-lg flex-1">{r.adminNote}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
