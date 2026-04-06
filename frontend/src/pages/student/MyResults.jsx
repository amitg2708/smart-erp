import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { MdGrade } from 'react-icons/md';

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/result');
        setResults(data.data || data || []);
      } catch (err) {
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const gradeColor = (t) => t >= 80 ? 'var(--accent-green)' : t >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const grade = (t) => t >= 90 ? 'O' : t >= 80 ? 'A+' : t >= 70 ? 'A' : t >= 60 ? 'B' : t >= 50 ? 'C' : 'F';
  const pct = (v, max) => Math.round((v / max) * 100);
  const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.total, 0) / results.length) : 0;

  // Group by semester
  const bySem = results.reduce((acc, r) => {
    const sem = r.semester;
    if (!acc[sem]) acc[sem] = [];
    acc[sem].push(r);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Results</h1>
        <p>View your internal evaluation marks and grades</p>
      </div>

      {results.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon purple"><MdGrade /></div>
            <div className="stat-info"><h3>{results.length}</h3><p>Total Results</p></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><MdGrade /></div>
            <div className="stat-info">
              <h3 style={{ color: gradeColor(avg) }}>{avg}/100</h3>
              <p>Average Score</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue"><MdGrade /></div>
            <div className="stat-info"><h3 style={{ color: gradeColor(avg) }}>{grade(avg)}</h3><p>Overall Grade</p></div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /></div>
      ) : results.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No results available</h3>
            <p>Your faculty will add marks once evaluations are complete</p>
          </div>
        </div>
      ) : (
        Object.entries(bySem).sort((a, b) => Number(a[0]) - Number(b[0])).map(([sem, semResults]) => (
          <div className="card" key={sem} style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Semester {sem}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{semResults.length} subject{semResults.length > 1 ? 's' : ''}</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Subject</th><th>Assignment (30)</th><th>Test (30)</th><th>Project (40)</th><th>Total (100)</th><th>Grade</th></tr></thead>
                <tbody>
                  {semResults.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 600 }}>{r.subject}</td>
                      <td>
                        <div className="mark-bar-wrap">
                          <span style={{ minWidth: 32, fontSize: '0.85rem' }}>{r.assignmentMarks}</span>
                          <div className="mark-bar-track"><div className="mark-bar-fill blue" style={{ width: `${pct(r.assignmentMarks, 30)}%` }} /></div>
                        </div>
                      </td>
                      <td>
                        <div className="mark-bar-wrap">
                          <span style={{ minWidth: 32, fontSize: '0.85rem' }}>{r.testMarks}</span>
                          <div className="mark-bar-track"><div className="mark-bar-fill green" style={{ width: `${pct(r.testMarks, 30)}%` }} /></div>
                        </div>
                      </td>
                      <td>
                        <div className="mark-bar-wrap">
                          <span style={{ minWidth: 32, fontSize: '0.85rem' }}>{r.projectMarks}</span>
                          <div className="mark-bar-track"><div className="mark-bar-fill amber" style={{ width: `${pct(r.projectMarks, 40)}%` }} /></div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: gradeColor(r.total), fontSize: '1.05rem' }}>{r.total}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontWeight: 700, fontSize: '0.85rem',
                          background: `${gradeColor(r.total)}22`, color: gradeColor(r.total),
                          border: `1px solid ${gradeColor(r.total)}44`,
                        }}>{grade(r.total)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
