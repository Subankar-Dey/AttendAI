import { useState } from 'react'

export default function Notifications() {
  const [message, setMessage] = useState('')
  const [target, setTarget] = useState('all')
  const [sent, setSent] = useState([])

  const handleSend = (e) => {
    e.preventDefault()
    if (!message.trim()) return
    setSent(prev => [{ id: Date.now(), message, target, time: new Date().toLocaleString() }, ...prev])
    setMessage('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm">Send announcements and alerts</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Send Notification</h2>
        <form onSubmit={handleSend} className="space-y-4">
          <select value={target} onChange={e => setTarget(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Users</option>
            <option value="students">Students Only</option>
            <option value="staff">Staff Only</option>
          </select>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Type your message..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            Send Notification
          </button>
        </form>
      </div>

      {sent.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Sent Notifications</h2>
          <div className="space-y-3">
            {sent.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">To: {n.target} • {n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
