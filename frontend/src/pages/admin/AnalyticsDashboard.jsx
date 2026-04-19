import { useEffect, useState } from 'react';
import api from '../../services/api';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import PieChart from '../../components/charts/PieChart';

export default function AnalyticsDashboard() {
  const [trend, setTrend] = useState([]);
  const [dept, setDept] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await api.get('/dashboard/charts?days=14');
      setTrend(res.data.data.absenteesTrend || []);
      setDept(res.data.data.departmentWise || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div>Loading analytics...</div>;

  return (
    <div className="p-5 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Analytics Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-4 shadow">
          <LineChart
            data={trend}
            dataKey="absent"
            xKey="date"
            color="#ef4444"
            title="Absentees Trend (Last 14 Days)"
            height={300}
          />
        </div>
        <div className="bg-white rounded-xl p-4 shadow">
          <BarChart
            data={dept.map(d => ({ name: d._id, value: d.count }))}
            dataKey="value"
            xKey="name"
            color="#6366f1"
            title="Classes per Department"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}
