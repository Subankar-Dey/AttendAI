import { useState } from 'react'

export default function Requests() {
  const [reason, setReason] = useState('')
  const [date, setDate] = useState('')
  const [requests, setRequests] = useState([])
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim() || !date) return
    setRequests(prev => [{ id: Date.now(), date, reason, status: 'pending', time: new Date().toLocaleString() }, ...prev])
    setReason('')
    setDate('')
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const statusBadge = (status) => {
    const colors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' }
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors[status]}`}>{status}</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Correction Requests</h1>
        <p className="text-gray-500 text-sm">Request attendance corrections or report issues</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-xl">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">New Request</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date of Issue</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Reason</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} required placeholder="Explain why your attendance should be corrected..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            {submitted ? '✓ Submitted!' : 'Submit Request'}
          </button>
        </form>
      </div>

      {requests.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100"><h2 className="text-sm font-semibold text-gray-700">My Requests</h2></div>
          <div className="divide-y divide-gray-50">
            {requests.map(r => (
              <div key={r.id} className="p-4 hover:bg-gray-50/50">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">{new Date(r.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  {statusBadge(r.status)}
                </div>
                <p className="text-sm text-gray-500">{r.reason}</p>
                <p className="text-xs text-gray-400 mt-1">Submitted: {r.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
