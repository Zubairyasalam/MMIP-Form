import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [customLogo, setCustomLogo] = useState(localStorage.getItem('customLogo') || "/mcc-mrf-logo.png?v=2");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);

    setIsLoggedIn(sessionStorage.getItem('isLoggedIn') === 'true' || localStorage.getItem('isLoggedIn') === 'true');
    setUserRole(sessionStorage.getItem('userRole') || localStorage.getItem('userRole'));
    setUserName(sessionStorage.getItem('userName') || localStorage.getItem('userName') || '');

    const handleStorageChange = () => {
      setCustomLogo(localStorage.getItem('customLogo') || "/mcc-mrf-logo.png?v=2");
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setIsLoggedIn(false);
    setUserName('');
    window.location.href = '/';
  };

  const dashboardLink = userRole === 'admin' ? '/admin/dashboard' : '/my-forms';

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}${menuOpen ? ' mobile-active' : ''}`}>
      <div className="navbar-inner">
        <a href="#" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img src={customLogo} alt="MCC-MRF Innovation Park" />
        </a>

        <div className={`navbar-menu${menuOpen ? ' open' : ''}`}>
          <ul className="navbar-links">
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a></li>
            <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          </ul>

          <div className="navbar-cta" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isLoggedIn ? (
              <>
                <span className="navbar-username" style={{ color: '#475569', fontWeight: '700', fontSize: '13.5px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 14px', borderRadius: '20px', border: '1.5px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  <span style={{ color: '#7B1C1C', fontSize: '10px' }}>●</span> {userName || 'User'}
                </span>
                <Link to={dashboardLink} className="nav-sign-in" onClick={() => setMenuOpen(false)}>
                  {userRole === 'admin' ? 'Dashboard' : 'Data Store'}
                </Link>
                <button onClick={handleLogout} className="btn-primary" style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="nav-sign-in" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/auth" className="btn-primary" onClick={() => setMenuOpen(false)}>
                  <span>Get Started</span>
                </Link>
              </>
            )}
          </div>
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  );
}
