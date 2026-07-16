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

  const handleDownloadQR = async (name) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      `${getOrigin()}/form/${slug}`
    )}&color=000000`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${slug}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      window.open(qrUrl, '_blank');
    }
  };

  const handleShareLink = async (title, url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Scan or open this form: ${title}`,
          url: url,
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard! (Web Share is not supported on this device/browser)');
    }
  };

  const handleShareQR = async (title, qrUrl) => {
    try {
      const response = await fetch(qrUrl.replace('size=180x180', 'size=500x500'));
      const blob = await response.blob();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form';
      const file = new File([blob], `${slug}-qr-code.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${title} QR Code`,
          text: `Scan this QR code to access the ${title} form`,
        });
      } else {
        const formUrl = `${getOrigin()}/form/${slug}`;
        if (navigator.share) {
          await navigator.share({
            title: title,
            text: `Scan or open this form: ${title}`,
            url: formUrl,
          });
        } else {
          navigator.clipboard.writeText(formUrl);
          alert('Link copied to clipboard! (Device does not support file sharing)');
        }
      }
    } catch (e) {
      console.error(e);
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form';
      const formUrl = `${getOrigin()}/form/${slug}`;
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: `Scan or open this form: ${title}`,
          url: formUrl,
        });
      } else {
        navigator.clipboard.writeText(formUrl);
        alert('Link copied to clipboard!');
      }
    }
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
      .catch(() => { });

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

      const currentUserId = localStorage.getItem('userId') || 'guest';
      let existing = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('customForms_')) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key));
            if (Array.isArray(parsed)) {
              parsed.forEach(p => {
                if (!existing.some(e => e.id === p.id)) {
                  existing.push(p);
                }
              });
            }
          } catch (e) {}
        }
      }

      defaultForms.forEach(df => {
        const exists = existing.find(e => e.id === df.id);
        if (!exists) {
          existing.push(df);
        }
      });

      const mapped = existing.map(cf => ({
        id: cf.id,
        name: cf.name || cf.title,
        desc: cf.desc || 'No description provided.',
        tag: cf.tag || 'Custom',
        fields: cf.fields || `${cf.questions?.length || 0} fields`,
        bg: cf.bg || 'maroon-bg',
        questions: cf.questions || [],
        status: cf.status || 'Active',
        visibility: cf.visibility || 'public',
        is_hidden: cf.is_hidden !== undefined ? cf.is_hidden : (cf.status === 'Hidden'),
        created_by: cf.created_by || cf.creator_id || 'System'
      }));

      // Filter based on User Dashboard visibility rules:
      // Only display templates where: Visibility = Public AND Hidden = No AND Status = Active
      // Private templates are visible only to the creator admin
      const visibleTemplates = mapped.filter(t => {
        const creatorId = t.created_by || t.creator_id || 'System';
        
        // Hide if status is not Active (Draft / Inactive templates are hidden from users)
        if (t.status !== 'Active') return false;

        // Hide if is_hidden is true
        if (t.is_hidden) return false;

        // If visibility is private, only the creator can see it
        if (t.visibility === 'private') {
          return creatorId === currentUserId;
        }

        // Public templates are visible to everyone
        return true;
      });

      setAllTemplates(visibleTemplates);
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
        <img src="/mcc-mrf-logo.png?v=2" alt="MCC-MRF" className="templates-topbar-logo" />

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
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontSize: '13px',
              borderRadius: '20px',
              border: '1.5px solid #cbd5e1',
              color: '#475569',
              textDecoration: 'none',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              background: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#7B1C1C';
              e.currentTarget.style.borderColor = '#7B1C1C';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#475569';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.02)';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Home
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
              let theme = TEMPLATE_THEMES[tmpl.bg];
              let dynamicBannerStyle = {};
              let isDynamic = false;

              if (!theme && tmpl.bg?.startsWith('#')) {
                theme = { accent: tmpl.bg, label: 'Custom' };
                dynamicBannerStyle = { background: `linear-gradient(135deg, ${tmpl.bg}15 0%, ${tmpl.bg}33 100%)` };
                isDynamic = true;
              } else if (!theme) {
                theme = TEMPLATE_THEMES['maroon-bg'];
              }

              return (
                <div
                  className="template-card"
                  key={tmpl.id || i}
                  id={`template-card-${i}`}
                  onClick={() => handleUseTemplate(tmpl)}
                >
                  {/* Preview with theme-colored banner */}
                  <div className={`template-card-preview ${isDynamic ? '' : tmpl.bg}`} style={isDynamic ? dynamicBannerStyle : {}}>
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
          <div style={{ position: 'relative', background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxWidth: '440px', width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedTmplQr(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s',
                zIndex: 10
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#334155'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              aria-label="Close modal"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

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

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '20px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                border: '1px solid #f1f5f9',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${getOrigin()}/form/${selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
                  )}&color=000000`}
                  alt="Registration QR Code"
                  style={{ width: '180px', height: '180px', display: 'block' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => handleDownloadQR(selectedTmplQr.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f1f5f9',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: '#475569',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                      `${getOrigin()}/form/${selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
                    )}&color=000000`;
                    handleShareQR(selectedTmplQr.name, qrUrl);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: (TEMPLATE_THEMES[selectedTmplQr.bg] || TEMPLATE_THEMES['maroon-bg']).accent,
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = `${(TEMPLATE_THEMES[selectedTmplQr.bg] || TEMPLATE_THEMES['maroon-bg']).accent}cc`; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = (TEMPLATE_THEMES[selectedTmplQr.bg] || TEMPLATE_THEMES['maroon-bg']).accent; }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share
                </button>
              </div>
            </div>


            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Inter, sans-serif' }}>Shareable Form Link</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <input
                  type="text"
                  readOnly
                  value={`${getOrigin()}/form/${selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '12.5px', color: '#0f172a', fontWeight: '600', outline: 'none', fontFamily: 'Inter, sans-serif', width: '0' }}
                />
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      const slug = selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      const link = `${getOrigin()}/form/${slug}`;
                      navigator.clipboard.writeText(link);
                      alert('Link copied to clipboard!');
                    }}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => {
                      const slug = selectedTmplQr.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      const link = `${getOrigin()}/form/${slug}`;
                      handleShareLink(selectedTmplQr.name, link);
                    }}
                    style={{ background: (TEMPLATE_THEMES[selectedTmplQr.bg] || TEMPLATE_THEMES['maroon-bg']).accent, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" />
                      <circle cx="6" cy="12" r="3" />
                      <circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </button>
                </div>
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
