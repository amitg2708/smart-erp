import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAdd, MdGrade } from 'react-icons/md';

const EMPTY = { studentId: '', subject: '', semester: '', assignmentMarks: '', testMarks: '', projectMarks: '' };

export default function AddResult() {
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, rRes] = await Promise.all([API.get('/student'), API.get('/result')]);
        setStudents(sRes.data);
        setResults(rRes.data);
      } catch { toast.error('Failed to load data'); }
      setLoadingData(false);
    };
    fetch();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const total = () => {
    const a = Number(form.assignmentMarks) || 0;
    const t = Number(form.testMarks) || 0;
    const p = Number(form.projectMarks) || 0;
    return a + t + p;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.studentId || !form.subject || !form.semester) return toast.error('Fill all required fields');
    setLoading(true);
    try {
      const payload = {
        studentId: form.studentId,
        subject: form.subject,
        semester: Number(form.semester),
        assignmentMarks: Number(form.assignmentMarks) || 0,
        testMarks: Number(form.testMarks) || 0,
        projectMarks: Number(form.projectMarks) || 0,
      };
      if (editId) {
        const { data } = await API.put(`/result/${editId}`, payload);
        setResults(prev => prev.map(r => r._id === editId ? data.result : r));
        toast.success('Result updated!');
        setEditId(null);
      } else {
        const { data } = await API.post('/result', payload);
        setResults(prev => [data.result, ...prev]);
        toast.success('Result added!');
      }
      setForm(EMPTY);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    setLoading(false);
  };

  const handleEdit = (r) => {
    setEditId(r._id);
    setForm({
      studentId: r.studentId?._id || '',
      subject: r.subject,
      semester: r.semester,
      assignmentMarks: r.assignmentMarks,
      testMarks: r.testMarks,
      projectMarks: r.projectMarks,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this result?')) return;
    try {
      await API.delete(`/result/${id}`);
      setResults(prev => prev.filter(r => r._id !== id));
      toast.success('Result deleted');
    } catch { toast.error('Delete failed'); }
  };

  const gradeColor = (t) => t >= 80 ? 'var(--accent-green)' : t >= 60 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const grade = (t) => t >= 90 ? 'O' : t >= 80 ? 'A+' : t >= 70 ? 'A' : t >= 60 ? 'B' : t >= 50 ? 'C' : 'F';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manage Results</h1>
        <p>Add or update internal evaluation marks for students</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title"><MdAdd style={{ verticalAlign: 'middle', marginRight: 8 }} />{editId ? 'Edit Result' : 'Add New Result'}</span>
          {editId && <button className="btn btn-ghost btn-sm" onClick={() => { setEditId(null); setForm(EMPTY); }}>Cancel</button>}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select className="form-select" value={form.studentId} onChange={set('studentId')} required disabled={!!editId}>
                <option value="">Select Student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.userId?.name} ({s.rollNumber})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <input className="form-input" placeholder="e.g. Data Structures" value={form.subject} onChange={set('subject')} required />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select className="form-select" value={form.semester} onChange={set('semester')} required>
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Assignment Marks (0–30)</label>
              <input className="form-input" type="number" min="0" max="30" value={form.assignmentMarks} onChange={set('assignmentMarks')} />
            </div>
            <div className="form-group">
              <label className="form-label">Test Marks (0–30)</label>
              <input className="form-input" type="number" min="0" max="30" value={form.testMarks} onChange={set('testMarks')} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Project Marks (0–40)</label>
              <input className="form-input" type="number" min="0" max="40" value={form.projectMarks} onChange={set('projectMarks')} />
            </div>
            <div className="form-group">
              <label className="form-label">Preview Total</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--bg-primary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '11px 14px'
              }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: gradeColor(total()) }}>{total()}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ 100</span>
                <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '1rem', color: gradeColor(total()) }}>Grade: {grade(total())}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <MdGrade />{loading ? 'Saving...' : editId ? 'Update Result' : 'Add Result'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">All Results ({results.length})</span>
        </div>
        {loadingData ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No results yet</h3>
            <p>Use the form above to add marks</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Subject</th><th>Sem</th><th>Assign</th><th>Test</th><th>Project</th><th>Total</th><th>Grade</th><th>Actions</th></tr></thead>
              <tbody>
                {results.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{r.studentId?.userId?.name || '—'}</td>
                    <td>{r.subject}</td>
                    <td>{r.semester}</td>
                    <td>{r.assignmentMarks}/30</td>
                    <td>{r.testMarks}/30</td>
                    <td>{r.projectMarks}/40</td>
                    <td style={{ fontWeight: 700, color: gradeColor(r.total) }}>{r.total}/100</td>
                    <td><span style={{ fontWeight: 700, color: gradeColor(r.total) }}>{grade(r.total)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(r)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r._id)}>🗑️</button>
                      </div>
                    </td>
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
