import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentAttendanceHistory } from './pages/student/StudentAttendanceHistory';
import { AttendanceCalculatorPage } from './pages/student/AttendanceCalculatorPage';
import { StudentTimetablePage } from './pages/student/StudentTimetablePage';
import { CorrectionRequestsPage } from './pages/student/CorrectionRequestsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Faculty Pages
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { MarkAttendancePage } from './pages/faculty/MarkAttendancePage';
import { FacultySessionsHistory } from './pages/faculty/FacultySessionsHistory';
import { FacultyReportsPage } from './pages/faculty/FacultyReportsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudentsPage } from './pages/admin/AdminStudentsPage';
import { AdminFacultyPage } from './pages/admin/AdminFacultyPage';
import { AdminCorrectionsPage } from './pages/admin/AdminCorrectionsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminDatabaseViewerPage } from './pages/admin/AdminDatabaseViewerPage';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard
    if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RoleHomeRedirect() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'STUDENT') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleHomeRedirect />} />

      {/* Student Portal Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/student/dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="attendance" element={<StudentAttendanceHistory />} />
        <Route path="calculator" element={<AttendanceCalculatorPage />} />
        <Route path="timetable" element={<StudentTimetablePage />} />
        <Route path="corrections" element={<CorrectionRequestsPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* Faculty Portal Routes */}
      <Route
        path="/faculty"
        element={
          <ProtectedRoute allowedRoles={['FACULTY', 'ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/faculty/dashboard" replace />} />
        <Route path="dashboard" element={<FacultyDashboard />} />
        <Route path="mark" element={<MarkAttendancePage />} />
        <Route path="sessions" element={<FacultySessionsHistory />} />
        <Route path="reports" element={<FacultyReportsPage />} />
      </Route>

      {/* Administrator Portal Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudentsPage />} />
        <Route path="faculty" element={<AdminFacultyPage />} />
        <Route path="corrections" element={<AdminCorrectionsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="database" element={<AdminDatabaseViewerPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<RoleHomeRedirect />} />
    </Routes>
  );
}
