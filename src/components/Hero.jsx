import { Link, useNavigate } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();

  const handleDemoClick = (e) => {
    e.preventDefault();
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (loggedIn) {
      navigate('/form/innovation-grant');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  const getQrUrl = () => {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://forms-registration-sand.vercel.app/form/student-registration-form';
    }
    return `${origin}/form/student-registration-form`;
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
            <Link to="/auth?mode=signup" className="btn-primary" id="hero-start-btn">
              <span>Start Building Free</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
            <button onClick={handleDemoClick} className="btn-secondary" id="hero-demo-btn" style={{ outline: 'none' }}>
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

          {/* QR Registration Section */}
          <div className="hero-qr-section" style={{
            marginTop: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '14px',
            width: '100%',
            maxWidth: '560px',
            marginInline: 'auto'
          }}>
            <h3 style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#7B1C1C',
              margin: 0,
              letterSpacing: '-0.3px'
            }}>
              MCC MRFIP Registration
            </h3>
            <p style={{
              fontSize: '14.5px',
              color: '#64748b',
              lineHeight: '1.6',
              margin: 0,
              maxWidth: '440px'
            }}>
              Scan this QR code with your phone's camera to open the MCC MRFIP Registration Form.
            </p>
            
            {/* White Rounded Card with QR Code */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '20px',
              boxShadow: '0 12px 30px rgba(123, 28, 28, 0.08), 0 4px 12px rgba(0,0,0,0.02)',
              border: '1px solid rgba(123, 28, 28, 0.08)',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: '10px',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            onClick={() => window.open(getQrUrl(), '_blank')}
            >
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(getQrUrl())}&color=7B1C1C`} 
                alt="MCC MRFIP Registration Form QR Link"
                style={{
                  width: '180px',
                  height: '180px',
                  display: 'block'
                }}
              />
            </div>
            <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
              Note: Resolving to production domain ({getQrUrl().split('/form')[0]}) for global scanning.
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
