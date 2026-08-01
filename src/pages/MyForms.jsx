import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TEMPLATE_THEMES } from '../data/templates';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getForms, saveForm, deleteForm, getResponses, deleteResponse } from '../utils/db';
import './Templates.css'; // Reusing existing card styles


export default function MyForms() {
  const [search, setSearch] = useState('');
  const [myForms, setMyForms] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [selectedFormForSubmissions, setSelectedFormForSubmissions] = useState(null);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState(null);
  const navigate = useNavigate();

  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/auth?mode=login');
      return;
    }
    loadForms();

    // Listen for storage changes from FormBuilder
    window.addEventListener('storage', loadForms);
    return () => window.removeEventListener('storage', loadForms);
  }, [navigate]);

  const loadForms = () => {
    getForms().then(forms => {
      const currentUserId = localStorage.getItem('userId') || 'guest';
      const filtered = forms.filter(f =>
        f.created_by === currentUserId ||
        f.creator_id === currentUserId ||
        (f.visibility === 'public' && !f.is_hidden)
      );
      setMyForms(filtered);
    });

    getResponses().then(subs => {
      setAllSubmissions(subs);
    });
  };

  const saveForms = (updatedForms) => {
    setMyForms(updatedForms);
    updatedForms.forEach(f => saveForm(f));
    window.dispatchEvent(new Event('storage'));
  };

  const handleEdit = (form) => {
    navigate('/form-builder', {
      state: {
        id: form.id,
        templateName: form.name,
        richName: form.richName || form.name,
        questions: form.questions || [],
        theme: form.theme,
        headerImage: form.headerImage,
        bg: form.bg,
      }
    });
  };

  const handleClone = (form) => {
    const cloned = {
      ...form,
      id: `clone-${Date.now()}`,
      name: `${form.name} (Copy)`,
      created: new Date().toLocaleDateString(),
      creator_id: localStorage.getItem('userId') || 'guest',
      created_by: localStorage.getItem('userId') || 'guest',
      updatedAt: Date.now()
    };
    saveForm(cloned).then(() => {
      loadForms();
      window.dispatchEvent(new Event('storage'));
    });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete "${stripHtml(name)}"?`)) {
      deleteForm(id).then(() => {
        loadForms();
        window.dispatchEvent(new Event('storage'));
      });
    }
  };

  const handleDeleteSubmission = (subId) => {
    if (window.confirm('Are you sure you want to permanently delete this response?')) {
      deleteResponse(subId).then(() => {
        loadForms();
      });
    }
  };

  const filteredForms = myForms.filter(f => {
    const nameVal = (f.name || f.title || '').toLowerCase();
    const descVal = (f.desc || '').toLowerCase();
    return nameVal.includes(search.toLowerCase()) || descVal.includes(search.toLowerCase());
  });

  const getSubmissionsForForm = (formName) => {
    const currentUserId = localStorage.getItem('userId') || 'guest';
    return allSubmissions.filter(sub =>
      sub.form === formName &&
      (sub.creator_id === currentUserId || sub.creator_id === 'guest' || !sub.creator_id)
    );
  };

  return (
    <>
      <Navbar />
      <div className="templates-page" style={{ paddingTop: '80px' }}>
        <div className="templates-main">

          <div className="templates-sidebar">
            <div className="tmpl-search" style={{ padding: '0 20px 20px' }}>
              <div style={{ position: 'relative' }}>
                <svg className="templates-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Search my forms..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1.5px solid rgba(0, 0, 0, 0.1)', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                />
              </div>
            </div>

            <div>
              <div className="sidebar-section-title">Actions</div>
              <Link to="/templates" className="sidebar-cat active" style={{ textDecoration: 'none' }}>
                <span className="sidebar-cat-icon">➕</span>
                <span>Create Form</span>
              </Link>
            </div>
          </div>

          <div className="templates-content">
            <div className="templates-content-header" style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="templates-content-title" style={{ margin: 0 }}>My Forms / Data Store</h1>
                <div className="templates-content-count">{filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''} found in your workspace</div>
              </div>
            </div>

            {filteredForms.length === 0 ? (
              <div className="tmpl-empty-state" style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                <h3 style={{ marginBottom: '12px', color: '#1e293b' }}>No forms found.</h3>
                <p style={{ color: '#64748b', marginBottom: '24px' }}>You haven't created any forms in your workspace yet.</p>
                <Link to="/templates" className="btn-primary" style={{ display: 'inline-block' }}>Explore Templates</Link>
              </div>
            ) : (
              <div className="templates-grid">
                {filteredForms.map(tmpl => {
                  const colorHex = tmpl.themeColor || tmpl.theme?.accent || (tmpl.bg && tmpl.bg.startsWith('#') ? tmpl.bg : (TEMPLATE_THEMES[tmpl.bg]?.accent || '#7B1C1C'));
                  const theme = { accent: colorHex, label: 'Custom' };
                  const dynamicBannerStyle = { background: `linear-gradient(135deg, ${colorHex} 0%, ${colorHex}dd 100%)` };
                  const isDynamic = true;

                  const formName = stripHtml(tmpl.name || tmpl.title || 'Untitled Form');
                  const formSubs = getSubmissionsForForm(formName);

                  return (
                    <div key={tmpl.id} className="template-card" style={{ height: 'auto', paddingBottom: '16px' }}>
                      <div className={`template-card-preview ${isDynamic ? '' : tmpl.bg}`} style={{ position: 'relative', ...(isDynamic ? dynamicBannerStyle : {}) }}>
                        <div className="template-mini-form">
                          <div className="mini-form-title">{formName}</div>
                          <div className="mini-form-field full" />
                          <div className="mini-form-field short" />
                          <div className="mini-form-btn" style={{ background: theme.accent }} />
                        </div>
                      </div>
                      <div className="template-card-info" style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '18px' }}>{formName}</h3>
                        <p style={{ flexGrow: 1 }}>{tmpl.desc || 'Custom form created by you.'}</p>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => window.open(`/form/${tmpl.id}`, '_blank')}
                            style={{ flex: 1, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(tmpl)}
                            style={{ flex: 1, padding: '8px 12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', color: '#2563eb', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Create
                          </button>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handleClone(tmpl)}
                            style={{ flex: 1, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#16a34a', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Clone
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tmpl.id, formName)}
                            style={{ flex: 1, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Delete
                          </button>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedFormForSubmissions(tmpl)}
                            style={{ width: '100%', padding: '9px 12px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '6px', color: '#7c3aed', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <span>📊</span> View Responses ({formSubs.length})
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Submissions List Modal ── */}
      {selectedFormForSubmissions && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '1400px', height: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#7B1C1C', color: 'white' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Form Responses</h3>
                <span style={{ fontSize: '12px', opacity: 0.85 }}>{selectedFormForSubmissions.name}</span>
              </div>
              <button
                onClick={() => setSelectedFormForSubmissions(null)}
                style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {getSubmissionsForForm(selectedFormForSubmissions.name).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📭</span>
                  <p style={{ fontWeight: '600' }}>No submissions received yet for this form.</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                      <th style={{ padding: '12px 8px' }}>ID</th>
                      <th style={{ padding: '12px 8px' }}>Respondent</th>
                      <th style={{ padding: '12px 8px' }}>Email</th>
                      <th style={{ padding: '12px 8px' }}>Date</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSubmissionsForForm(selectedFormForSubmissions.name).map((sub) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600', color: '#7B1C1C' }}>{sub.id}</td>
                        <td style={{ padding: '12px 8px' }}>{sub.name}</td>
                        <td style={{ padding: '12px 8px', color: '#64748b' }}>{sub.email}</td>
                        <td style={{ padding: '12px 8px', color: '#64748b' }}>{sub.date}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedSubmissionDetails(sub)}
                            style={{ padding: '6px 14px', background: '#f0f4f9', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#1e293b', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDeleteSubmission(sub.id)}
                            style={{ padding: '6px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626', fontWeight: '600', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc' }}>
              <button
                onClick={() => setSelectedFormForSubmissions(null)}
                style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Executive Submission Details Modal ── */}
      {selectedSubmissionDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '92%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: '800', color: '#1e40af', background: '#eff6ff', padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '12.5px' }}>
                  {selectedSubmissionDetails.id}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Response Details</h4>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>Submitted on {selectedSubmissionDetails.date}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', width: '32px', height: '32px', borderRadius: '50%', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '28px', background: '#f8fafc' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #7B1C1C 0%, #a82828 100%)', color: 'white', fontWeight: '800', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {(selectedSubmissionDetails.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{selectedSubmissionDetails.name}</h5>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>✉ {selectedSubmissionDetails.email}</span>
                  </div>
                </div>
                <div>
                  <span className={`status-badge ${selectedSubmissionDetails.status ? selectedSubmissionDetails.status.replace(' ', '-').toLowerCase() : 'pending-review'}`}>
                    {selectedSubmissionDetails.status || 'Pending Review'}
                  </span>
                </div>
              </div>

              <h5 style={{ fontSize: '14px', fontWeight: '800', color: '#334155', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recorded Answers</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {selectedSubmissionDetails.answers && selectedSubmissionDetails.answers.map((ans, idx) => (
                  <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ background: '#7B1C1C', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>Q{idx + 1}</span>
                      <span style={{ fontWeight: '700', color: '#334155', fontSize: '13px', textTransform: 'uppercase' }}>
                        {ans.q && String(ans.q).trim() ? ans.q : `Question ${idx + 1}`}
                      </span>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', color: '#0f172a', fontSize: '14.5px', fontWeight: '600', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {(() => {
                        if (!ans.a) return <em style={{ color: '#94a3b8', fontStyle: 'italic' }}>No answer provided</em>;
                        const valStr = String(ans.a).trim();
                        if (valStr.startsWith('data:image/') || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)/i.test(valStr)) {
                          return (
                            <div style={{ marginTop: '2px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                🖼️ Captured Image / Digital Signature
                              </div>
                              <div style={{ background: '#ffffff', padding: '8px', borderRadius: '10px', border: '1.5px solid #cbd5e1', display: 'inline-block', maxWidth: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                                <img src={valStr} alt="Uploaded file" style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', display: 'block' }} />
                              </div>
                            </div>
                          );
                        }

                        let audioUrl = null;
                        if (valStr.startsWith('data:audio/')) {
                          audioUrl = valStr;
                        } else if (valStr.includes('data:audio/')) {
                          const match = valStr.match(/data:audio\/[^"'\s;]+(?:;base64,[^"'\s]+)?/);
                          if (match) audioUrl = match[0];
                        } else if (valStr.startsWith('{') && valStr.includes('audioUrl')) {
                          try {
                            const parsed = JSON.parse(valStr);
                            if (parsed.audioUrl) audioUrl = parsed.audioUrl;
                          } catch(e){}
                        }

                        if (audioUrl) {
                          return (
                            <div style={{ marginTop: '2px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#047857', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🎙️</span> Audio Voice Recording Captured
                              </div>
                              <div style={{ background: '#ffffff', padding: '12px 16px', borderRadius: '10px', border: '1.5px solid #a7f3d0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'inline-block', width: '100%', maxWidth: '440px' }}>
                                <audio controls src={audioUrl} style={{ width: '100%', outline: 'none' }} />
                              </div>
                            </div>
                          );
                        }

                        if (valStr.includes('Voice_Note') || valStr.toLowerCase().includes('.mp3') || valStr.toLowerCase().includes('.webm') || valStr.toLowerCase().includes('.wav')) {
                          return (
                            <div style={{ marginTop: '2px' }}>
                              <div style={{ fontSize: '11px', fontWeight: '700', color: '#2563eb', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                🎙️ Voice Note / Audio File Attached
                              </div>
                              <div style={{ background: '#f0f9ff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #bae6fd', color: '#0369a1', fontSize: '13.5px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <span>🎵</span> {valStr.replace(/["{}]/g, '')}
                              </div>
                            </div>
                          );
                        }

                        return valStr;
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', background: '#ffffff' }}>
              <button
                onClick={() => setSelectedSubmissionDetails(null)}
                style={{ padding: '8px 20px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#334155', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
