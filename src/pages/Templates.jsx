import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEMPLATES, TEMPLATE_THEMES } from '../data/templates';
import './Templates.css';

export default function Templates() {
  const [search, setSearch] = useState('');
  const [selectedTmplQr, setSelectedTmplQr] = useState(null);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [allTemplates, setAllTemplates] = useState([]);
  const [tunnelUrl, setTunnelUrl] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');

  // Auto-detect: if on localhost, try to pre-fill with LAN IP
  const getOrigin = () => {
    return customBaseUrl || tunnelUrl || window.location.origin;
  };

  const isLocalhost = () => {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
  };

  const openQrModal = (tmpl) => {
    setSelectedTmplQr(tmpl);
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/auth?mode=login');
    } else {
      setUserRole(localStorage.getItem('userRole') || 'user');
    }

    fetch('/tunnel.json')
      .then(res => res.json())
      .then(data => {
        if (data && data.url) {
          setTunnelUrl(data.url);
        }
      })
      .catch(() => {});

    const loadTemplates = () => {
      const defaultForms = TEMPLATES.map((t, idx) => ({
        id: `default-${idx + 1}`,
        name: t.name,
        desc: t.desc || '',
        tag: t.tag || 'Custom',
        fields: `${t.questions?.filter(q => q.type).length || 0} fields`,
        bg: t.bg || 'maroon-bg',
        questions: t.questions || [],
        button_text: 'Use Template',
        status: 'Active',
        created_at: '2026-06-12',
        creator: 'System'
      }));

      const saved = localStorage.getItem('customForms');
      let existing = [];
      try {
        existing = saved ? JSON.parse(saved) : [];
      } catch (e) {
        existing = [];
      }

      // Merge: add any default template whose id does not already exist
      let changed = false;
      defaultForms.forEach(df => {
        if (!existing.some(e => e.id === df.id)) {
          existing.push(df);
          changed = true;
        }
      });

      if (changed || !saved) {
        localStorage.setItem('customForms', JSON.stringify(existing));
      }

      const mapped = existing.map(cf => ({
        id: cf.id,
        name: cf.name || cf.title,
        desc: cf.desc || 'No description provided.',
        tag: cf.tag || 'Custom',
        fields: cf.fields || `${cf.questions?.length || 0} fields`,
        bg: cf.bg || 'maroon-bg',
        questions: cf.questions || [],
        status: cf.status || 'Active'
      }));

      // Only display Active templates to users in the listing page
      setAllTemplates(mapped.filter(t => t.status === 'Active'));
    };

    loadTemplates();

    window.addEventListener('storage', loadTemplates);
    return () => {
      window.removeEventListener('storage', loadTemplates);
    };
  }, [navigate]);

  const handleUseTemplate = (tmpl) => {
    const currentUserId = localStorage.getItem('userId') || 'guest';
    const formUsage = JSON.parse(localStorage.getItem('formUsage') || '[]');
    const newUsage = {
      id: `use-${Date.now()}`,
      user_id: currentUserId,
      user_email: localStorage.getItem('userEmail') || 'unknown@mcc.edu.in',
      template_id: tmpl.id,
      template_name: tmpl.name,
      used_at: new Date().toLocaleString()
    };
    localStorage.setItem('formUsage', JSON.stringify([newUsage, ...formUsage]));

    navigate('/form-builder', {
      state: {
        templateName: tmpl.name,
        questions: tmpl.questions,
        theme: TEMPLATE_THEMES[tmpl.bg] || TEMPLATE_THEMES['maroon-bg'],
      }
    });
  };

  const filtered = allTemplates.filter(t => {
    return t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tag.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="templates-page">
      {/* Top bar */}
      <div className="templates-topbar">
        <Link to="/">
          <img src="/mcc-mrf-logo.png?v=2" alt="MCC-MRF" className="templates-topbar-logo" />
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

        <div className="templates-topbar-right" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ padding: '9px 20px', fontSize: '13px', borderRadius: '999px', border: '1.5px solid #cbd5e1', color: '#475569', textDecoration: 'none', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>
            ← Home
          </Link>
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
              const theme = TEMPLATE_THEMES[tmpl.bg] || TEMPLATE_THEMES['maroon-bg'];
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
                    <div className="template-overlay" style={{ background: `${theme.accent}cc`, display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                      <button className="template-use-btn" style={{ color: theme.accent, width: '80%' }} onClick={() => handleUseTemplate(tmpl)}>
                        Use Template →
                      </button>
                      <button
                        className="template-use-btn"
                        style={{
                          color: '#fff',
                          background: 'rgba(255,255,255,0.2)',
                          border: '1.5px solid #fff',
                          width: '80%',
                          marginTop: '4px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openQrModal(tmpl);
                        }}
                      >
                        Scan QR Code
                      </button>
                    </div>
                  </div>

                  <div className="template-card-body">
                    <div className="template-card-name">{tmpl.name}</div>
                    <div className="template-card-desc">{tmpl.desc}</div>
                    <div className="template-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="template-tag" style={{ color: theme.accent, background: `${theme.accent}15` }}>{tmpl.tag}</span>
                        <span className="template-fields" style={{ marginLeft: '8px' }}>{tmpl.fields}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      {selectedTmplQr && (
        <div style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, justifyContent: 'center', alignItems: 'center', overflowY: 'auto', padding: '20px 0' }} onClick={() => { setSelectedTmplQr(null); }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '440px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
              {selectedTmplQr.name}
            </h3>
            <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5', fontFamily: 'Inter, sans-serif' }}>
              Scan this QR code with your phone's camera to open the live form directly.
            </p>

            {/* Network IP section - shown when on localhost */}
            {isLocalhost() && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', textAlign: 'left' }}>
                <div style={{ fontSize: '10px', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>📡 Network Address for Phone Scanning</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="e.g. http://192.168.1.5:5173"
                    value={customBaseUrl || tunnelUrl}
                    onChange={e => setCustomBaseUrl(e.target.value.trim().replace(/\/$/, ''))}
                    style={{ flex: 1, border: '1px solid #86efac', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', color: '#0f172a', fontWeight: '500', outline: 'none', fontFamily: 'Inter, sans-serif', background: 'white' }}
                  />
                </div>
                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
                  ✅ QR code points to: <strong>{customBaseUrl || tunnelUrl || window.location.origin}</strong>
                </div>
              </div>
            )}

            <div style={{
              background: 'white',
              padding: '16px',
              borderRadius: '20px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #f1f5f9',
              display: 'inline-flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  `${customBaseUrl || getOrigin()}/form/${selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
                )}&color=000000`}
                alt="Registration QR Code"
                style={{ width: '180px', height: '180px', display: 'block' }}
              />
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>Shareable Form Link</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  readOnly
                  value={`${customBaseUrl || getOrigin()}/form/${selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '12.5px', color: '#0f172a', fontWeight: '600', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                />
                <button
                  onClick={() => {
                    const slug = selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const link = `${customBaseUrl || getOrigin()}/form/${slug}`;
                    navigator.clipboard.writeText(link);
                    alert('Link copied to clipboard!');
                  }}
                  style={{ background: (TEMPLATE_THEMES[selectedTmplQr.bg] || TEMPLATE_THEMES['maroon-bg']).accent, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => setSelectedTmplQr(null)}
                style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
              >
                Close View
              </button>
              <a
                href={`/form/${selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: (TEMPLATE_THEMES[selectedTmplQr.bg] || TEMPLATE_THEMES['maroon-bg']).accent,
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                View Live
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
