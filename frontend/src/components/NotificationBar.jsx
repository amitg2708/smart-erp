import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MdClose } from 'react-icons/md';

export default function NotificationBar() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const newAlerts = [];
      try {
        if (user.role === 'student') {
          // Check fee dues
          const { data: fees } = await api.get('/fee');
          const now = new Date();
          fees.forEach((f) => {
            if ((f.status === 'pending' || f.status === 'partial') && f.dueDate && new Date(f.dueDate) < now) {
              newAlerts.push({
                id: `fee-${f._id}`,
                type: 'warning',
                message: `Fee due for Semester ${f.semester} – ₹${f.pendingAmount.toLocaleString()} overdue since ${new Date(f.dueDate).toLocaleDateString('en-IN')}`,
              });
            }
          });

          // Check low attendance
          // Check low attendance – GET /student returns own profile for student role
          const { data: profile } = await api.get('/student');
          if (profile?._id) {
            const { data: summary } = await api.get(`/attendance/summary/${profile._id}`);
            const low = summary.filter((s) => s.percentage < 75);
            if (low.length > 0) {
              newAlerts.push({
                id: 'attendance-low',
                type: 'danger',
                message: `⚠ Low attendance in: ${low.map((s) => `${s.subject} (${s.percentage}%)`).join(', ')}. Minimum required: 75%.`,
              });
            }
          }
        }
      } catch {
        // Silently ignore notification fetch errors
      }
      setAlerts(newAlerts);
    };
    fetchAlerts();
  }, [user]);

  const dismiss = (id) => setAlerts((prev) => prev.filter((a) => a.id !== id));

  if (alerts.length === 0) return null;

  return (
    <div className="notification-stack">
      {alerts.map((a) => (
        <div key={a.id} className={`alert-banner alert-${a.type}`}>
          <span className="alert-icon">{a.type === 'danger' ? '🔴' : '🟡'}</span>
          <span style={{ flex: 1, fontSize: '0.875rem' }}>{a.message}</span>
          <button className="alert-close" onClick={() => dismiss(a.id)} title="Dismiss">
            <MdClose />
          </button>
        </div>
      ))}
    </div>
  );
}
