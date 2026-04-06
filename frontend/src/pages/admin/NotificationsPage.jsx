import { useState } from 'react';
import { MdNotificationsActive, MdSend, MdInfo, MdWarning, MdCheckCircle, MdError } from 'react-icons/md';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const typeOptions = [
  { value: 'info', label: 'Info', icon: <MdInfo />, color: '#3b82f6' },
  { value: 'success', label: 'Success', icon: <MdCheckCircle />, color: '#22c55e' },
  { value: 'warning', label: 'Warning', icon: <MdWarning />, color: '#f59e0b' },
  { value: 'error', label: 'Alert', icon: <MdError />, color: '#ef4444' },
];

export default function NotificationsPage() {
  const [form, setForm] = useState({ title: '', message: '', type: 'info', targetRole: 'all' });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) return toast.error('Title and message are required');
    setSending(true);
    try {
      const { data } = await API.post('/notifications/broadcast', form);
      toast.success(data.message);
      setHistory(h => [{ ...form, sentAt: new Date().toLocaleString(), result: data.message }, ...h]);
      setForm({ title: '', message: '', type: 'info', targetRole: 'all' });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to send'); }
    finally { setSending(false); }
  };

  const selectedType = typeOptions.find(t => t.value === form.type);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><MdNotificationsActive /> Broadcast Notifications</h1>
        <p className="page-subtitle">Send alerts to students, faculty, or all users</p>
      </div>

      <div className="two-col-layout">
        <div className="card">
          <h3 className="card-title">Compose Notification</h3>
          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" placeholder="Notification title..." value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea className="form-input" placeholder="Write your message..." rows={4} value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Notification Type</label>
              <div className="type-selector">
                {typeOptions.map(t => (
                  <button key={t.value} type="button"
                    className={`type-btn ${form.type === t.value ? 'selected' : ''}`}
                    style={form.type === t.value ? { background: t.color + '20', borderColor: t.color, color: t.color } : {}}
                    onClick={() => setForm(f => ({ ...f, type: t.value }))}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Target Audience</label>
              <select className="form-input" value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))}>
                <option value="all">🌐 All Users</option>
                <option value="student">🎓 Students Only</option>
                <option value="faculty">👨‍🏫 Faculty Only</option>
                <option value="admin">🔐 Admin Only</option>
              </select>
            </div>

            {/* Preview */}
            <div className="notif-preview" style={{ borderLeft: `4px solid ${selectedType.color}`, background: selectedType.color + '10' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: selectedType.color, fontWeight: 600 }}>
                {selectedType.icon} {form.title || 'Notification Title'}
              </div>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>{form.message || 'Your message will appear here...'}</p>
            </div>

            <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: '100%', marginTop: '1rem' }}>
              <MdSend /> {sending ? 'Sending...' : 'Send Notification'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 className="card-title">Recent Broadcasts</h3>
          {history.length === 0 ? (
            <div className="empty-state"><MdNotificationsActive size={40} /><p>No broadcasts yet this session</p></div>
          ) : (
            <div className="history-list">
              {history.map((h, i) => {
                const t = typeOptions.find(o => o.value === h.type);
                return (
                  <div key={i} className="history-item" style={{ borderLeft: `3px solid ${t?.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{h.title}</strong>
                      <span className="role-badge">{h.targetRole}</span>
                    </div>
                    <p style={{ margin: '0.25rem 0', opacity: 0.7, fontSize: '0.88rem' }}>{h.message}</p>
                    <small style={{ opacity: 0.5 }}>{h.sentAt} · {h.result}</small>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
