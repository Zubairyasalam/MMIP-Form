import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import LandingPage from './pages/LandingPage';
import Templates from './pages/Templates';
import FormBuilder from './pages/FormBuilder';
import PublishedForm from './pages/PublishedForm';
import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/get-started" element={<Navigate to="/templates" replace />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/form-builder" element={<FormBuilder />} />
      <Route path="/form/:formId" element={<PublishedForm />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
