import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function AttendanceRing({ percentage, subject }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage >= 75 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="attendance-ring-card">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
        <circle
          cx="45" cy="45" r={radius} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="45" y="50" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{percentage}%</text>
      </svg>
      <div className="attendance-ring-label">
        <div style={{ fontWeight: 600, fontSize: '0.88rem', textAlign: 'center' }}>{subject}</div>
        <div style={{ fontSize: '0.72rem', color: percentage >= 75 ? 'var(--accent-green)' : 'var(--accent-red)', textAlign: 'center', marginTop: 2 }}>
          {percentage >= 75 ? '✓ Good Standing' : '⚠ Low Attendance'}
        </div>
      </div>
    </div>
  );
}

export default function MyAttendance() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // GET /student returns own profile when caller is a student
        const { data: profile } = await api.get('/student');
        setStudentId(profile._id);
        const { data } = await api.get(`/attendance/summary/${profile._id}`);
        setSummary(data);
      } catch {
        toast.error('Failed to load attendance data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const lowSubjects = summary.filter((s) => s.percentage < 75);
  const avgAttendance = summary.length > 0
    ? Math.round(summary.reduce((acc, s) => acc + s.percentage, 0) / summary.length)
    : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Attendance</h1>
        <p>View your subject-wise attendance percentage</p>
      </div>

      {!loading && lowSubjects.length > 0 && (
        <div className="alert-banner alert-danger" style={{ marginBottom: 20 }}>
          <span className="alert-icon">⚠️</span>
          <div>
            <strong>Low Attendance Warning!</strong>
            <span> Your attendance in <strong>{lowSubjects.map(s => s.subject).join(', ')}</strong> is below 75%. Please attend classes regularly.</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /></div>
      ) : summary.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No Attendance Records</h3>
            <p>Your attendance data will appear here once faculty starts marking.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overall stat */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className={`stat-icon ${avgAttendance >= 75 ? 'green' : 'red'}`}>📊</div>
              <div className="stat-info">
                <h3>{avgAttendance}%</h3>
                <p>Overall Average</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">📚</div>
              <div className="stat-info">
                <h3>{summary.length}</h3>
                <p>Subjects Tracked</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green">✅</div>
              <div className="stat-info">
                <h3>{summary.filter(s => s.percentage >= 75).length}</h3>
                <p>Good Standing</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red">⚠</div>
              <div className="stat-info">
                <h3>{lowSubjects.length}</h3>
                <p>Low Attendance</p>
              </div>
            </div>
          </div>

          {/* Ring cards */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Subject-wise Attendance</span>
            </div>
            <div className="attendance-rings-grid">
              {summary.map((s) => (
                <div key={s.subject}>
                  <AttendanceRing percentage={s.percentage} subject={s.subject} />
                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {s.present} / {s.total} classes attended
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <span className="card-title">Detailed Breakdown</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Classes Held</th>
                    <th>Attended</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s) => (
                    <tr key={s.subject}>
                      <td style={{ fontWeight: 600 }}>{s.subject}</td>
                      <td>{s.total}</td>
                      <td>{s.present}</td>
                      <td>
                        <div className="mark-bar-wrap" style={{ minWidth: 120 }}>
                          <div className="mark-bar-track">
                            <div
                              className={`mark-bar-fill ${s.percentage >= 75 ? 'green' : s.percentage >= 50 ? 'amber' : 'red'}`}
                              style={{ width: `${s.percentage}%` }}
                            />
                          </div>
                          <span style={{ minWidth: 40, fontSize: '0.82rem', fontWeight: 600 }}>{s.percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${s.percentage >= 75 ? 'badge-paid' : 'badge-pending'}`}>
                          {s.percentage >= 75 ? 'Good' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
