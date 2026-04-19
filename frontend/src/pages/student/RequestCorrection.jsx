import { useState } from 'react';
import api from '../../services/api';

export default function RequestCorrection({ attendanceId }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    await api.post('/requests', {
      type: 'ATTENDANCE_CORRECTION',
      data: { attendanceId, reason }
    });
    setLoading(false);
    setSuccess(true);
    setReason('');
  };

  return (
    <div className="p-5 max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-2">Request Attendance Correction</h2>
      <form onSubmit={submitRequest} className="space-y-3">
        <textarea
          className="w-full border rounded p-2"
          placeholder="Reason for correction"
          value={reason}
          onChange={e => setReason(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading || !reason}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
        {success && <div className="text-green-600 mt-2">Request sent!</div>}
      </form>
    </div>
  );
}
