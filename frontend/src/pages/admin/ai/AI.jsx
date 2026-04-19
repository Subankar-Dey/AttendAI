import { useState, useRef, useEffect } from 'react'
import api from '../../../services/api'

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^• (.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul class="list-disc ml-4 space-y-0.5">$1</ul>')
    .replace(/\n/g, '<br/>')
}

const QUICK_PROMPTS = [
  { label: "📊 At-risk students",      prompt: "Which students are at risk of falling below 75%?" },
  { label: "📋 Today's absentees",     prompt: "Show today's absentees" },
  { label: "📈 Attendance trend",      prompt: "Show attendance trend for the past month" },
  { label: "📄 7-day report",          prompt: "Give me a 7-day attendance report" },
  { label: "👥 Student overview",      prompt: "How many students do we have?" },
  { label: "🕐 Late arrivals",         prompt: "Show late students today" },
]

const SOURCE_BADGE = {
  local:    { label: '⚡ Instant',   cls: 'bg-green-100 text-green-700' },
  openai:   { label: '🤖 AI',        cls: 'bg-blue-100 text-blue-700' },
  fallback: { label: '💡 Suggested', cls: 'bg-yellow-100 text-yellow-700' },
}

export default function AI() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hello Admin! I'm **AttendAI** with real-time database insights.\n\nI can help you with:\n• 📊 At-risk students & predictions\n• 📋 Today's absentees\n• 📈 Attendance trends & reports\n• 👥 System overview statistics\n• 🕐 Late arrival monitoring\n\nClick a quick action or ask me anything!",
      source: 'local'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/chat', { message: msg, role: 'admin' })
      const data = res.data.data
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data?.response || 'Let me check that for you.',
        source: data?.source || 'local',
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '❌ Sorry, something went wrong. Please try again.',
        source: 'fallback'
      }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Real-time attendance intelligence from your database
          <span className="ml-2 inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ⚡ Instant Responses
          </span>
        </p>
      </div>

      {/* Quick prompt grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QUICK_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p.prompt)}
            disabled={loading}
            className="p-3 bg-white border border-gray-200 rounded-xl text-sm text-left hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 disabled:opacity-40 shadow-sm font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '480px' }}>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-1">AI</div>
              )}
              <div className="flex flex-col gap-1 max-w-[78%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                  dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? renderMarkdown(m.text) : m.text }}
                />
                {m.role === 'assistant' && m.source && SOURCE_BADGE[m.source] && (
                  <span className={`text-xs px-2 py-0.5 rounded-full w-fit font-medium ${SOURCE_BADGE[m.source].cls}`}>
                    {SOURCE_BADGE[m.source].label}
                  </span>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold flex-shrink-0 mt-1">A</div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">AI</div>
              <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-100 p-3">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about attendance, predictions, reports… (Enter to send)"
              rows={1}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5 ml-1">
            ⚡ Instant for common queries · 🤖 OpenAI for complex questions
          </p>
        </div>
      </div>
    </div>
  )
}
