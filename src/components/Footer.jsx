import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <img src="/mcc-mrf-logo-white.png?v=2" alt="MCC-MRF" className="footer-logo" />
            <p className="footer-brand-desc">
              MCC-MRF Innovation Park — Empowering research, innovation and entrepreneurship at Madras Christian College.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon" aria-label="LinkedIn">in</a>
              <a href="#" className="social-icon" aria-label="Twitter">𝕏</a>
              <a href="#" className="social-icon" aria-label="Email">✉</a>
            </div>
          </div>

          {/* Product */}
          <div>
            <div className="footer-col-title">Product</div>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#templates">Templates</a></li>
              <li><a href="#integrations">Integrations</a></li>
              <li><a href="#changelog">Changelog</a></li>
            </ul>
          </div>

          {/* Institution */}
          <div>
            <div className="footer-col-title">Institution</div>
            <ul className="footer-links">
              <li><a href="#about">About MCC</a></li>
              <li><a href="#innovation-park">Innovation Park</a></li>
              <li><a href="#programs">Programs</a></li>
              <li><a href="#research">Research</a></li>
              <li><a href="#events">Events</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="footer-col-title">Support</div>
            <ul className="footer-links">
              <li><a href="#docs">Documentation</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Contact</a></li>
              <li><a href="#status">System Status</a></li>
              <li><Link to="/admin/login">Admin Portal</Link></li>
              <li><a href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copy">
            © {new Date().getFullYear()} MCC-MRF Innovation Park, Madras Christian College. All rights reserved.
          </div>
          <div className="footer-bottom-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
