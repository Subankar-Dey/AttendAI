import { useState } from 'react'

export default function Settings() {
  const [settings, setSettings] = useState({
    minAttendance: 75,
    workingDays: 5,
    sessionPerDay: 2,
    autoNotify: true,
    allowCorrections: true,
  })
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 text-sm">Configure attendance rules and system preferences</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Attendance (%)</label>
          <input type="number" value={settings.minAttendance} onChange={e => setSettings(p => ({...p, minAttendance: e.target.value}))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <p className="text-xs text-gray-400 mt-1">Students below this threshold will be flagged</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Working Days per Week</label>
          <input type="number" value={settings.workingDays} onChange={e => setSettings(p => ({...p, workingDays: e.target.value}))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sessions per Day</label>
          <input type="number" value={settings.sessionPerDay} onChange={e => setSettings(p => ({...p, sessionPerDay: e.target.value}))}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Auto Notify Defaulters</p>
            <p className="text-xs text-gray-400">Send alerts when attendance drops below threshold</p>
          </div>
          <button onClick={() => setSettings(p => ({...p, autoNotify: !p.autoNotify}))}
            className={`relative w-11 h-6 rounded-full transition ${settings.autoNotify ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoNotify ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-700">Allow Correction Requests</p>
            <p className="text-xs text-gray-400">Students can request attendance corrections</p>
          </div>
          <button onClick={() => setSettings(p => ({...p, allowCorrections: !p.allowCorrections}))}
            className={`relative w-11 h-6 rounded-full transition ${settings.allowCorrections ? 'bg-blue-600' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.allowCorrections ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <button onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
          {saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}
