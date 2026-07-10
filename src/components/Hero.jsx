import { useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();

  const handleDemoClick = (e) => {
    e.preventDefault();
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn) {
      navigate('/form/innovation-grant');
    } else {
      navigate('/templates');
    }
  };

  const handleStartBuilding = (e) => {
    e.preventDefault();
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn) {
      navigate('/templates');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="hero" id="home">
      {/* Background blobs */}
      <div className="hero-bg-blob hero-bg-blob-1" />
      <div className="hero-bg-blob hero-bg-blob-2" />
      <div className="hero-bg-blob hero-bg-blob-3" />

      <div style={{ width: '100%' }}>
        {/* Main hero content */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            MCC-MRF Innovation Park — Madras Christian College
          </div>

          <h1 className="hero-title">
            Build Beautiful Forms in
            <span className="hero-title-highlight">Minutes</span>
          </h1>

          <p className="hero-subtitle">
            Create professional forms with drag-and-drop simplicity. No coding required.
            Start collecting data, payments, and feedback today.
          </p>

          <div className="hero-actions">
            <button onClick={handleStartBuilding} className="btn-primary" id="hero-start-btn" style={{ border: 'none', cursor: 'pointer' }}>
              <span>Start Building Free</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button onClick={handleDemoClick} className="btn-secondary" id="hero-demo-btn">
              View Demo
            </button>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-number">10K+</span>
              <span className="hero-stat-label">Forms Created</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">500+</span>
              <span className="hero-stat-label">Active Users</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">99.9%</span>
              <span className="hero-stat-label">Uptime</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-number">50+</span>
              <span className="hero-stat-label">Templates</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
