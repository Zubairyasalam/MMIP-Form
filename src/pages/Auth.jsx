import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const DEFAULT_ACCOUNTS = [
  {
    id: 'usr-default-superadmin',
    name: 'System Super Admin',
    email: 'superadmin@mcc.edu.in',
    password: 'admin123',
    role: 'superadmin',
    created_at: '2026-06-12 10:00:00',
    last_login_at: '',
    last_logout_at: '',
    account_status: 'Active'
  },
  {
    id: 'usr-default-admin',
    name: 'Admin',
    email: 'admin@mcc.edu.in',
    password: 'admin123',
    role: 'admin',
    created_at: '2026-06-12 10:05:00',
    last_login_at: '',
    last_logout_at: '',
    account_status: 'Active'
  }
];

export default function Auth({ portalType }) {
  const navigate = useNavigate();

  // Mode: 'signin' or 'signup'
  const [authMode, setAuthMode] = useState('signin');

  useEffect(() => {
    if (portalType === 'admin' || portalType === 'superadmin') {
      setAuthMode('signin');
    }
  }, [portalType]);

  // Input states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Extra controls
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize backend accounts in database silently
  useEffect(() => {
    let users = [];
    const saved = localStorage.getItem('appUsers');
    if (saved) {
      try {
        users = JSON.parse(saved);
      } catch (e) {
        users = [];
      }
    }
    
    let updated = [...users];
    let changed = false;
    
    DEFAULT_ACCOUNTS.forEach(defAcc => {
      const exists = updated.some(u => u.email === defAcc.email);
      if (!exists) {
        updated.push(defAcc);
        changed = true;
      }
    });
    
    if (changed || !saved) {
      localStorage.setItem('appUsers', JSON.stringify(updated));
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
      const userRole = localStorage.getItem('userRole') || 'user';
      if (userRole === 'superadmin') {
        navigate('/super-admin/dashboard');
      } else if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/templates');
      }
    }
  }, [navigate]);

  // Log activity helper
  const logLoginActivity = (user, statusText) => {
    const activityLog = JSON.parse(localStorage.getItem('loginActivity') || '[]');
    const newLog = {
      id: `act-${Date.now()}`,
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      login_time: new Date().toLocaleString(),
      logout_time: '',
      status: statusText
    };
    localStorage.setItem('loginActivity', JSON.stringify([newLog, ...activityLog]));
  };

  const checkEmailTypo = (emailVal) => {
    const emailLower = emailVal.toLowerCase();
    const typoMap = {
      'gmial.com': 'gmail.com',
      'gamil.com': 'gmail.com',
      'gmaill.com': 'gmail.com',
      'gmal.com': 'gmail.com',
      'mcc.edu': 'mcc.edu.in',
      'mcc.in': 'mcc.edu.in'
    };
    for (const [typo, correction] of Object.entries(typoMap)) {
      if (emailLower.endsWith(`@${typo}`)) {
        const username = emailLower.split('@')[0];
        return `${username}@${correction}`;
      }
    }
    return null;
  };

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const emailTypoCorrection = checkEmailTypo(email);
    if (emailTypoCorrection) {
      setErrorMsg(
        <span>
          Did you mean <strong>{emailTypoCorrection}</strong>? <span style={{ textDecoration: 'underline', cursor: 'pointer', color: '#7B1C1C', fontWeight: 'bold' }} onClick={() => { setEmail(emailTypoCorrection); setErrorMsg(''); }}>Click here to use it</span>.
        </span>
      );
      return;
    }

    if (authMode === 'signup') {
      if (!fullName) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters long.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

        if (userExists) {
          setErrorMsg(
            <span>
              An account with this email already exists. Please switch to the <strong>Sign In</strong> tab to log in.
            </span>
          );
          setLoading(false);
          return;
        }

        // Register new user (role: 'user')
        const newUser = {
          id: `usr-${Date.now()}`,
          name: fullName,
          email: email.toLowerCase(),
          password: password,
          role: 'user',
          created_at: new Date().toLocaleString(),
          last_login_at: new Date().toLocaleString(),
          last_logout_at: '',
          account_status: 'Active'
        };

        const updatedUsers = [...users, newUser];
        localStorage.setItem('appUsers', JSON.stringify(updatedUsers));

        // Create Session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', newUser.role);
        localStorage.setItem('userEmail', newUser.email);
        localStorage.setItem('userName', newUser.name);
        localStorage.setItem('userId', newUser.id);
        if (rememberMe) {
          localStorage.setItem('rememberUser', 'true');
        }

        logLoginActivity(newUser, 'Registered & Signed In');

        setLoading(false);
        const redirect = localStorage.getItem('redirectUrl');
        if (redirect) {
          localStorage.removeItem('redirectUrl');
          navigate(redirect);
        } else {
          navigate('/templates');
        }
        window.location.reload();
      }, 800);

    } else {
      // Sign In Flow
      setLoading(true);
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
        const targetUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!targetUser) {
          setErrorMsg(
            <span>
              This email is not registered. Please switch to the <strong>Sign Up</strong> tab at the top to register a new account.
            </span>
          );
          setLoading(false);
          return;
        }

        if (targetUser.password !== password) {
          setErrorMsg('Incorrect email address or password.');
          setLoading(false);
          return;
        }

        // Create Session
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userRole', targetUser.role);
        localStorage.setItem('userEmail', targetUser.email);
        localStorage.setItem('userName', targetUser.name);
        localStorage.setItem('userId', targetUser.id);
        if (rememberMe) {
          localStorage.setItem('rememberUser', 'true');
        }

        // Update login stats
        const updatedUsers = users.map(u => 
          u.id === targetUser.id 
            ? { ...u, last_login_at: new Date().toLocaleString() } 
            : u
        );
        localStorage.setItem('appUsers', JSON.stringify(updatedUsers));

        logLoginActivity(targetUser, 'Logged In');

        setLoading(false);
        const redirect = localStorage.getItem('redirectUrl');
        if (redirect) {
          localStorage.removeItem('redirectUrl');
          navigate(redirect);
        } else {
          if (targetUser.role === 'superadmin') {
            navigate('/superadmin');
          } else if (targetUser.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/templates');
          }
        }
        window.location.reload();
      }, 700);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        {/* Left Branding Panel */}
        <div className="auth-brand-panel">
          <img src="/mcc-mrf-logo-white.png?v=2" alt="MCC-MRF" className="auth-logo" style={{ height: '54px', objectFit: 'contain', marginBottom: '24px' }} />
          <div className="auth-welcome-text">
            <h2>{portalType === 'admin' ? 'Admin Portal' : portalType === 'superadmin' ? 'Super Admin Portal' : 'Madras Christian College'}</h2>
            <h3 style={{ opacity: 0.9, fontWeight: '600', fontSize: '18px', marginTop: '6px' }}>
              {portalType === 'admin' || portalType === 'superadmin' ? 'MMIP Management Platform' : 'MRF Innovation Park'}
            </h3>
            <p style={{ marginTop: '16px', lineHeight: '1.6' }}>
              {portalType === 'admin'
                ? 'Access the MCC-MRF Innovation Park Admin Portal to manage form templates, view response sheets, and configure platform settings.'
                : portalType === 'superadmin'
                  ? 'Access the MCC-MRF Innovation Park Super Admin control center to manage system settings, administrators, and view global audit logs.'
                  : 'Create your account to browse form templates, build customized forms, and manage survey responses through the MMIP platform.'}
            </p>
          </div>
          <div className="auth-footer-text">
            © 2026 Madras Christian College. All rights reserved.
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-card-body">
            
            {/* Clean Switch Header */}
            {(!portalType || (portalType !== 'admin' && portalType !== 'superadmin')) ? (
              <div className="auth-tabs" style={{ display: 'flex', borderBottom: '2.5px solid #f1f5f9', marginBottom: '24px', gap: '16px' }}>
                <button 
                  type="button"
                  className={`auth-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
                  style={{ flex: 1, paddingBottom: '12px', fontSize: '16px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', color: authMode === 'signin' ? '#7B1C1C' : '#94a3b8', borderBottom: authMode === 'signin' ? '2.5px solid #7B1C1C' : 'none', marginBottom: '-2.5px' }}
                >
                  Sign In
                </button>
                <button 
                  type="button"
                  className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                  style={{ flex: 1, paddingBottom: '12px', fontSize: '16px', fontWeight: '700', border: 'none', background: 'none', cursor: 'pointer', color: authMode === 'signup' ? '#7B1C1C' : '#94a3b8', borderBottom: authMode === 'signup' ? '2.5px solid #7B1C1C' : 'none', marginBottom: '-2.5px' }}
                >
                  Sign Up
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>
                  {portalType === 'admin' ? '⚙️ Admin Portal Sign In' : '🛡️ Super Admin Sign In'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px' }}>
                  Please enter your institutional credentials to log in.
                </p>
              </div>
            )}

            {errorMsg && <div className="auth-error-banner">⚠️ {errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-inputs-wrap">
              {authMode === 'signup' && (
                <div className="auth-input-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zubaira"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    disabled={loading}
                    autoFocus
                  />
                </div>
              )}

              <div className="auth-input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="auth-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Password</label>
                  {authMode === 'signin' && (
                    <span 
                      style={{ fontSize: '11px', color: '#7B1C1C', cursor: 'pointer', fontWeight: '600' }}
                      onClick={() => alert('Password reset simulation: An instructions link has been sent to your email.')}
                    >
                      Forgot Password?
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    style={{ paddingRight: '45px' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div className="auth-input-group">
                  <label>Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#7B1C1C', cursor: 'pointer' }}
                />
                <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', select: 'none' }}>
                  Remember me on this device
                </label>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading} style={{ background: '#7B1C1C', border: 'none', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '10px', marginTop: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span>{loading ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
