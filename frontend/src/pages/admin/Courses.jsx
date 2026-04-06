import { useState, useEffect } from 'react';
import { MdLibraryBooks, MdAdd, MdEdit, MdDelete, MdSave, MdClose, MdExpandMore, MdExpandLess } from 'react-icons/md';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const emptyCourse = { name: '', code: '', department: '', semester: 1, subjects: [] };
const emptySubject = { name: '', code: '', credits: 3, facultyId: '' };

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyCourse);
  const [editId, setEditId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/courses');
      setCourses(data);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCourses(); }, []);

  const openCreate = () => { setForm(emptyCourse); setSubjects([]); setEditId(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ name: c.name, code: c.code, department: c.department || '', semester: c.semester }); setSubjects(c.subjects || []); setEditId(c._id); setShowForm(true); };

  const addSubject = () => setSubjects(s => [...s, { ...emptySubject }]);
  const removeSubject = (i) => setSubjects(s => s.filter((_, idx) => idx !== i));
  const updateSubject = (i, field, val) => setSubjects(s => s.map((sub, idx) => idx === i ? { ...sub, [field]: val } : sub));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code || !form.semester) return toast.error('Name, code, and semester are required');
    setSubmitting(true);
    try {
      const payload = { ...form, subjects };
      if (editId) {
        await API.put(`/courses/${editId}`, payload);
        toast.success('Course updated');
      } else {
        await API.post('/courses', payload);
        toast.success('Course created');
      }
      setShowForm(false);
      fetchCourses();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save course'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    try { await API.delete(`/courses/${id}`); toast.success('Course deleted'); fetchCourses(); }
    catch { toast.error('Failed to delete course'); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdLibraryBooks /> Course Management</h1>
          <p className="page-subtitle">Manage courses and subject mappings</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}><MdAdd /> New Course</button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{editId ? 'Edit Course' : 'New Course'}</h3>
            <button className="icon-btn" onClick={() => setShowForm(false)}><MdClose /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-grid-2">
              <div><label className="form-label">Course Name *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><label className="form-label">Course Code *</label><input className="form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required /></div>
              <div><label className="form-label">Department</label><input className="form-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></div>
              <div><label className="form-label">Semester *</label>
                <select className="form-input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: Number(e.target.value) }))}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            <div className="subjects-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0 }}>Subjects ({subjects.length})</h4>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addSubject}><MdAdd /> Add Subject</button>
              </div>
              {subjects.map((s, i) => (
                <div key={i} className="subject-row">
                  <input className="form-input" placeholder="Subject Name" value={s.name} onChange={e => updateSubject(i, 'name', e.target.value)} />
                  <input className="form-input" placeholder="Code" value={s.code} onChange={e => updateSubject(i, 'code', e.target.value)} />
                  <input type="number" className="form-input" placeholder="Credits" value={s.credits} min={1} max={6} onChange={e => updateSubject(i, 'credits', Number(e.target.value))} />
                  <button type="button" className="icon-btn danger" onClick={() => removeSubject(i)}><MdDelete /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}><MdSave /> {submitting ? 'Saving...' : 'Save Course'}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
        <div className="courses-grid">
          {courses.length === 0 ? <div className="empty-state"><MdLibraryBooks size={48} /><p>No courses yet</p></div> : courses.map(c => (
            <div key={c._id} className="course-card card">
              <div className="course-card-header">
                <div>
                  <h3 className="course-name">{c.name}</h3>
                  <p className="course-meta">
                    <span className="badge">{c.code}</span>
                    <span className="badge badge-secondary">Sem {c.semester}</span>
                    {c.department && <span className="badge badge-info">{c.department}</span>}
                  </p>
                </div>
                <div className="action-btns">
                  <button className="icon-btn" onClick={() => openEdit(c)} title="Edit"><MdEdit /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(c._id)} title="Delete"><MdDelete /></button>
                </div>
              </div>
              {c.subjects?.length > 0 && (
                <>
                  <button className="expand-btn" onClick={() => setExpanded(ex => ({ ...ex, [c._id]: !ex[c._id] }))}>
                    {expanded[c._id] ? <MdExpandLess /> : <MdExpandMore />} {c.subjects.length} Subjects
                  </button>
                  {expanded[c._id] && (
                    <div className="subjects-list">
                      {c.subjects.map((s, i) => (
                        <div key={i} className="subject-chip">
                          <strong>{s.name}</strong> <span style={{ opacity: 0.6 }}>({s.code})</span>
                          <span className="credit-chip">{s.credits} cr</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
