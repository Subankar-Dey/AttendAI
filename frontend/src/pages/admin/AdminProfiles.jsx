import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminProfiles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/profiles").then(res => {
      setUsers(res.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold">All Users</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {users.map(u => (
          <div key={u._id} className="border p-3 rounded shadow bg-white">
            <h2 className="font-semibold text-lg">{u.name}</h2>
            <p className="text-gray-600">{u.email}</p>
            <p className="text-sm">Role: {u.role}</p>
            <p className="text-sm">Department: {u.department?.name || '-'}</p>
            <p className="text-sm">Class: {u.class?.name || '-'}</p>
            <p className="text-xs text-gray-400 mt-2">ID: {u._id}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
