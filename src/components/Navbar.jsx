import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    setIsAdmin(localStorage.getItem('userEmail') === 'admin@mcc.edu.in');
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-inner">
        <a href="#" className="navbar-logo">
          <img src="/mcc-mrf-logo.png" alt="MCC-MRF Innovation Park" />
        </a>

        <ul className="navbar-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#about">About</a></li>
        </ul>

        <div className="navbar-cta">
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin" className="nav-sign-in" style={{ fontWeight: '600', color: '#475569', marginRight: '16px' }}>Admin Portal</Link>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem('isLoggedIn');
                  setIsLoggedIn(false);
                  window.location.reload();
                }}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  background: '#7B1C1C',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/auth?mode=login" className="nav-sign-in">Sign In</Link>
              <Link to="/auth?mode=signup" className="btn-primary">
                <span>Get Started</span>
              </Link>
            </>
          )}
        </div>

        <button className="mobile-menu-btn" aria-label="Toggle menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </nav>
  );
}
