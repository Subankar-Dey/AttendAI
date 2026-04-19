import { useState, useEffect, useCallback } from 'react'
import api from '../../../services/api'

/* ── Toast ── */
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          style={{ animation: 'fadeSlideUp 0.3s ease' }}>
          {t.type === 'success' ? '✅' : '❌'} {t.msg}
        </div>
      ))}
    </div>
  )
}

/* ── Confirm Dialog ── */
function Confirm({ open, onConfirm, onCancel, loading, label }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" style={{ animation: 'fadeSlideDown 0.2s ease' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">🗑️</div>
          <h3 className="font-bold text-gray-900 text-lg">Delete Notification</h3>
        </div>
        <p className="text-gray-500 text-sm mb-6">
          Are you sure you want to delete <strong>"{label}"</strong>? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Edit Modal ── */
function EditModal({ open, data, onClose, onSave, saving }) {
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal' })

  useEffect(() => {
    if (data) setForm({ title: data.title || '', message: data.message || '', priority: data.priority || 'normal' })
  }, [data])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg" style={{ animation: 'fadeSlideDown 0.2s ease' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">✏️ Edit Notification</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Notification title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Notification message"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
            <select
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            >
              <option value="low">🟢 Low</option>
              <option value="normal">🔵 Normal</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
            <button onClick={() => onSave(form)} disabled={saving || !form.title.trim() || !form.message.trim()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Priority badge ── */
const PRIORITY = {
  low:    { label: 'Low',    cls: 'bg-green-100 text-green-700' },
  normal: { label: 'Normal', cls: 'bg-blue-100 text-blue-700' },
  high:   { label: 'High',   cls: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'Urgent', cls: 'bg-red-100 text-red-700' },
}

/* ── Target badge ── */
const TARGET_LABEL = { 
  all: '👥 All Users', 
  students: '🎓 Students', 
  staff: '👨‍🏫 Staff',
  individual: '👤 Individual'
}

/* ════════════════════════════════════════ */
export default function Notifications() {
  const [form, setForm] = useState({ title: '', message: '', target: 'all', priority: 'normal', recipientId: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState([])
  const [loadingSent, setLoadingSent] = useState(true)
  
  // User Search
  const [userSearch, setUserSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [toasts, setToasts] = useState([])

  // Edit
  const [editModal, setEditModal] = useState({ open: false, data: null })
  const [saving, setSaving] = useState(false)

  // Delete
  const [confirm, setConfirm] = useState({ open: false, id: null, label: '' })
  const [deleting, setDeleting] = useState(false)

  /* ── Toast helper ── */
  const toast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  /* ── Fetch sent notifications ── */
  const fetchSent = useCallback(async () => {
    setLoadingSent(true)
    try {
      const res = await api.get('/notifications/sent')
      setSent(res.data.data?.notifications || [])
    } catch { toast('Failed to load notifications', 'error') }
    finally { setLoadingSent(false) }
  }, [])

  useEffect(() => { fetchSent() }, [fetchSent])

  /* ── User Search Effect ── */
  useEffect(() => {
    if (form.target !== 'individual' || userSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/users?search=${userSearch}&limit=5`);
        setSearchResults(res.data.data?.users || []);
      } catch (err) { console.error(err); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [userSearch, form.target]);

  /* ── Send ── */
  const handleSend = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return
    setSending(true)
    try {
      await api.post('/notifications/send', form)
      toast('Notification sent successfully! 🔔')
      setForm({ title: '', message: '', target: 'all', priority: 'normal', recipientId: '' })
      setUserSearch('')
      setSelectedUser(null)
      await fetchSent()
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send', 'error')
    } finally { setSending(false) }
  }

  /* ── Edit ── */
  const handleSave = async (formData) => {
    setSaving(true)
    try {
      await api.put(`/notifications/${editModal.data._id}`, formData)
      toast('Notification updated successfully')
      setEditModal({ open: false, data: null })
      await fetchSent()
    } catch (err) {
      toast(err.response?.data?.message || 'Update failed', 'error')
    } finally { setSaving(false) }
  }

  /* ── Delete ── */
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/notifications/${confirm.id}`)
      toast('Notification deleted')
      setConfirm({ open: false, id: null, label: '' })
      await fetchSent()
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error')
    } finally { setDeleting(false) }
  }

  const inputCls = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-6">
      <Toast toasts={toasts} />
      <Confirm
        open={confirm.open} label={confirm.label} loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, label: '' })}
      />
      <EditModal
        open={editModal.open} data={editModal.data} saving={saving}
        onClose={() => setEditModal({ open: false, data: null })}
        onSave={handleSave}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 text-sm mt-0.5">Send announcements and alerts to users</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* ── Compose Panel ── */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-20">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-xl">📢</span> Compose Notification
            </h2>
            <form onSubmit={handleSend} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
                <input className={inputCls} required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Important Meeting Tomorrow" />
              </div>

              {/* Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Send To</label>
                <select className={inputCls} value={form.target} onChange={e => {
                  setForm(f => ({ ...f, target: e.target.value, recipientId: '' }));
                  setSelectedUser(null);
                  setUserSearch('');
                }}>
                  <option value="all">👥 All Users</option>
                  <option value="students">🎓 Students Only</option>
                  <option value="staff">👨‍🏫 Staff Only</option>
                  <option value="individual">👤 Specific User</option>
                </select>
              </div>

              {/* Individual User Search */}
              {form.target === 'individual' && (
                <div className="relative animate-[fadeSlideDown_0.2s_ease]">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Recipient <span className="text-red-500">*</span></label>
                  {!selectedUser ? (
                    <div className="relative">
                      <input 
                        className={inputCls}
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Search by name, email or ID..."
                        autoFocus
                      />
                      {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        </div>
                      )}
                      
                      {searchResults.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                          {searchResults.map(u => (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setForm(f => ({ ...f, recipientId: u._id }));
                                setUserSearch('');
                                setSearchResults([]);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0"
                            >
                              <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email} • {u.role}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {selectedUser.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-blue-900">{selectedUser.name}</p>
                          <p className="text-xs text-blue-700">{selectedUser.email}</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => { setSelectedUser(null); setForm(f => ({ ...f, recipientId: '' })) }}
                        className="p-1 px-2 text-xs font-bold text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'normal', 'high', 'urgent'].map(p => (
                    <button key={p} type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize border transition ${
                        form.priority === p
                          ? p === 'low' ? 'bg-green-500 text-white border-green-500'
                            : p === 'normal' ? 'bg-blue-500 text-white border-blue-500'
                            : p === 'high' ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-red-500 text-white border-red-500'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message <span className="text-red-500">*</span></label>
                <textarea className={`${inputCls} resize-none`} required rows={5} value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  placeholder="Type your announcement or alert..." />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.message.length} chars</p>
              </div>

              <button type="submit" disabled={sending || !form.title.trim() || !form.message.trim() || (form.target === 'individual' && !form.recipientId)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><span>🔔</span> Send Notification</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Sent Notifications List ── */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <span>📬</span> Sent Notifications
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{sent.length}</span>
              </h2>
              <button onClick={fetchSent} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition" title="Refresh">
                🔄
              </button>
            </div>

            {loadingSent ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : sent.length === 0 ? (
              <div className="py-20 text-center text-gray-400">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-medium">No notifications sent yet</p>
                <p className="text-sm mt-1">Use the compose panel to send your first notification.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {sent.map(n => {
                  const pBadge = PRIORITY[n.priority] || PRIORITY.normal
                  return (
                    <div key={n._id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors group">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5 ${
                          n.priority === 'urgent' ? 'bg-red-100' :
                          n.priority === 'high'   ? 'bg-orange-100' :
                          'bg-blue-100'
                        }`}>
                          {n.priority === 'urgent' ? '🚨' : n.priority === 'high' ? '⚠️' : '📣'}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{n.title}</p>
                              <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditModal({ open: true, data: n })}
                                className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                                title="Edit"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => setConfirm({ open: true, id: n._id, label: n.title })}
                                className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition"
                                title="Delete"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pBadge.cls}`}>{pBadge.label}</span>
                            <span className="text-xs text-gray-400">{TARGET_LABEL[n.target] || '👥 All Users'}</span>
                            <span className="text-xs text-gray-300">•</span>
                            <span className="text-xs text-gray-400">
                              {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {n.readBy?.length > 0 && (
                              <>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-green-600">👁️ {n.readBy.length} read</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-8px) scale(0.97) } to { opacity:1; transform:none } }
        @keyframes fadeSlideUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
      `}</style>
    </div>
  )
}
