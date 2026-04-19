import { useEffect, useState } from 'react';
import api from '../../services/api';

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
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [processingId, setProcessingId] = useState(null);

  const toast = (msg, type = 'success') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      setRequests(res.data.data || []);
    } catch {
      toast('Failed to load requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      await api.put(`/requests/${id}/approve`);
      toast('Request approved successfully!');
      fetchRequests();
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const decline = (id) => {
    setProcessingId(id);
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleConfirmReject = async () => {
    if (!declineReason.trim()) return toast('Please provide a reason', 'error');
    
    try {
      await api.put(`/requests/${processingId}/reject`, { note: declineReason });
      toast('Request declined');
      setShowDeclineModal(false);
      fetchRequests();
    } catch (err) {
      toast(err.response?.data?.message || 'Action failed', 'error');
    }
  };

  const priorityBadge = (priority) => {
    const colors = { 
      low: 'bg-gray-100 text-gray-600 border-gray-200', 
      medium: 'bg-blue-100 text-blue-600 border-blue-200', 
      high: 'bg-red-100 text-red-600 border-red-200' 
    }
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[priority || 'medium']}`}>
        {priority || 'medium'}
      </span>
    )
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(r => 
    activeTab === 'pending' ? r.status === 'pending' : r.status !== 'pending'
  );

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    processed: requests.filter(r => r.status !== 'pending').length
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <Toast toasts={toasts} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Request Approval Dashboard</h1>
        <p className="text-gray-500 text-sm">Review and respond to correction and student creation requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${activeTab === 'pending' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Pending Actions
          <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px]">{stats.pending}</span>
          {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
        </button>
        <button 
          onClick={() => setActiveTab('processed')}
          className={`pb-3 px-4 text-sm font-semibold transition-all relative ${activeTab === 'processed' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          History
          <span className="ml-2 bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full text-[10px]">{stats.processed}</span>
          {activeTab === 'processed' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />}
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center shadow-sm">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 font-medium italic">No {activeTab} requests found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredRequests.map(r => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-blue-200 transition-all group relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                      {r.type?.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                      r.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {r.status}
                    </span>
                    {priorityBadge(r.priority)}
                  </div>
                  
                  <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                      {r.requestedBy?.name?.charAt(0)}
                    </div>
                    {r.requestedBy?.name}
                    <span className="text-xs font-normal text-gray-400">({r.requestedBy?.email})</span>
                  </h3>
                  
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                    {r.data?.date && (
                      <p className="text-sm">
                        <span className="font-bold text-gray-600">Affected Date:</span> {new Date(r.data.date).toLocaleDateString()}
                      </p>
                    )}
                    <p className="text-sm italic text-gray-700">
                      <span className="font-bold text-gray-600 not-italic mr-2">Reason:</span>
                      "{r.data?.reason || r.reason}"
                    </p>
                  </div>

                  {r.status !== 'pending' && (
                    <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                      <p>Reviewed By: <span className="font-medium text-gray-600">{r.reviewedBy?.name || 'System'}</span></p>
                      <p>At: {new Date(r.reviewedAt).toLocaleString()}</p>
                      {r.adminNote && <p className="text-red-500 font-medium italic">Note: {r.adminNote}</p>}
                    </div>
                  )}
                </div>

                {r.status === 'pending' && (
                  <div className="flex md:flex-col gap-2 pt-2 md:pt-0">
                    <button 
                      onClick={() => approve(r._id)}
                      className="flex-1 md:w-32 bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-700 transition shadow-sm shadow-green-100"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => decline(r._id)}
                      className="flex-1 md:w-32 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 border border-red-100 transition"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
              
              <div className="absolute top-0 right-0 p-3 text-[10px] text-gray-300 font-mono">
                ID: {r._id.slice(-8)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Decline Request</h2>
              <button onClick={() => setShowDeclineModal(false)} className="text-gray-400 hover:text-gray-600 transition">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Provide a reason for declining this request. This will be sent as a notification to the student.</p>
              <textarea
                autoFocus
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="flex-[2] px-4 py-3 bg-red-600 text-white rounded-2xl text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-200"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}
