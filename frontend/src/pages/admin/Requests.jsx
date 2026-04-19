import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const res = await api.get('/requests');
    setRequests(res.data.data);
    setLoading(false);
  };

  const approve = async (id) => {
    await api.put(`/requests/${id}/approve`);
    fetchRequests();
  };

  const reject = async (id) => {
    const note = prompt('Reason for rejection?');
    await api.put(`/requests/${id}/reject`, { note });
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">Approval Dashboard</h1>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Type</th>
            <th>User</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r._id}>
              <td>{r.type}</td>
              <td>{r.requestedBy?.name}</td>
              <td>{r.status}</td>
              <td>
                {r.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approve(r._id)}
                      className="bg-green-500 text-white px-2 py-1 mr-2 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(r._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
