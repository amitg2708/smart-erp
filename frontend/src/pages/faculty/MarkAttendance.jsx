import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MdCheckCircle, MdCancel, MdAccessTime, MdSearch, MdSave, MdQrCode, MdLocationOn } from 'react-icons/md';

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'History'];

export default function MarkAttendance() {
  const [students, setStudents] = useState([]);
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // QR state
  const [qrData, setQrData] = useState(null);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrExpiry, setQrExpiry] = useState(null);
  const [useLocation, setUseLocation] = useState(false);
  const [validMinutes, setValidMinutes] = useState(15);

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/student');
        setStudents(data);
        const init = {};
        data.forEach((s) => { init[s._id] = 'present'; });
        setAttendance(init);
      } catch { toast.error('Failed to load students'); }
      finally { setLoading(false); }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const name = s.userId?.name?.toLowerCase() || '';
    const roll = s.rollNumber?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  const setStatus = (id, status) => setAttendance((prev) => ({ ...prev, [id]: status }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map((s) => ({ studentId: s._id, subject, date, status: attendance[s._id] || 'present' }));
      await api.post('/attendance/bulk', { records });
      toast.success('Attendance saved successfully!');
    } catch { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    try {
      let lat = null, lng = null;
      if (useLocation) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch { toast.error('Location access denied. QR will work without location check.'); }
      }
      const { data } = await api.post('/attendance/qr/generate', { subject, date, lat, lng, validMinutes });
      setQrData(data);
      setQrExpiry(new Date(data.expiresAt));
      toast.success(`QR code generated! Valid for ${validMinutes} minutes.`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to generate QR'); }
    finally { setGeneratingQR(false); }
  };

  const isExpired = qrExpiry && new Date() > qrExpiry;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Mark Attendance</h1>
        <p className="page-subtitle">Mark manually or generate a QR code for students to self-check-in</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="attendance-controls">
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label">Subject</label>
            <select className="form-select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 2 }}>
            <label className="form-label">Search Students</label>
            <div className="search-input-wrap">
              <MdSearch className="search-icon" />
              <input className="form-input search-input" placeholder="Search by name or roll number..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* QR Section */}
      <div className="card qr-section" style={{ marginBottom: 20 }}>
        <h3 className="card-title"><MdQrCode /> QR-Based Attendance</h3>
        <div className="qr-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ margin: 0 }}>Valid for (minutes):</label>
            <input type="number" className="form-input" value={validMinutes} min={5} max={60} style={{ width: 80 }}
              onChange={e => setValidMinutes(Number(e.target.value))} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input type="checkbox" checked={useLocation} onChange={e => setUseLocation(e.target.checked)} />
              <MdLocationOn /> Require Location (200m radius)
            </label>
            <button className="btn btn-primary" onClick={handleGenerateQR} disabled={generatingQR}>
              <MdQrCode /> {generatingQR ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        </div>

        {qrData && (
          <div className="qr-display">
            <div className={`qr-container ${isExpired ? 'expired' : ''}`}>
              {isExpired ? (
                <div className="qr-expired-overlay"><p>⏰ QR Expired</p><button className="btn btn-primary btn-sm" onClick={handleGenerateQR}>Regenerate</button></div>
              ) : (
                <QRCodeSVG value={JSON.stringify({ token: qrData.token, subject, date })} size={200} level="M" />
              )}
            </div>
            <div className="qr-info">
              <p><strong>Subject:</strong> {subject}</p>
              <p><strong>Date:</strong> {date}</p>
              <p><strong>Expires:</strong> {qrExpiry?.toLocaleTimeString()}</p>
              <p><strong>Token:</strong> <code style={{ fontSize: '0.75rem', opacity: 0.7 }}>{qrData.token.substring(0, 16)}...</code></p>
              {!isExpired && <div className="qr-status-dot"><span className="pulse-dot" />Active — students can scan now</div>}
            </div>
          </div>
        )}
      </div>

      <div className="attendance-bulk-actions">
        <button className="btn btn-success btn-sm" onClick={() => { const all = {}; students.forEach(s => all[s._id] = 'present'); setAttendance(all); }}>
          <MdCheckCircle /> Mark All Present
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => { const all = {}; students.forEach(s => all[s._id] = 'absent'); setAttendance(all); }}>
          <MdCancel /> Mark All Absent
        </button>
        <div style={{ flex: 1 }} />
        <div className="attendance-summary-pill">
          <span style={{ color: 'var(--accent-green)' }}>{Object.values(attendance).filter(v => v === 'present').length} Present</span>
          <span style={{ color: 'var(--accent-red)' }}>{Object.values(attendance).filter(v => v === 'absent').length} Absent</span>
          <span style={{ color: 'var(--accent-amber)' }}>{Object.values(attendance).filter(v => v === 'late').length} Late</span>
        </div>
      </div>

      <div className="card">
        {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>#</th><th>Student</th><th>Roll No</th><th>Course / Year</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><div className="empty-state-icon">👥</div><h3>No students found</h3></div></td></tr>
                ) : filtered.map((s, i) => (
                  <tr key={s._id}>
                    <td>{i + 1}</td>
                    <td><div style={{ fontWeight: 600 }}>{s.userId?.name}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{s.userId?.email}</div></td>
                    <td>{s.rollNumber}</td>
                    <td>{s.course} · Year {s.year}</td>
                    <td>
                      <div className="attendance-status-group">
                        {['present', 'absent', 'late'].map((st) => (
                          <button key={st} className={`attendance-status-btn ${st} ${attendance[s._id] === st ? 'active' : ''}`} onClick={() => setStatus(s._id, st)}>
                            {st === 'present' ? <MdCheckCircle /> : st === 'absent' ? <MdCancel /> : <MdAccessTime />}
                            <span>{st}</span>
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || students.length === 0}>
          <MdSave /> {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>
    </div>
  );
}
