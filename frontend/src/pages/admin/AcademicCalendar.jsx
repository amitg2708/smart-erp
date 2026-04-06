import { useState, useEffect } from 'react';
import { MdCalendarMonth, MdAdd, MdDelete, MdEvent, MdSchool, MdBeachAccess, MdWork } from 'react-icons/md';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const typeColors = { exam: '#ef4444', holiday: '#22c55e', event: '#3b82f6', assignment: '#f59e0b', meeting: '#8b5cf6', other: '#6b7280' };
const typeIcon = { exam: '📝', holiday: '🏖️', event: '🎉', assignment: '📋', meeting: '👥', other: '📌' };

const emptyForm = { title: '', description: '', startDate: '', endDate: '', type: 'event', audience: 'all' };

export default function AcademicCalendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/calendar');
      setEvents(data);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.startDate) return toast.error('Title and start date are required');
    setSubmitting(true);
    try {
      await API.post('/calendar', form);
      toast.success('Event created!');
      setForm(emptyForm);
      setShowForm(false);
      fetchEvents();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to create event'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await API.delete(`/calendar/${id}`);
      toast.success('Event deleted');
      setEvents(prev => prev.filter(e => e._id !== id));
    } catch { toast.error('Failed to delete event'); }
  };

  const filtered = filterType ? events.filter(e => e.type === filterType) : events;

  // Group by month
  const grouped = {};
  filtered.forEach(ev => {
    const key = new Date(ev.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title"><MdCalendarMonth /> Academic Calendar</h1>
          <p className="page-subtitle">Manage academic events, exams, and holidays</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          <MdAdd /> {showForm ? 'Cancel' : 'Add Event'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h3 className="card-title">Create New Event</h3>
          <form onSubmit={handleSubmit} className="form-grid">
            <input className="form-input" placeholder="Event Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
            <textarea className="form-input" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Start Date *</label>
                <input type="datetime-local" className="form-input" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required />
              </div>
              <div>
                <label className="form-label">End Date</label>
                <input type="datetime-local" className="form-input" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Event Type</label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.keys(typeColors).map(t => <option key={t} value={t}>{typeIcon[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Audience</label>
                <select className="form-input" value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}>
                  <option value="all">All Users</option>
                  <option value="student">Students Only</option>
                  <option value="faculty">Faculty Only</option>
                  <option value="admin">Admin Only</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Saving...' : 'Create Event'}</button>
          </form>
        </div>
      )}

      <div className="filter-tabs">
        {['', 'exam', 'holiday', 'event', 'assignment', 'meeting', 'other'].map(t => (
          <button key={t} className={`filter-tab ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}
            style={filterType === t && t ? { background: typeColors[t], color: '#fff', borderColor: typeColors[t] } : {}}>
            {t ? `${typeIcon[t]} ${t.charAt(0).toUpperCase() + t.slice(1)}` : '📅 All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="spinner-wrapper"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><MdCalendarMonth size={48} /><p>No events found</p></div>
      ) : (
        Object.entries(grouped).map(([month, evs]) => (
          <div key={month} className="calendar-month-group">
            <h3 className="month-label">{month}</h3>
            <div className="calendar-events-grid">
              {evs.map(ev => (
                <div key={ev._id} className="calendar-event-card" style={{ borderLeft: `4px solid ${typeColors[ev.type] || '#6b7280'}` }}>
                  <div className="event-header">
                    <span className="event-type-badge" style={{ background: typeColors[ev.type] + '20', color: typeColors[ev.type] }}>
                      {typeIcon[ev.type]} {ev.type}
                    </span>
                    <button className="icon-btn danger" onClick={() => handleDelete(ev._id)} title="Delete"><MdDelete /></button>
                  </div>
                  <h4 className="event-title">{ev.title}</h4>
                  {ev.description && <p className="event-desc">{ev.description}</p>}
                  <div className="event-meta">
                    <time>{new Date(ev.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</time>
                    {ev.endDate && <span> → {new Date(ev.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    <span className="event-audience">👥 {ev.audience}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
