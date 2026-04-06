import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdClose, MdCheckCircle, MdInfo, MdWarning, MdError } from 'react-icons/md';
import API from '../api/axios';
import toast from 'react-hot-toast';

const typeIcon = {
  info: <MdInfo style={{ color: '#3b82f6' }} />,
  success: <MdCheckCircle style={{ color: '#22c55e' }} />,
  warning: <MdWarning style={{ color: '#f59e0b' }} />,
  error: <MdError style={{ color: '#ef4444' }} />,
};
const typeDot = { info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444' };

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const { data } = await API.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const markRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch {}
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>
      <button className="notif-bell-btn" onClick={() => setOpen((o) => !o)} aria-label="Notifications">
        <MdNotifications />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <MdNotifications size={32} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => { markRead(n._id); setOpen(false); }}
                >
                  <div className="notif-icon">{typeIcon[n.type] || typeIcon.info}</div>
                  <div className="notif-body">
                    <p className="notif-title">{n.title}</p>
                    <p className="notif-msg">{n.message}</p>
                    <time className="notif-time">{new Date(n.createdAt).toLocaleString()}</time>
                  </div>
                  {!n.isRead && <span className="notif-dot" style={{ background: typeDot[n.type] }} />}
                  <button className="notif-del-btn" onClick={(e) => deleteNotif(n._id, e)} title="Delete">
                    <MdClose size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
