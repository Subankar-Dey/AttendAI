import { useState } from 'react'
import api from '../../services/api'

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I can answer questions about your attendance. Try asking "What is my attendance %?" or "How many classes can I miss?"' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const quickPrompts = [
    { label: '📊 My attendance %', prompt: 'What is my current attendance percentage?' },
    { label: '🔢 Classes I can miss', prompt: 'How many classes can I miss and still stay above 75%?' },
    { label: '📈 My prediction', prompt: 'Predict my attendance trend for this semester' },
    { label: '📄 Download report', prompt: 'Generate my attendance report as PDF' },
  ]

  const handleSend = async (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post('/ai/chat', { message: msg, role: 'student' })
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.data?.response || 'Let me check that for you.' }])
    } catch { setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong.' }]) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-500 text-sm">Ask anything about your attendance</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {quickPrompts.map((p, i) => (
          <button key={i} onClick={() => handleSend(p.prompt)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:border-blue-300 hover:bg-blue-50/50 transition">{p.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md text-sm text-gray-400">Thinking...</div></div>}
        </div>
        <div className="border-t border-gray-100 p-4">
          <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your attendance..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={loading} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">Send</button>
          </form>
        </div>
      </div>
    </div>
  )
}
