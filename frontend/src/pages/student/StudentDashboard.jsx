import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import { MdGrade, MdAttachMoney, MdSchool } from 'react-icons/md';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [results, setResults] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profRes, resRes, feeRes] = await Promise.all([
          API.get('/student'), API.get('/result'), API.get('/fee')
        ]);
        setProfile((profRes.data.data && profRes.data.data.length > 0) ? profRes.data.data[0] : (profRes.data.length > 0 ? profRes.data[0] : profRes.data));
        setResults(resRes.data.data || resRes.data || []);
        setFees(feeRes.data.data || feeRes.data || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.total, 0) / results.length) : 0;
  const pendingFees = fees.filter(f => f.status !== 'paid').length;
  const gradeColor = (t) => t >= 80 ? 'var(--accent-green)' : t >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const grade = (t) => t >= 90 ? 'O' : t >= 80 ? 'A+' : t >= 70 ? 'A' : t >= 60 ? 'B' : t >= 50 ? 'C' : 'F';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user?.name} 🎓</h1>
        <p>Your academic overview and performance summary</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><MdSchool /></div>
          <div className="stat-info"><h3>{loading ? '...' : profile?.course || '—'}</h3><p>{profile?.rollNumber || 'Roll No.'}</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><MdGrade /></div>
          <div className="stat-info"><h3>{loading ? '...' : results.length}</h3><p>Results Available</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdGrade /></div>
          <div className="stat-info"><h3>{loading ? '...' : avg}/100</h3><p>Average Score</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><MdAttachMoney /></div>
          <div className="stat-info"><h3>{loading ? '...' : pendingFees}</h3><p>Pending Fee Records</p></div>
        </div>
      </div>

      {profile && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><span className="card-title">My Profile</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Full Name', val: user?.name },
              { label: 'Email', val: user?.email },
              { label: 'Roll Number', val: profile.rollNumber },
              { label: 'Course', val: profile.course },
              { label: 'Year', val: `Year ${profile.year}` },
              { label: 'Branch', val: profile.branch || 'N/A' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Results</span></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Subject</th><th>Sem</th><th>Assign</th><th>Test</th><th>Project</th><th>Total</th><th>Grade</th></tr></thead>
              <tbody>
                {results.slice(0, 5).map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.subject}</td>
                    <td>{r.semester}</td>
                    <td>{r.assignmentMarks}/30</td>
                    <td>{r.testMarks}/30</td>
                    <td>{r.projectMarks}/40</td>
                    <td style={{ fontWeight: 700, color: gradeColor(r.total) }}>{r.total}/100</td>
                    <td><span style={{ fontWeight: 700, color: gradeColor(r.total) }}>{grade(r.total)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
