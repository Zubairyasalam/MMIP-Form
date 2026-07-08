import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract initial mode from query params (?mode=signup or ?mode=login)
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [activeTab, setActiveTab] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn) {
      navigate('/templates');
    }
  }, [navigate]);

  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate successful authentication and save state
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', formData.email || 'student@mcc.edu.in');
    // Go to Templates page
    navigate('/templates');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side Panel - Branding */}
        <div className="auth-brand-panel">
          <img src="/mcc-mrf-logo.png" alt="MCC-MRF" className="auth-logo" style={{ width: '137px', height: '60px' }} />
          <div className="auth-welcome-text">
            <h2>Empowering Innovation at MCC</h2>
            <p>
              Login to access the MCC-MRF Innovation Park Form Management Platform. 
              Build, publish, and analyze student and faculty research, grants, and feedback.
            </p>
          </div>
          <div className="auth-footer-text">
            © 2026 Madras Christian College. All rights reserved.
          </div>
        </div>

        {/* Right Side Panel - Interactive Form */}
        <div className="auth-form-panel">
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn${activeTab === 'login' ? ' active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn${activeTab === 'signup' ? ' active' : ''}`}
              onClick={() => setActiveTab('signup')}
            >
              Create Account
            </button>
          </div>

          {activeTab === 'login' ? (
            <form onSubmit={handleSubmit} id="auth-login-form">
              <div className="auth-form-title">Welcome Back</div>
              <div className="auth-form-subtitle">Enter your credentials to access your workspace</div>

              <div className="auth-input-group">
                <label>Institution Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@mcc.edu.in"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="auth-btn-primary">
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} id="auth-signup-form">
              <div className="auth-form-title">Create Free Account</div>
              <div className="auth-form-subtitle">Register your institutional ID to start building forms</div>

              <div className="auth-input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Institution Email</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="name@mcc.edu.in"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="auth-input-group">
                <label>Password</label>
                <input
                  type="password"
                  className="auth-input"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="auth-btn-primary">
                Create Free Account
              </button>
            </form>
          )}

          <div className="auth-divider">or continue with</div>

          <div className="auth-social-row">
            <button type="button" className="auth-social-btn" onClick={() => { localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('userEmail', 'student@mcc.edu.in'); navigate('/templates'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#ea4335' }}>
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.127 4.114a5.955 5.955 0 0 1-5.965-5.97 5.955 5.955 0 0 1 5.965-5.97 5.86 5.86 0 0 1 4.11 1.705l3.007-3.01C18.99 3.09 15.86 1.8 12.24 1.8 6.36 1.8 1.8 6.36 1.8 12s4.56 10.2 10.44 10.2c5.96 0 9.878-4.11 9.878-10.03 0-.685-.058-1.285-.18-1.885H12.24Z" fill="currentColor" stroke="none" />
              </svg>
              Google
            </button>
            <button type="button" className="auth-social-btn" onClick={() => { localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('userEmail', 'student@mcc.edu.in'); navigate('/templates'); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: '#0078d4' }}>
                <path d="M11.4 1.8H1.8v9.6h9.6V1.8Zm10.8 0h-9.6v9.6h9.6V1.8ZM11.4 12.6H1.8v9.6h9.6v-9.6Zm10.8 0h-9.6v9.6h9.6v-9.6Z" fill="currentColor" stroke="none" />
              </svg>
              Microsoft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
