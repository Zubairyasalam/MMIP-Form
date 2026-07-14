import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}${menuOpen ? ' mobile-active' : ''}`}>
      <div className="navbar-inner">
        <a href="#" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <img src="/mcc-mrf-logo.png?v=2" alt="MCC-MRF Innovation Park" />
        </a>

        <div className={`navbar-menu${menuOpen ? ' open' : ''}`}>
          <ul className="navbar-links">
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a></li>
            <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          </ul>

          <div className="navbar-cta">
            <Link to="/auth" className="nav-sign-in" onClick={() => setMenuOpen(false)}>Sign In</Link>
            <Link to="/auth" className="btn-primary" onClick={() => setMenuOpen(false)}>
              <span>Get Started</span>
            </Link>
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
