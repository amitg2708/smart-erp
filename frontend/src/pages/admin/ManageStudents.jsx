import { useState, useEffect, useMemo } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { MdSchool, MdSearch, MdFilterList } from 'react-icons/md';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterYear, setFilterYear] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await API.get('/student');
        setStudents(data.data || data || []);
      } catch { toast.error('Failed to fetch students'); }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  // Derive unique courses for filter dropdown
  const courses = useMemo(() => [...new Set(students.map(s => s.course).filter(Boolean))].sort(), [students]);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        s.userId?.name?.toLowerCase().includes(q) ||
        s.rollNumber?.toLowerCase().includes(q) ||
        s.userId?.email?.toLowerCase().includes(q);
      const matchCourse = !filterCourse || s.course === filterCourse;
      const matchYear = !filterYear || String(s.year) === filterYear;
      return matchSearch && matchCourse && matchYear;
    });
  }, [students, search, filterCourse, filterYear]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete student "${name}"?`)) return;
    try {
      await API.delete(`/student/${id}`);
      toast.success('Student deleted');
      setStudents(prev => prev.filter(s => s._id !== id));
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const clearFilters = () => { setSearch(''); setFilterCourse(''); setFilterYear(''); };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Students</h1>
        <p>View and manage all enrolled students</p>
      </div>

      {/* Search & Filter bar */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="search-filter-bar">
          <div className="search-input-wrap" style={{ flex: 2 }}>
            <MdSearch className="search-icon" />
            <input
              className="form-input search-input"
              placeholder="Search by name, email or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdFilterList style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" style={{ width: 160 }} value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ width: 110 }} value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
              <option value="">All Years</option>
              {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
            {(search || filterCourse || filterYear) && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear</button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <MdSchool style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Students ({filtered.length}{filtered.length !== students.length ? ` of ${students.length}` : ''})
          </span>
        </div>
        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>{students.length === 0 ? 'No students found' : 'No matching students'}</h3>
            <p>{students.length === 0 ? 'Students appear here after registration' : 'Try adjusting your search or filters'}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll No.</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Branch</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td style={{ fontWeight: 600 }}>{s.userId?.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.userId?.email}</td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--accent-blue)' }}>{s.rollNumber}</span></td>
                    <td>{s.course}</td>
                    <td><span className="badge badge-student">Year {s.year}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.branch || '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id, s.userId?.name)}>🗑️</button>
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
