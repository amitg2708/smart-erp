import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { MdSchool } from 'react-icons/md';

export default function ViewStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/student');
        setStudents(data.data || data || []);
      } catch { toast.error('Failed to fetch students'); }
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>View Students</h1>
        <p>All students enrolled in the college</p>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title"><MdSchool style={{ verticalAlign: 'middle', marginRight: 8 }} />Students ({students.length})</span>
        </div>
        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎓</div>
            <h3>No students found</h3>
            <p>Students appear after registration</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Roll No.</th><th>Course</th><th>Year</th><th>Branch</th><th>Email</th></tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.userId?.name}</td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{s.rollNumber}</span></td>
                    <td>{s.course}</td>
                    <td><span className="badge badge-student">Year {s.year}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.branch || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{s.userId?.email}</td>
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
