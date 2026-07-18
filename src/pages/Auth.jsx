import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16);
};

const DEFAULT_ACCOUNTS = [
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
  },
  {
    id: 'usr-default-superadmin',
    name: 'Super Admin',
    email: 'superadmin@mcc.edu.in',
    password: 'superadmin123',
    role: 'superadmin',
    created_at: '2026-06-12 10:05:00',
    last_login_at: '',
    last_logout_at: '',
    account_status: 'Active'
  }
];

export default function Auth({ portalType }) {
  const navigate = useNavigate();
  const isAdminOrSuperAdmin = portalType === 'admin' || portalType === 'superadmin';

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

  // Forgot Password Flow States
  const [forgotStep, setForgotStep] = useState(1); // 1 = Enter Email, 2 = Verify & Reset
  const [resetEmail, setResetEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showSimulatedEmail, setShowSimulatedEmail] = useState(false);

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
      if (userRole === 'admin' || userRole === 'superadmin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/templates');
      }
    }
  }, [navigate]);

  // Log activity helper
  const logLoginActivity = (user, statusText, rawPassword = '') => {
    const activityLog = JSON.parse(localStorage.getItem('loginActivity') || '[]');
    const newLog = {
      id: `act-${Date.now()}`,
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      password: rawPassword || '—',
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

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const emailTypoCorrection = checkEmailTypo(trimmedEmail);
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
        const userExists = users.some(u => u.email.trim().toLowerCase() === trimmedEmail.toLowerCase());

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
          email: trimmedEmail.toLowerCase(),
          password: hashPassword(password),
          plain_password: password,
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

        logLoginActivity(newUser, 'Registered & Signed In', password);

        setLoading(false);
        const redirect = localStorage.getItem('redirectUrl');
        if (redirect) {
          localStorage.removeItem('redirectUrl');
          navigate(redirect);
        } else {
          navigate('/my-forms');
        }
      }, 800);

    } else {
      // Sign In Flow
      setLoading(true);
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
        const targetUser = users.find(u =>
          u.email.trim().toLowerCase() === trimmedEmail.toLowerCase() ||
          u.name.trim().toLowerCase() === trimmedEmail.toLowerCase()
        );

        if (!targetUser) {
          const registeredEmails = users.map(u => u.email).join(', ');
          setErrorMsg(
            <span>
              This email is not registered. Please switch to the <strong>Sign Up</strong> tab at the top to register a new account.
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px', wordBreak: 'break-all' }}>
                Registered accounts: {registeredEmails || 'None'}
              </div>
            </span>
          );
          setLoading(false);
          return;
        }

        const enteredHash = password.startsWith('hash_') ? password : hashPassword(password);
        const storedHash = targetUser.password.startsWith('hash_') ? targetUser.password : hashPassword(targetUser.password);

        if (storedHash !== enteredHash) {
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

        logLoginActivity(targetUser, 'Logged In', password);

        setLoading(false);
        const redirect = localStorage.getItem('redirectUrl');
        if (redirect) {
          localStorage.removeItem('redirectUrl');
          navigate(redirect);
        } else {
          if (targetUser.role === 'admin' || targetUser.role === 'superadmin') {
            navigate('/admin');
          } else {
            navigate('/my-forms');
          }
        }
      }, 700);
    }
  };

  const handleForgotSendCode = (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
      const targetUser = users.find(u => u.email.trim().toLowerCase() === resetEmail.trim().toLowerCase());

      if (!targetUser) {
        setErrorMsg('This email address is not registered in our system.');
        setLoading(false);
        return;
      }

      // Generate a mock 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setForgotStep(2);
      setShowSimulatedEmail(true);
      setLoading(false);
    }, 800);
  };

  const handleForgotResetPassword = (e) => {
    e.preventDefault();
    if (!enteredCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (enteredCode.trim() !== generatedCode) {
      setErrorMsg('Incorrect verification code. Please try again.');
      return;
    }
    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('appUsers') || '[]');
      const targetIndex = users.findIndex(u => u.email.trim().toLowerCase() === resetEmail.trim().toLowerCase());

      if (targetIndex === -1) {
        setErrorMsg('User not found. Please try again.');
        setLoading(false);
        return;
      }

      // Update password
      const user = users[targetIndex];
      users[targetIndex] = {
        ...user,
        password: hashPassword(newPassword),
        plain_password: newPassword
      };
      localStorage.setItem('appUsers', JSON.stringify(users));

      // Success
      setSuccessMsg('Password reset successfully! Redirecting to login...');
      setShowSimulatedEmail(false);
      setLoading(false);

      setTimeout(() => {
        // Reset everything and go back to Sign In
        setAuthMode('signin');
        setForgotStep(1);
        setResetEmail('');
        setGeneratedCode('');
        setEnteredCode('');
        setNewPassword('');
        setConfirmNewPassword('');
        setSuccessMsg('');
      }, 2000);

    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">

        {/* Left Branding Panel */}
        <div className="auth-brand-panel">
          <img src={localStorage.getItem('customLogoWhite') || "/mcc-mrf-logo-white.png?v=2"} alt="MCC-MRF" className="auth-logo" style={{ height: '100px', objectFit: 'contain', marginBottom: '24px' }} />
          <div className="auth-welcome-text">
            <h2>{isAdminOrSuperAdmin ? (portalType === 'superadmin' ? 'Super Admin Portal' : 'Admin Portal') : 'Madras Christian College'}</h2>
            <h3 style={{ opacity: 0.9, fontWeight: '600', fontSize: '18px', marginTop: '6px' }}>
              {isAdminOrSuperAdmin ? 'MMIP Management Platform' : 'MRF Innovation Park'}
            </h3>
            <p style={{ marginTop: '16px', lineHeight: '1.6' }}>
              {isAdminOrSuperAdmin
                ? 'Access the MCC-MRF Innovation Park Admin Portal to manage form templates, view response sheets, and configure platform settings.'
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
            {authMode === 'forgot' ? (
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: '#0f172a', fontSize: '20px', fontWeight: '800' }}>
                  🔑 Reset Password
                </h2>
                <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px' }}>
                  {forgotStep === 1 ? 'Enter your registered email address to verify your account.' : 'Verify the code and enter your new password.'}
                </p>
              </div>
            ) : (!portalType || (portalType !== 'admin' && portalType !== 'superadmin')) ? (
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
                  {portalType === 'superadmin' ? '🛡️ Super Admin Portal Sign In' : '⚙️ Admin Portal Sign In'}
                </h2>
                <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '6px' }}>
                  Please enter your institutional credentials to log in.
                </p>
              </div>
            )}

            {errorMsg && <div className="auth-error-banner">⚠️ {errorMsg}</div>}
            {successMsg && (
              <div style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', marginBottom: '20px', textAlign: 'center' }}>
                ✅ {successMsg}
              </div>
            )}

            {showSimulatedEmail && (
              <div style={{
                background: '#eff6ff',
                border: '1.5px solid #bfdbfe',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📩 Simulated Email Notification
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setShowSimulatedEmail(false)}
                    style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{ fontSize: '13px', color: '#1e3a8a', lineHeight: '1.4' }}>
                  <strong>To:</strong> {resetEmail}<br />
                  <strong>Subject:</strong> Password Reset Code<br />
                  Your 6-digit verification code is: <strong style={{ fontSize: '16px', color: '#b91c1c', background: '#f8fafc', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', marginLeft: '4px' }}>{generatedCode}</strong>
                </div>
              </div>
            )}

            {authMode === 'forgot' ? (
              forgotStep === 1 ? (
                <form onSubmit={handleForgotSendCode} className="auth-inputs-wrap">
                  <div className="auth-input-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. admin@mcc.edu.in"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: '#7B1C1C', border: 'none', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '10px', marginTop: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', outline: 'none' }}>
                    <span>{loading ? 'Sending Code...' : 'Send Verification Code'}</span>
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <span 
                      style={{ fontSize: '13px', color: '#7B1C1C', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                      onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
                    >
                      Back to Sign In
                    </span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotResetPassword} className="auth-inputs-wrap">
                  <div className="auth-input-group">
                    <label>6-Digit Verification Code</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter verification code"
                      value={enteredCode}
                      onChange={e => setEnteredCode(e.target.value)}
                      disabled={loading}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <div className="auth-input-group">
                    <label>New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="auth-input-group">
                    <label>Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={e => setConfirmNewPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: '#7B1C1C', border: 'none', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '10px', marginTop: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', outline: 'none' }}>
                    <span>{loading ? 'Resetting Password...' : 'Reset Password'}</span>
                  </button>
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <span 
                      style={{ fontSize: '13px', color: '#7B1C1C', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}
                      onClick={() => { setForgotStep(1); setErrorMsg(''); }}
                    >
                      Back to Step 1
                    </span>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="auth-inputs-wrap">
                {authMode === 'signup' && (
                  <div className="auth-input-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Name"
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
                    type={authMode === 'signup' ? 'email' : 'text'}
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
                        onClick={() => { setAuthMode('forgot'); setForgotStep(1); setErrorMsg(''); }}
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
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px', outline: 'none' }}
                    >
                      {showPassword ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
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
                  <label htmlFor="rememberMe" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer', userSelect: 'none' }}>
                    Remember me on this device
                  </label>
                </div>

                <button type="submit" className="btn-primary auth-submit-btn" disabled={loading} style={{ background: '#7B1C1C', border: 'none', color: 'white', fontWeight: 'bold', padding: '12px', borderRadius: '10px', marginTop: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                  <span>{loading ? 'Processing...' : authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                </button>
              </form>
            )}



            {portalType === 'admin' && (
              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13.5px' }}>
                  <span
                    onClick={() => navigate('/auth')}
                    style={{ color: '#7B1C1C', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    User Portal
                  </span>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <span
                    onClick={() => navigate('/super-admin/login')}
                    style={{ color: '#7B1C1C', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Super Admin Portal
                  </span>
                </div>
              </div>
            )}

            {portalType === 'superadmin' && (
              <div style={{ marginTop: '24px', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13.5px' }}>
                  <span
                    onClick={() => navigate('/auth')}
                    style={{ color: '#7B1C1C', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    User Portal
                  </span>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <span
                    onClick={() => navigate('/admin/login')}
                    style={{ color: '#7B1C1C', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Admin Portal
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
