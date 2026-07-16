import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEMPLATES, TEMPLATE_THEMES } from '../data/templates';
import './GetStarted.css';

export default function GetStarted() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
  }, []);

  const handleTemplateClick = (tmpl) => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/auth?mode=signup');
    } else {
      if (tmpl === 'blank') {
        navigate('/form-builder', {
          state: {
            templateName: 'Untitled Form',
            questions: [
              { type: 'short', question: 'Untitled Question', options: [], required: false }
            ],
            theme: { banner: 'linear-gradient(90deg, #5a1313, #7B1C1C, #a82828)', accent: '#7B1C1C' }
          }
        });
      } else {
        navigate('/form-builder', {
          state: {
            templateName: tmpl.name,
            questions: tmpl.questions,
            theme: TEMPLATE_THEMES[tmpl.bg],
          }
        });
      }
    }
  };

  // Find pre-configured templates
  const grantTmpl = TEMPLATES.find(t => t.name.includes('Innovation Grant')) || TEMPLATES[0];
  const regTmpl = TEMPLATES.find(t => t.name.includes('Registration')) || TEMPLATES[1];

  return (
    <div className="getstarted-page">
      {/* Top bar */}
      <div className="getstarted-topbar">
        <img src="/mcc-mrf-logo.png?v=2" alt="MCC-MRF Innovation Park" />
        <Link to="/" className="getstarted-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </Link>
      </div>

      {/* Main */}
      <div className="getstarted-main">
        <div className="getstarted-card">

          {/* Header */}
          <div className="getstarted-card-header">
            <div className="getstarted-header-logo">MCC-MRF Innovation Park</div>
            <h1 className="getstarted-header-title">Step 1: Choose a Template to Begin</h1>
            <p className="getstarted-header-sub">
              Select one of our popular pre-built form templates or start with a blank form to build your customized form in minutes.
            </p>
          </div>

          {/* Steps */}
          <div className="getstarted-steps">
            {/* Blank Form Card */}
            <div
              className="getstarted-step"
              onClick={() => handleTemplateClick('blank')}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-number" style={{ background: '#7B1C1C' }}>1</div>
              <span className="step-icon" style={{ fontSize: '32px' }}>📄</span>
              <div className="step-title">Start Blank Form</div>
              <p className="step-desc">Start from scratch and design a completely custom form for your specific requirements.</p>
              <span className="step-arrow" style={{ fontWeight: 'bold', color: '#7B1C1C' }}>Start →</span>
            </div>

            {/* Innovation Grant Card */}
            <div
              className="getstarted-step"
              onClick={() => handleTemplateClick(grantTmpl)}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-number" style={{ background: '#7B1C1C' }}>2</div>
              <span className="step-icon" style={{ fontSize: '32px' }}>🎨</span>
              <div className="step-title">Innovation Grant</div>
              <p className="step-desc">Pre-built application form for research, faculty projects, and innovation grant funding.</p>
              <span className="step-arrow" style={{ fontWeight: 'bold', color: '#7B1C1C' }}>Use Template →</span>
            </div>

            {/* Student Registration Card */}
            <div
              className="getstarted-step"
              onClick={() => handleTemplateClick(regTmpl)}
              style={{ cursor: 'pointer' }}
            >
              <div className="step-number" style={{ background: '#7B1C1C' }}>3</div>
              <span className="step-icon" style={{ fontSize: '32px' }}>📝</span>
              <div className="step-title">Student Registration</div>
              <p className="step-desc">Ready-to-use registration form for workshops, college courses, events, and student clubs.</p>
              <span className="step-arrow" style={{ fontWeight: 'bold', color: '#7B1C1C' }}>Use Template →</span>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="getstarted-bottom">
            <div className="getstarted-bottom-text">
              {isLoggedIn ? (
                <span><strong>Welcome back!</strong> Access your forms dashboard or switch accounts.</span>
              ) : (
                <span><strong>Ready to build?</strong> Create your first form for free — no credit card needed.</span>
              )}
            </div>
            <div className="getstarted-cta-group">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => {
                      localStorage.removeItem('isLoggedIn');
                      setIsLoggedIn(false);
                    }}
                    className="btn-outline-maroon"
                    id="getstarted-signout-btn"
                    style={{ cursor: 'pointer' }}
                  >
                    Sign Out
                  </button>
                  <Link to="/templates" className="btn-primary" id="getstarted-dashboard-btn">
                    <span>Go to Dashboard</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth?mode=login" className="btn-outline-maroon" id="getstarted-signin-btn">Sign In</Link>
                  <Link to="/auth?mode=signup" className="btn-primary" id="getstarted-create-btn">
                    <span>Create Free Account</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
