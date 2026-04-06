import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdPeople, MdSchool, MdAttachMoney, MdLogout,
  MdGrade, MdAdd, MdVisibility, MdBarChart, MdChecklist,
  MdEventAvailable, MdMenu, MdClose, MdCalendarMonth,
  MdLibraryBooks, MdChatBubble, MdUploadFile, MdSecurity,
  MdNotificationsActive,
} from 'react-icons/md';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

const adminNav = [
  { label: 'Dashboard', path: '/admin', icon: <MdDashboard />, end: true },
  { label: 'Manage Users', path: '/admin/users', icon: <MdPeople /> },
  { label: 'All Students', path: '/admin/students', icon: <MdSchool /> },
  { label: 'Fee Management', path: '/admin/fees', icon: <MdAttachMoney /> },
  { label: 'Courses', path: '/admin/courses', icon: <MdLibraryBooks /> },
  { label: 'Academic Calendar', path: '/admin/calendar', icon: <MdCalendarMonth /> },
  { label: 'Analytics', path: '/admin/analytics', icon: <MdBarChart /> },
  { label: 'Notifications', path: '/admin/notifications', icon: <MdNotificationsActive /> },
  { label: 'Messages', path: '/admin/messages', icon: <MdChatBubble /> },
  { label: 'Audit Logs', path: '/admin/audit-logs', icon: <MdSecurity /> },
];
const facultyNav = [
  { label: 'Dashboard', path: '/faculty', icon: <MdDashboard />, end: true },
  { label: 'Add Result', path: '/faculty/add-result', icon: <MdAdd /> },
  { label: 'View Students', path: '/faculty/students', icon: <MdVisibility /> },
  { label: 'Mark Attendance', path: '/faculty/attendance', icon: <MdChecklist /> },
  { label: 'Courses', path: '/faculty/courses', icon: <MdLibraryBooks /> },
  { label: 'Calendar', path: '/faculty/calendar', icon: <MdCalendarMonth /> },
  { label: 'Messages', path: '/faculty/messages', icon: <MdChatBubble /> },
];
const studentNav = [
  { label: 'Dashboard', path: '/student', icon: <MdDashboard />, end: true },
  { label: 'My Results', path: '/student/results', icon: <MdGrade /> },
  { label: 'Fee Status', path: '/student/fees', icon: <MdAttachMoney /> },
  { label: 'My Attendance', path: '/student/attendance', icon: <MdEventAvailable /> },
  { label: 'My Documents', path: '/student/documents', icon: <MdUploadFile /> },
  { label: 'Calendar', path: '/student/calendar', icon: <MdCalendarMonth /> },
  { label: 'Messages', path: '/student/messages', icon: <MdChatBubble /> },
];

const navByRole = { admin: adminNav, faculty: facultyNav, student: studentNav };
const roleLabel = { admin: 'Administrator', faculty: 'Faculty Member', student: 'Student' };
const roleColor = { admin: '#8b5cf6', faculty: '#3b82f6', student: '#10b981' };

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = navByRole[user?.role] || [];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);
  const initials = user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🎓</div>
          <div className="sidebar-title">
            <h2>College ERP</h2>
            <p>Smart ERP v2.0</p>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <MdClose />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label" style={{ color: roleColor[user?.role] }}>
            {roleLabel[user?.role] || 'Navigation'}
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar" style={{ background: roleColor[user?.role] }}>{initials}</div>
            <div className="user-details">
              <h4>{user?.name}</h4>
              <p>{roleLabel[user?.role]}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <MdLogout /> Sign Out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <MdMenu />
          </button>
          <span className="topbar-title">🎓 Smart College ERP</span>
          <div className="topbar-actions">
            <NotificationBell />
            <div className="user-avatar topbar-avatar" style={{ background: roleColor[user?.role] }}>{initials}</div>
          </div>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
