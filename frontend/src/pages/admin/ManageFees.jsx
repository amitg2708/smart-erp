import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { MdAttachMoney, MdAdd, MdEdit, MdDelete } from 'react-icons/md';

const EMPTY_FEE = { studentId: '', semester: '', totalFees: '', paidAmount: '', dueDate: '', description: '' };

export default function ManageFees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editFee, setEditFee] = useState(null);
  const [form, setForm] = useState(EMPTY_FEE);

  const fetchData = async () => {
    try {
      const [feesRes, studentsRes] = await Promise.all([API.get('/fee'), API.get('/student')]);
      setFees(feesRes.data.data || feesRes.data || []);
      setStudents(studentsRes.data.data || studentsRes.data || []);
    } catch { toast.error('Failed to load data'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditFee(null); setForm(EMPTY_FEE); setShowModal(true); };
  const openEdit = (fee) => {
    setEditFee(fee);
    setForm({ studentId: fee.studentId?._id || '', semester: fee.semester, totalFees: fee.totalFees, paidAmount: fee.paidAmount, dueDate: fee.dueDate ? fee.dueDate.substring(0,10) : '', description: fee.description || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editFee) {
        const { data } = await API.put(`/fee/${editFee._id}`, { totalFees: Number(form.totalFees), paidAmount: Number(form.paidAmount), dueDate: form.dueDate, description: form.description });
        setFees(prev => prev.map(f => f._id === editFee._id ? data.fee : f));
        toast.success('Fee updated!');
      } else {
        const { data } = await API.post('/fee', { ...form, semester: Number(form.semester), totalFees: Number(form.totalFees), paidAmount: Number(form.paidAmount) });
        setFees(prev => [data.fee, ...prev]);
        toast.success('Fee record created!');
      }
      setShowModal(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee record?')) return;
    try {
      await API.delete(`/fee/${id}`);
      setFees(prev => prev.filter(f => f._id !== id));
      toast.success('Fee deleted');
    } catch { toast.error('Delete failed'); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const pct = (f) => f.totalFees > 0 ? Math.round((f.paidAmount / f.totalFees) * 100) : 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Fee Management</h1>
        <p>Add and manage student fee records</p>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title"><MdAttachMoney style={{ verticalAlign: 'middle', marginRight: 8 }} />Fee Records ({fees.length})</span>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><MdAdd />Add Fee</button>
        </div>

        {loading ? (
          <div className="spinner-wrapper"><div className="spinner" /></div>
        ) : fees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>No fee records</h3>
            <p>Click "Add Fee" to create a fee record</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Sem</th><th>Total</th><th>Paid</th><th>Pending</th><th>Status</th><th>Progress</th><th>Actions</th></tr></thead>
              <tbody>
                {fees.map(f => (
                  <tr key={f._id}>
                    <td style={{ fontWeight: 600 }}>{f.studentId?.userId?.name || '—'}</td>
                    <td>{f.semester}</td>
                    <td>₹{f.totalFees?.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-green)' }}>₹{f.paidAmount?.toLocaleString()}</td>
                    <td style={{ color: 'var(--accent-red)' }}>₹{f.pendingAmount?.toLocaleString()}</td>
                    <td><span className={`badge badge-${f.status}`}>{f.status}</span></td>
                    <td style={{ width: 100 }}>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-track">
                          <div className={`progress-bar-fill ${f.status === 'paid' ? 'green' : f.status === 'partial' ? 'amber' : 'red'}`} style={{ width: `${pct(f)}%` }} />
                        </div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{pct(f)}%</small>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(f)}><MdEdit /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f._id)}><MdDelete /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editFee ? 'Update Fee' : 'Add Fee Record'}</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              {!editFee && (
                <div className="form-group">
                  <label className="form-label">Student *</label>
                  <select className="form-select" value={form.studentId} onChange={set('studentId')} required>
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.userId?.name} ({s.rollNumber})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-grid">
                {!editFee && (
                  <div className="form-group">
                    <label className="form-label">Semester *</label>
                    <select className="form-select" value={form.semester} onChange={set('semester')} required>
                      <option value="">Select</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Total Fees (₹) *</label>
                  <input className="form-input" type="number" value={form.totalFees} onChange={set('totalFees')} required min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Paid Amount (₹)</label>
                  <input className="form-input" type="number" value={form.paidAmount} onChange={set('paidAmount')} min="0" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="form-input" type="date" value={form.dueDate} onChange={set('dueDate')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-input" placeholder="Tuition, Hostel..." value={form.description} onChange={set('description')} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editFee ? 'Update' : 'Add Fee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
