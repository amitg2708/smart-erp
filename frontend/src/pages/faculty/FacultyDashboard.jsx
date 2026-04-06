import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { MdPeople, MdGrade, MdSchool } from 'react-icons/md';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ students: 0, results: 0 });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentsRes, resultsRes] = await Promise.all([API.get('/student'), API.get('/result')]);
        setStats({ students: studentsRes.data.length, results: resultsRes.data.length });
        setRecentResults(resultsRes.data.slice(0, 6));
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  const pct = (v, max) => Math.round((v / max) * 100);
  const gradeColor = (total) => total >= 80 ? 'var(--accent-green)' : total >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user?.name} 👨‍🏫</h1>
        <p>Faculty Dashboard — Manage student results and evaluations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><MdPeople /></div>
          <div className="stat-info"><h3>{loading ? '...' : stats.students}</h3><p>Total Students</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><MdGrade /></div>
          <div className="stat-info"><h3>{loading ? '...' : stats.results}</h3><p>Results Entered</p></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Results</span>
        </div>
        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : recentResults.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No results yet</h3>
            <p>Go to "Add Result" to enter student marks</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Subject</th><th>Sem</th><th>Assignment</th><th>Test</th><th>Project</th><th>Total</th></tr></thead>
              <tbody>
                {recentResults.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.studentId?.userId?.name || '—'}</td>
                    <td>{r.subject}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{r.semester}</td>
                    <td>
                      <div className="mark-bar-wrap">
                        <span style={{ minWidth: 28, fontSize: '0.8rem' }}>{r.assignmentMarks}</span>
                        <div className="mark-bar-track"><div className="mark-bar-fill blue" style={{ width: `${pct(r.assignmentMarks, 30)}%` }} /></div>
                      </div>
                    </td>
                    <td>
                      <div className="mark-bar-wrap">
                        <span style={{ minWidth: 28, fontSize: '0.8rem' }}>{r.testMarks}</span>
                        <div className="mark-bar-track"><div className="mark-bar-fill green" style={{ width: `${pct(r.testMarks, 30)}%` }} /></div>
                      </div>
                    </td>
                    <td>
                      <div className="mark-bar-wrap">
                        <span style={{ minWidth: 28, fontSize: '0.8rem' }}>{r.projectMarks}</span>
                        <div className="mark-bar-track"><div className="mark-bar-fill amber" style={{ width: `${pct(r.projectMarks, 40)}%` }} /></div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: gradeColor(r.total) }}>{r.total}/100</td>
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
