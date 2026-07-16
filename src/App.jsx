import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import LandingPage from './pages/LandingPage';
import Templates from './pages/Templates';
import FormBuilder from './pages/FormBuilder';
import MyForms from './pages/MyForms';
import PublishedForm from './pages/PublishedForm';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';

// Role-Based Router Protection Guard
function ProtectedRoute({ children, allowedRoles }) {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  let userRole = localStorage.getItem('userRole') || '';
  if (userRole === 'superadmin') {
    userRole = 'admin';
  }

  if (!isLoggedIn) {
    localStorage.setItem('redirectUrl', window.location.pathname);
    // Determine where to redirect based on target path
    if (window.location.pathname.startsWith('/super-admin') || window.location.pathname.startsWith('/superadmin') || window.location.pathname.startsWith('/admin')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If not authorized, redirect standard users to templates, admins to admin dashboard
    if (userRole === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/templates" replace />;
  }

  return children;
}

function App() {
  // Migrate legacy superadmin session in localStorage to admin role automatically
  if (localStorage.getItem('userRole') === 'superadmin') {
    localStorage.setItem('userRole', 'admin');
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/get-started" element={<Navigate to="/auth" replace />} />

      {/* User Paths */}
      <Route path="/my-forms" element={
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <MyForms />
        </ProtectedRoute>
      } />
      <Route path="/templates" element={
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <Templates />
        </ProtectedRoute>
      } />
      <Route path="/form-builder" element={
        <ProtectedRoute allowedRoles={['user', 'admin']}>
          <FormBuilder />
        </ProtectedRoute>
      } />
      <Route path="/form/:formId" element={<PublishedForm />} />
      <Route path="/auth" element={<Auth />} />

      {/* Dedicated Admin Login */}
      <Route path="/admin/login" element={<Auth portalType="admin" />} />
      <Route path="/super-admin/login" element={<Navigate to="/admin/login" replace />} />

      {/* Admin Dashboard Paths */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Redirect Super Admin Paths to Admin Dashboard */}
      <Route path="/superadmin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/super-admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/super-admin/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

export default App;

