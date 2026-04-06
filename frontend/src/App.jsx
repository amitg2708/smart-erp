import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Layout from './components/Layout';
import Chat from './pages/Chat';
import CalendarView from './pages/CalendarView';
import ErrorBoundary from './components/ErrorBoundary';

// Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageFees from './pages/admin/ManageFees';
import ManageStudents from './pages/admin/ManageStudents';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';
import AcademicCalendar from './pages/admin/AcademicCalendar';
import Courses from './pages/admin/Courses';
import NotificationsPage from './pages/admin/NotificationsPage';

// Faculty
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import AddResult from './pages/faculty/AddResult';
import ViewStudents from './pages/faculty/ViewStudents';
import MarkAttendance from './pages/faculty/MarkAttendance';

// Student
import StudentDashboard from './pages/student/StudentDashboard';
import MyResults from './pages/student/MyResults';
import MyFees from './pages/student/MyFees';
import MyAttendance from './pages/student/MyAttendance';
import Documents from './pages/student/Documents';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<ManageUsers />} />
        <Route path="fees" element={<ManageFees />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="calendar" element={<AcademicCalendar />} />
        <Route path="courses" element={<Courses />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="messages" element={<Chat />} />
      </Route>

      {/* Faculty Routes */}
      <Route path="/faculty" element={<ProtectedRoute allowedRoles={['faculty']}><Layout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="add-result" element={<AddResult />} />
        <Route path="students" element={<ViewStudents />} />
        <Route path="attendance" element={<MarkAttendance />} />
        <Route path="courses" element={<Courses />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="messages" element={<Chat />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><Layout /></ProtectedRoute>}>
        <Route index element={<StudentDashboard />} />
        <Route path="results" element={<MyResults />} />
        <Route path="fees" element={<MyFees />} />
        <Route path="attendance" element={<MyAttendance />} />
        <Route path="documents" element={<Documents />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="messages" element={<Chat />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'inherit',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
