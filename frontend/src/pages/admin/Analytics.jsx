import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [feeMonthly, setFeeMonthly] = useState([]);
  const [feeStatus, setFeeStatus] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ov, fm, fs, att] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/fees'),
          api.get('/analytics/fees/status'),
          api.get('/analytics/attendance'),
        ]);
        setOverview(ov.data);
        // Format month labels nicely
        setFeeMonthly(fm.data.map(d => ({
          ...d,
          month: new Date(d.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        })));
        setFeeStatus(fs.data.filter(d => d.value > 0));
        setAttendanceData(att.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div className="page-container"><div className="spinner-wrapper"><div className="spinner" /></div></div>;

  const fmt = (n) => n >= 1000 ? `₹${(n / 1000).toFixed(1)}K` : `₹${n}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p>Insights on fees, attendance, and institutional performance</p>
      </div>

      {/* Overview Stats */}
      <div className="stats-grid">
        <StatCard icon="👩‍🎓" label="Total Students" value={overview?.totalStudents ?? 0} color="blue" />
        <StatCard icon="👨‍🏫" label="Total Faculty" value={overview?.totalFaculty ?? 0} color="purple" />
        <StatCard icon="💰" label="Fees Collected" value={fmt(overview?.totalFeesCollected ?? 0)} color="green" />
        <StatCard icon="⏳" label="Fees Pending" value={fmt(overview?.totalFeesPending ?? 0)} color="red" />
        <StatCard icon="📊" label="Avg Attendance" value={`${overview?.avgAttendance ?? 0}%`} color="cyan" />
      </div>

      {/* Charts Row 1 */}
      <div className="analytics-charts-row">
        {/* Monthly Fee Collection */}
        <div className="card chart-section" style={{ flex: 2 }}>
          <div className="card-header">
            <span className="card-title">📈 Monthly Fee Collection (Last 6 Months)</span>
          </div>
          {feeMonthly.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📉</div><h3>No fee data yet</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={feeMonthly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}
                  formatter={(v, n) => [`₹${v.toLocaleString()}`, n === 'collected' ? 'Collected' : 'Pending']}
                />
                <Bar dataKey="collected" fill="#22c55e" radius={[4, 4, 0, 0]} name="collected" />
                <Bar dataKey="pending" fill="#ef4444" radius={[4, 4, 0, 0]} name="pending" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><span style={{ color: '#22c55e' }}>■</span> Collected</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><span style={{ color: '#ef4444' }}>■</span> Pending</span>
          </div>
        </div>

        {/* Fee Status Distribution */}
        <div className="card chart-section" style={{ flex: 1 }}>
          <div className="card-header">
            <span className="card-title">🥧 Fee Status Distribution</span>
          </div>
          {feeStatus.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📊</div><h3>No data yet</h3></div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={feeStatus} cx="50%" cy="50%" outerRadius={80}
                  dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {feeStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Attendance Chart */}
      <div className="card chart-section" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">📚 Subject-wise Average Attendance</span>
        </div>
        {attendanceData.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No attendance data yet</h3><p>Faculty needs to mark attendance first.</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v) => [`${v}%`, 'Attendance']}
              />
              <Bar
                dataKey="percentage" radius={[4, 4, 0, 0]}
                fill="url(#attGradient)"
              />
              <defs>
                <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
        {/* 75% guideline text */}
        {attendanceData.length > 0 && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Minimum required attendance: 75%
          </p>
        )}
      </div>
    </div>
  );
}
