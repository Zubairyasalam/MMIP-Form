import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEMPLATES, TEMPLATE_THEMES } from '../data/templates';
import './Templates.css';

export default function Templates() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/auth?mode=login');
    }
  }, [navigate]);

  const handleUseTemplate = (tmpl) => {
    navigate('/form-builder', {
      state: {
        templateName: tmpl.name,
        questions: tmpl.questions,
        theme: TEMPLATE_THEMES[tmpl.bg],
      }
    });
  };

  const filtered = TEMPLATES.filter(t => {
    return t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="templates-page">
      {/* Top bar */}
      <div className="templates-topbar">
        <Link to="/">
          <img src="/mcc-mrf-logo.png" alt="MCC-MRF" className="templates-topbar-logo" />
        </Link>

        <div className="templates-search-wrap">
          <svg className="templates-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="templates-search"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="template-search-input"
          />
        </div>

        <div className="templates-topbar-right">
          <Link to="/" style={{ padding: '9px 20px', fontSize: '13px', borderRadius: '999px', border: '1.5px solid #7B1C1C', color: '#7B1C1C', textDecoration: 'none', fontWeight: '600', fontFamily: 'Inter, sans-serif', transition: 'all 0.25s' }}>
            ← Back
          </Link>
          <button
            className="templates-signout-btn"
            onClick={() => {
              localStorage.removeItem('isLoggedIn');
              navigate('/');
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="templates-main">
        {/* Main content */}
        <div className="templates-content">
          <div className="templates-content-header">
            <div>
              <div className="templates-content-title">
                {search ? `Results for "${search}"` : 'All Templates'}
              </div>
              <div className="templates-content-count">{filtered.length} templates available</div>
            </div>
            <div className="templates-sort">
              Sort by:
              <select id="templates-sort-select">
                <option>Most Popular</option>
                <option>Newest</option>
                <option>A–Z</option>
              </select>
            </div>
          </div>

          <div className="templates-grid">
            {filtered.map((tmpl, i) => {
              const theme = TEMPLATE_THEMES[tmpl.bg];
              return (
                <div
                  className="template-card"
                  key={i}
                  id={`template-card-${i}`}
                  onClick={() => handleUseTemplate(tmpl)}
                >
                  {/* Preview with theme-colored banner */}
                  <div className={`template-card-preview ${tmpl.bg}`}>
                    <div className="template-mini-form">
                      <div className="mini-form-title">{tmpl.name}</div>
                      <div className="mini-form-field full" />
                      <div className="mini-form-field short" />
                      <div className="mini-form-field full" />
                      <div className="mini-form-btn" style={{ background: theme.accent }} />
                    </div>
                    <div className="template-overlay" style={{ background: `${theme.accent}cc` }}>
                      <button className="template-use-btn" style={{ color: theme.accent }}>Use This Template →</button>
                    </div>
                  </div>

                  <div className="template-card-body">
                    <div className="template-card-name">{tmpl.name}</div>
                    <div className="template-card-desc">{tmpl.desc}</div>
                    <div className="template-card-footer">
                      <span className="template-tag" style={{ color: theme.accent, background: `${theme.accent}15` }}>{tmpl.tag}</span>
                      <span className="template-fields">{tmpl.fields}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
