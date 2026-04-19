import { useState } from 'react'
import api from '../../../services/api'

export default function AI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello Admin! I can help you with attendance insights, predictions, and generating reports. What would you like to know?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const quickPrompts = [
    { label: '📊 Show at-risk students', prompt: 'Show students with low attendance who are at risk' },
    { label: '📅 Generate timetable', prompt: 'Generate a timetable for CSE department' },
    { label: '⚠️ Detect anomalies', prompt: 'Detect any attendance anomalies this month' },
    { label: '📄 Export report', prompt: 'Generate monthly attendance report' },
  ]

  const handleSend = async (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/chat', { message: msg, role: 'admin' })
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.data?.response || 'I can help with that. This feature is being enhanced.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }])
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="text-gray-500 text-sm">AI-powered attendance management assistant</p>
      </div>

      {/* Quick Prompts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickPrompts.map((p, i) => (
          <button key={i} onClick={() => handleSend(p.prompt)}
            className="p-3 bg-white border border-gray-200 rounded-xl text-sm text-left hover:border-blue-300 hover:bg-blue-50/50 transition">
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}} /><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}} /></div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend() }} className="flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about attendance, reports, predictions..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={loading} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
