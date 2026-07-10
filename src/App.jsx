import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import LandingPage from './pages/LandingPage';
import Templates from './pages/Templates';
import FormBuilder from './pages/FormBuilder';
import PublishedForm from './pages/PublishedForm';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Auth from './pages/Auth';

// Role-Based Router Protection Guard
function ProtectedRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userRole = localStorage.getItem('userRole') || '';

  if (!isLoggedIn) {
    localStorage.setItem('redirectUrl', window.location.pathname);
    // Determine where to redirect based on target path
    if (window.location.pathname.startsWith('/super-admin') || window.location.pathname.startsWith('/superadmin')) {
      return <Navigate to="/super-admin/login" replace />;
    }
    if (window.location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If not authorized, redirect standard users to templates, admins to admin dashboard
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (userRole === 'superadmin') {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    return <Navigate to="/templates" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/get-started" element={<Navigate to="/auth" replace />} />
      
      {/* User Paths */}
      <Route path="/templates" element={
        <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
          <Templates />
        </ProtectedRoute>
      } />
      <Route path="/form-builder" element={
        <ProtectedRoute allowedRoles={['user', 'admin', 'superadmin']}>
          <FormBuilder />
        </ProtectedRoute>
      } />
      <Route path="/form/:formId" element={<PublishedForm />} />
      <Route path="/auth" element={<Auth />} />
      
      {/* Dedicated Admin/Super Admin Logins */}
      <Route path="/admin/login" element={<Auth portalType="admin" />} />
      <Route path="/super-admin/login" element={<Auth portalType="superadmin" />} />

      {/* Admin Dashboard Paths */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Super Admin Dashboard Paths */}
      <Route path="/superadmin" element={<Navigate to="/super-admin/dashboard" replace />} />
      <Route path="/super-admin" element={<Navigate to="/super-admin/dashboard" replace />} />
      <Route path="/super-admin/dashboard" element={
        <ProtectedRoute allowedRoles={['superadmin']}>
          <SuperAdminDashboard />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
