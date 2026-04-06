import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { MdPeople, MdSchool, MdAttachMoney, MdTrendingUp } from 'react-icons/md';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, students: 0, fees: 0, paid: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, studentsRes, feesRes] = await Promise.all([
          API.get('/auth/users'),
          API.get('/student'),
          API.get('/fee'),
        ]);
        const paid = feesRes.data.filter(f => f.status === 'paid').length;
        setStats({
          users: usersRes.data.length,
          students: studentsRes.data.length,
          fees: feesRes.data.length,
          paid,
        });
        setRecentUsers(usersRes.data.slice(0, 5));
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const roleBadge = (role) => <span className={`badge badge-${role}`}>{role}</span>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome back, {user?.name} 👋</h1>
        <p>Here's an overview of the College ERP System</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><MdPeople /></div>
          <div className="stat-info"><h3>{loading ? '...' : stats.users}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><MdSchool /></div>
          <div className="stat-info"><h3>{loading ? '...' : stats.students}</h3><p>Students Enrolled</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><MdAttachMoney /></div>
          <div className="stat-info"><h3>{loading ? '...' : stats.fees}</h3><p>Fee Records</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdTrendingUp /></div>
          <div className="stat-info"><h3>{loading ? '...' : stats.paid}</h3><p>Fees Paid</p></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Users</span>
        </div>
        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : recentUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No users yet</h3>
            <p>Register users to see them here</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
              <tbody>
                {recentUsers.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
