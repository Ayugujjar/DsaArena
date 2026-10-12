import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { ProtectedStudentRoute, ProtectedAdminRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { About } from './pages/public/About';

// Student Pages
import { Dashboard } from './pages/student/Dashboard';
import { Progress } from './pages/student/Progress';
import { Leaderboard } from './pages/student/Leaderboard';
import { Profile } from './pages/student/Profile';
import { ConnectPlatforms } from './pages/student/ConnectPlatforms';
import { Settings } from './pages/student/Settings';

// Admin Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminSetup } from './pages/admin/AdminSetup';
import { AdminSetPassword } from './pages/admin/AdminSetPassword';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminStudents } from './pages/admin/AdminStudents';
import { AdminStudentDetail } from './pages/admin/AdminStudentDetail';
import { AdminBatches } from './pages/admin/AdminBatches';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminAdmins } from './pages/admin/AdminAdmins';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminSyncMonitor } from './pages/admin/AdminSyncMonitor';
import { AdminSyncHealth } from './pages/admin/AdminSyncHealth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />

            {/* Student Protected Routes */}
            <Route
              element={
                <ProtectedStudentRoute>
                  <StudentLayout />
                </ProtectedStudentRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/connect-platforms" element={<ConnectPlatforms />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Admin Public Route */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/setup" element={<AdminSetup />} />
            <Route path="/admin/set-password/:token" element={<AdminSetPassword />} />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:id" element={<AdminStudentDetail />} />
              <Route path="batches" element={<AdminBatches />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="sync-monitor" element={<AdminSyncMonitor />} />
              <Route path="system/sync-health" element={<AdminSyncHealth />} />
              <Route path="reports" element={<AdminReports />} />
              <Route
                path="admins"
                element={
                  <ProtectedAdminRoute requiredRole="Super Admin">
                    <AdminAdmins />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
