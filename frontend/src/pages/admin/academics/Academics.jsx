import { useState, useEffect } from 'react'
import api from '../../../services/api'

/* ─── Tiny Toast ─── */
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

/* ─── Confirm Dialog ─── */
function Confirm({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xl">🗑️</div>
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
        </div>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
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

/* ─── Modal ─── */
function Modal({ open, title, onClose, onSubmit, submitting, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md" style={{ animation: 'fadeSlideDown 0.2s ease' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={onSubmit} className="px-6 py-5 space-y-4">
          {children}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

/* ════════════════════════════════════════ */
export default function Academics() {
  const [tab, setTab] = useState('departments')
  const [departments, setDepartments] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])

  // Modal state
  const [modal, setModal] = useState({ open: false, type: '', editing: null })
  const [form, setForm] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Delete confirm
  const [confirm, setConfirm] = useState({ open: false, id: null, type: '', label: '' })
  const [deleting, setDeleting] = useState(false)

  /* ── Toast helper ── */
  const toast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  /* ── Fetch all ── */
  const fetchAll = async () => {
    setLoading(true)
    try {
      const [dR, cR, sR] = await Promise.all([
        api.get('/departments'), api.get('/classes'), api.get('/subjects')
      ])
      setDepartments(dR.data.data?.departments || [])
      setClasses(cR.data.data?.classes || [])
      setSubjects(sR.data.data?.subjects || [])
    } catch { toast('Failed to load data', 'error') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  /* ── Open modal ── */
  const openCreate = (type) => {
    setForm({})
    setModal({ open: true, type, editing: null })
  }

  const openEdit = (type, item) => {
    if (type === 'departments') setForm({ name: item.name, code: item.code, description: item.description || '' })
    if (type === 'classes')     setForm({ name: item.name, section: item.section || '', year: item.year || '', department: item.department?._id || item.department || '' })
    if (type === 'subjects')    setForm({ name: item.name, code: item.code, class: item.class?._id || item.class || '', description: item.description || '' })
    setModal({ open: true, type, editing: item })
  }

  const closeModal = () => setModal({ open: false, type: '', editing: null })

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const { type, editing } = modal
    const endpoint = `/${type}`
    try {
      if (editing) {
        await api.put(`${endpoint}/${editing._id}`, form)
        toast(`${type.slice(0, -1)} updated successfully`)
      } else {
        await api.post(endpoint, form)
        toast(`${type.slice(0, -1)} created successfully`)
      }
      await fetchAll()
      closeModal()
    } catch (err) {
      toast(err.response?.data?.message || 'Operation failed', 'error')
    } finally { setSubmitting(false) }
  }

  /* ── Delete ── */
  const askDelete = (type, id, label) => setConfirm({ open: true, type, id, label })

  const handleDelete = async () => {
    setDeleting(true)
    const endpoint = `/${confirm.type}/${confirm.id}`
    try {
      await api.delete(endpoint)
      toast(`${confirm.label} deleted successfully`)
      await fetchAll()
      setConfirm({ open: false, id: null, type: '', label: '' })
    } catch (err) {
      toast(err.response?.data?.message || 'Delete failed', 'error')
    } finally { setDeleting(false) }
  }

  /* ── Add button label ── */
  const addLabel = { departments: '+ Add Department', classes: '+ Add Class', subjects: '+ Add Subject' }

  const tabs = [
    { key: 'departments', label: 'Departments', count: departments.length },
    { key: 'classes',     label: 'Classes',     count: classes.length },
    { key: 'subjects',    label: 'Subjects',     count: subjects.length },
  ]

  /* ────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <Toast toasts={toasts} />

      <Confirm
        open={confirm.open}
        title="Delete Confirmation"
        message={`Are you sure you want to delete "${confirm.label}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, type: '', label: '' })}
        loading={deleting}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Academic Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage departments, classes and subjects</p>
        </div>
        <button
          onClick={() => openCreate(tab)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm shadow-blue-200"
        >
          {addLabel[tab]}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t.label} <span className="ml-1 text-xs opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">

            {/* ── Departments ── */}
            {tab === 'departments' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {departments.map((d, i) => (
                    <tr key={d._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{d.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-mono font-bold">{d.code}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{d.description || <span className="text-gray-300 italic">No description</span>}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit('departments', d)} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                          <button onClick={() => askDelete('departments', d._id, d.name)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {departments.length === 0 && (
                    <tr><td colSpan={5} className="py-16 text-center text-gray-400">
                      <div className="text-4xl mb-2">🏫</div>
                      No departments yet. Click <strong>+ Add Department</strong> to get started.
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ── Classes ── */}
            {tab === 'classes' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Section</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Year</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Teacher</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classes.map((c, i) => (
                    <tr key={c._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{c.name}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-xs font-bold">{c.section || '-'}</span></td>
                      <td className="py-3 px-4 text-gray-600">{c.year || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{c.department?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{c.classTeacher?.name || <span className="text-gray-300 italic">Unassigned</span>}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit('classes', c)} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                          <button onClick={() => askDelete('classes', c._id, c.name)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {classes.length === 0 && (
                    <tr><td colSpan={7} className="py-16 text-center text-gray-400">
                      <div className="text-4xl mb-2">📚</div>
                      No classes yet. Click <strong>+ Add Class</strong> to get started.
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

            {/* ── Subjects ── */}
            {tab === 'subjects' && (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Code</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Class</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">Description</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {subjects.map((s, i) => (
                    <tr key={s._id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 text-gray-400 text-xs">{i + 1}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{s.name}</td>
                      <td className="py-3 px-4"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-mono font-bold">{s.code}</span></td>
                      <td className="py-3 px-4 text-gray-500">{s.class?.name || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{s.description || <span className="text-gray-300 italic">-</span>}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit('subjects', s)} className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition">Edit</button>
                          <button onClick={() => askDelete('subjects', s._id, s.name)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {subjects.length === 0 && (
                    <tr><td colSpan={6} className="py-16 text-center text-gray-400">
                      <div className="text-4xl mb-2">📖</div>
                      No subjects yet. Click <strong>+ Add Subject</strong> to get started.
                    </td></tr>
                  )}
                </tbody>
              </table>
            )}

          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      <Modal
        open={modal.open}
        title={`${modal.editing ? 'Edit' : 'Create'} ${modal.type === 'departments' ? 'Department' : modal.type === 'classes' ? 'Class' : 'Subject'}`}
        onClose={closeModal}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {/* Department fields */}
        {modal.type === 'departments' && (<>
          <Field label="Department Name" required>
            <input className={inputCls} required value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Computer Science" />
          </Field>
          <Field label="Code" required>
            <input className={inputCls} required value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CSE" maxLength={10} />
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={3} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description..." />
          </Field>
        </>)}

        {/* Class fields */}
        {modal.type === 'classes' && (<>
          <Field label="Class Name" required>
            <input className={inputCls} required value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. CSE-A" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section">
              <input className={inputCls} value={form.section || ''} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} placeholder="e.g. A" maxLength={5} />
            </Field>
            <Field label="Year">
              <input className={inputCls} type="number" value={form.year || ''} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2024" min="2000" max="2099" />
            </Field>
          </div>
          <Field label="Department" required>
            <select className={inputCls} required value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
              <option value="">Select department...</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
            </select>
          </Field>
        </>)}

        {/* Subject fields */}
        {modal.type === 'subjects' && (<>
          <Field label="Subject Name" required>
            <input className={inputCls} required value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Data Structures" />
          </Field>
          <Field label="Subject Code" required>
            <input className={inputCls} required value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CS201" maxLength={15} />
          </Field>
          <Field label="Class" required>
            <select className={inputCls} required value={form.class || ''} onChange={e => setForm(f => ({ ...f, class: e.target.value }))}>
              <option value="">Select class...</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <textarea className={inputCls} rows={2} value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional..." />
          </Field>
        </>)}
      </Modal>

      <style>{`
        @keyframes fadeSlideDown { from { opacity:0; transform:translateY(-8px) scale(0.97) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes fadeSlideUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
