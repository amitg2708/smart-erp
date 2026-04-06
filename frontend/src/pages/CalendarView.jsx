import { useState, useEffect } from 'react';
import { MdCalendarMonth } from 'react-icons/md';
import API from '../api/axios';
import toast from 'react-hot-toast';

const typeColors = { exam: '#ef4444', holiday: '#22c55e', event: '#3b82f6', assignment: '#f59e0b', meeting: '#8b5cf6', other: '#6b7280' };
const typeIcon = { exam: '📝', holiday: '🏖️', event: '🎉', assignment: '📋', meeting: '👥', other: '📌' };

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    API.get('/calendar').then(({ data }) => setEvents(data)).catch(() => toast.error('Failed to load calendar'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterType ? events.filter(e => e.type === filterType) : events;
  const grouped = {};
  filtered.forEach(ev => {
    const key = new Date(ev.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(ev);
  });

  const upcoming = events.filter(e => new Date(e.startDate) >= new Date()).slice(0, 3);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><MdCalendarMonth /> Academic Calendar</h1>
        <p className="page-subtitle">View upcoming exams, holidays, and events</p>
      </div>

      {upcoming.length > 0 && (
        <div className="upcoming-strip">
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', opacity: 0.8 }}>⏰ Upcoming</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {upcoming.map(ev => (
              <div key={ev._id} className="upcoming-chip" style={{ borderColor: typeColors[ev.type] }}>
                <span>{typeIcon[ev.type]}</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>{ev.title}</p>
                  <time style={{ fontSize: '0.78rem', opacity: 0.7 }}>{new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</time>
                </div>
              </div>
            ))}
          </div>
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
        <div className="empty-state"><MdCalendarMonth size={48} /><p>No events scheduled</p></div>
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
                  </div>
                  <h4 className="event-title">{ev.title}</h4>
                  {ev.description && <p className="event-desc">{ev.description}</p>}
                  <time className="event-meta">{new Date(ev.startDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</time>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
