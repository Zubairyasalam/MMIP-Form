import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import './PublishedForm.css';

export default function PublishedForm() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [otherTexts, setOtherTexts] = useState({});
  const [dropdownOtherSelected, setDropdownOtherSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const loadFormConfig = () => {
    // 1. Check custom forms across all user workspaces, prioritizing current user
    const loggedInUserId = localStorage.getItem('userId') || 'guest';
    const primaryKey = `customForms_${loggedInUserId}`;
    let customForms = [];

    // Load from current user first
    try {
      const primarySaved = localStorage.getItem(primaryKey);
      if (primarySaved) {
        const parsed = JSON.parse(primarySaved);
        if (Array.isArray(parsed)) {
          customForms = [...parsed];
        }
      }
    } catch (e) {}

    // Load other workspaces as backup, avoiding duplicate IDs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('customForms_') && key !== primaryKey) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(parsed)) {
            parsed.forEach(p => {
              if (!customForms.some(f => f.id === p.id)) {
                customForms.push(p);
              }
            });
          }
        } catch (e) {}
      }
    }
    let config = customForms.find(f => f.id === formId);
    if (!config) {
      config = TEMPLATES.find(t => {
        const slug = t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug === formId;
      });
    }
    console.log('[DEBUG PublishedForm] formId:', formId);
    console.log('[DEBUG PublishedForm] customForms:', customForms);
    console.log('[DEBUG PublishedForm] Matched config:', config);

    // 3. Fallback for 'innovation-grant' specifically
    if (!config && formId === 'innovation-grant') {
      config = TEMPLATES.find(t => t.name === 'Innovation Grant Application');
    }

    // 4. Default fallback if nothing matches
    if (!config) {
      config = TEMPLATES[0]; // fallback to first template
    }

    const currentUserId = localStorage.getItem('userId') || 'guest';
    const creatorId = config.created_by || config.creator_id || 'System';

    if (config.visibility === 'private' && creatorId !== currentUserId) {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }

    setFormConfig(config);

    // Automatically import/save this custom form to the current user's local workspace key if not already present,
    // so it shows up in their templates and my forms list.
    if (config && config.id && !config.id.startsWith('default-') && !TEMPLATES.some(t => t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === config.id)) {
      try {
        const currentUserKey = `customForms_${currentUserId}`;
        const userSavedForms = JSON.parse(localStorage.getItem(currentUserKey) || '[]');
        if (!userSavedForms.some(f => f.id === config.id)) {
          userSavedForms.unshift(config);
          localStorage.setItem(currentUserKey, JSON.stringify(userSavedForms));
          window.dispatchEvent(new Event('storage'));
        }
      } catch (e) {
        console.error('Error importing custom form to templates:', e);
      }
    }

    // Initialize answers state
    setAnswers(prev => {
      const initialAnswers = { ...prev };
      config.questions.forEach((q, idx) => {
        if (initialAnswers[idx] === undefined) {
          initialAnswers[idx] = q.type === 'checkbox' ? [] : '';
        }
      });
      return initialAnswers;
    });
  };

  useEffect(() => {
    loadFormConfig();

    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('customForms_')) {
        loadFormConfig();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [formId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate required fields
    let valid = true;
    formConfig.questions.forEach((q, idx) => {
      if ((q.cardType === 'question' || !q.cardType) && q.required) {
        const val = answers[idx];
        if (q.type === 'checkbox') {
          if (!val || val.length === 0) valid = false;
        } else {
          if (!val) valid = false;
        }
      }
    });

    if (!valid) {
      alert('Please fill out all required fields.');
      return;
    }

    // Determine submitter name from form answers if possible
    let submitterName = 'Anonymous';
    let submitterEmail = '';

    // Look for name-like or email-like fields
    formConfig.questions.forEach((q, idx) => {
      const qText = stripHtml(q.question).toLowerCase();
      const val = answers[idx];
      if (val) {
        if (qText.includes('name') || qText.includes('investigator') || qText.includes('applicant') || qText.includes('student')) {
          if (submitterName === 'Anonymous') submitterName = String(val);
        }
        if (qText.includes('email')) {
          submitterEmail = String(val);
        }
      }
    });

    if (!submitterEmail) {
      submitterEmail = `${submitterName.toLowerCase().replace(/[^a-z0-9]/g, '')}@mcc.edu.in`;
    }

    // Construct the answers array (excluding non-question items like title-desc headers)
    const mappedAnswers = [];
    formConfig.questions.forEach((q, idx) => {
      if (q.cardType === 'question' || !q.cardType) {
        mappedAnswers.push({
          q: stripHtml(q.question),
          a: Array.isArray(answers[idx]) ? answers[idx].join(', ') : String(answers[idx] || '')
        });
      }
    });

    // Create a unique submission ID
    const existing = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    let maxNum = 5;
    existing.forEach(sub => {
      const idStr = sub.id ? sub.id.toString() : '';
      if (idStr.startsWith('MMIP-')) {
        const numStr = idStr.replace('MMIP-', '');
        const num = parseInt(numStr, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      } else {
        const num = parseInt(idStr.replace(/\D/g, ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    const genId = `MMIP-${nextNum < 10 ? '0' + nextNum : nextNum}`;
    setSubmissionId(genId);

    const newSubmission = {
      id: genId,
      name: submitterName,
      email: submitterEmail,
      form: stripHtml(formConfig.name),
      creator_id: formConfig.creator_id || 'guest',
      date: new Date().toLocaleString(),
      status: 'Pending Review',
      answers: mappedAnswers
    };

    existing.unshift(newSubmission);
    localStorage.setItem('formSubmissions', JSON.stringify(existing));

    setSubmitted(true);
  };

  if (!formConfig) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2>Loading Form...</h2>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2>Access Denied</h2>
        <p style={{ color: '#64748b', marginTop: '12px' }}>This form is private and only accessible by its creator.</p>
        <Link to="/" style={{ display: 'inline-block', marginTop: '20px', padding: '10px 20px', background: '#7B1C1C', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const theme = formConfig.theme || { banner: 'linear-gradient(90deg, #5a1313, #7B1C1C, #a82828)', accent: '#7B1C1C' };
  const headerImage = formConfig.headerImage || '/form-header.png';

  return (
    <div className="pf-page">
      <div className="pf-container">
        {/* Form Body */}
        <div className="pf-body">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
              {/* Header Image */}
              {headerImage ? (
                <img
                  src={headerImage}
                  alt="Form Header"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    borderRadius: '10px 10px 0 0',
                    display: 'block',
                    background: '#fff',
                  }}
                />
              ) : (
                <div style={{
                  height: '10px',
                  background: theme.banner,
                  borderRadius: '10px 10px 0 0',
                }} />
              )}

              <div className="pf-title-row" style={{ borderBottom: `3px solid ${theme.accent}` }} dangerouslySetInnerHTML={{ __html: formConfig.name }} />

              {formConfig.desc && (
                <div style={{ padding: '0 24px', fontSize: '13.5px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: formConfig.desc }} />
              )}

              <div className="pf-grid">
                {formConfig.questions.map((q, idx) => {
                  const value = answers[idx];

                  if (q.cardType === 'title-desc') {
                    return (
                      <div key={idx} className="pf-field full pf-section-header">
                        <div className="pf-section-title" dangerouslySetInnerHTML={{ __html: q.question }} />
                        {q.description && <div className="pf-section-desc" dangerouslySetInnerHTML={{ __html: q.description }} />}
                      </div>
                    );
                  }

                  if (q.cardType === 'image') {
                    return (
                      <div key={idx} className="pf-field full pf-image-block">
                        {q.question && <div className="pf-image-title" dangerouslySetInnerHTML={{ __html: q.question }} />}
                        {q.mediaUrl && <img src={q.mediaUrl} alt={stripHtml(q.question)} className="pf-image-img" />}
                      </div>
                    );
                  }

                  if (q.cardType === 'video') {
                    return (
                      <div key={idx} className="pf-field full pf-video-block">
                        {q.question && <div className="pf-video-title" dangerouslySetInnerHTML={{ __html: q.question }} />}
                        {q.mediaUrl && (
                          <iframe
                            src={q.mediaUrl}
                            title="Form Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="pf-video-iframe"
                          />
                        )}
                      </div>
                    );
                  }

                  const isFullWidth = ['paragraph', 'file', 'signature', 'budget'].includes(q.type);

                  return (
                    <div key={idx} className={`pf-field ${isFullWidth ? 'full' : ''}`}>
                      <label className="pf-label" style={{ marginBottom: q.description ? '4px' : '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span dangerouslySetInnerHTML={{ __html: q.question }} />
                        {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      {q.description && (
                        <div className="pf-question-desc" style={{ fontSize: '12.5px', color: '#000000', marginTop: '-2px', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }} dangerouslySetInnerHTML={{ __html: q.description }} />
                      )}

                      {q.type === 'short' && (
                        <input
                          type="text"
                          className="pf-input"
                          placeholder="Your answer"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        />
                      )}

                      {q.type === 'number' && (
                        <input
                          type="number"
                          className="pf-input"
                          placeholder="Your number answer"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        />
                      )}

                      {q.type === 'paragraph' && (
                        <textarea
                          className="pf-input"
                          style={{ height: '100px', resize: 'vertical', paddingTop: '8px' }}
                          placeholder="Your answer"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        />
                      )}

                      {q.type === 'multiple' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                          {q.options.map((opt, oIdx) => {
                            const isOther = opt.toLowerCase().trim().startsWith('other');
                            const isSelected = isOther
                              ? (value !== undefined && value !== null && value !== '' && !q.options.filter(o => !o.toLowerCase().trim().startsWith('other')).includes(value))
                              : value === opt;

                            return (
                              <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', color: '#334155', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                <input
                                  type="radio"
                                  name={`question-${idx}`}
                                  checked={isSelected}
                                  onChange={() => {
                                    if (isOther) {
                                      const val = otherTexts[idx] || '';
                                      setAnswers({ ...answers, [idx]: val });
                                    } else {
                                      setAnswers({ ...answers, [idx]: opt });
                                    }
                                  }}
                                  style={{ accentColor: theme.accent, width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                {isOther ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                    <span>{opt}</span>
                                    <input
                                      type="text"
                                      placeholder="Your answer"
                                      value={isOther && value && !q.options.filter(o => !o.toLowerCase().trim().startsWith('other')).includes(value) ? value : (otherTexts[idx] || '')}
                                      onChange={(e) => {
                                        const textVal = e.target.value;
                                        setOtherTexts(prev => ({ ...prev, [idx]: textVal }));
                                        setAnswers(prev => ({ ...prev, [idx]: textVal }));
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const textVal = otherTexts[idx] || '';
                                        setAnswers(prev => ({ ...prev, [idx]: textVal }));
                                      }}
                                      style={{
                                        flex: 1,
                                        border: 'none',
                                        borderBottom: '1px solid #cbd5e1',
                                        background: 'transparent',
                                        fontSize: '13.5px',
                                        padding: '2px 4px',
                                        outline: 'none',
                                        color: '#334155'
                                      }}
                                    />
                                  </div>
                                ) : (
                                  opt
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'dropdown' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          {(() => {
                            const otherOpt = q.options.find(o => o.toLowerCase().trim().startsWith('other'));
                            const standardOptions = q.options.filter(o => !o.toLowerCase().trim().startsWith('other'));
                            const isOtherSelected = dropdownOtherSelected[idx] !== undefined
                              ? dropdownOtherSelected[idx]
                              : (value !== undefined && value !== null && value !== '' && !standardOptions.includes(value) && value !== 'Select an option');

                            let dropdownValue = '';
                            if (isOtherSelected) {
                              dropdownValue = otherOpt || '';
                            } else if (value && standardOptions.includes(value)) {
                              dropdownValue = value;
                            }

                            return (
                              <>
                                <select
                                  className="pf-select"
                                  required={q.required}
                                  value={dropdownValue}
                                  onChange={(e) => {
                                    const selected = e.target.value;
                                    if (selected === otherOpt) {
                                      setDropdownOtherSelected(prev => ({ ...prev, [idx]: true }));
                                      const textVal = otherTexts[idx] || '';
                                      setAnswers({ ...answers, [idx]: textVal });
                                    } else {
                                      setDropdownOtherSelected(prev => ({ ...prev, [idx]: false }));
                                      setAnswers({ ...answers, [idx]: selected });
                                    }
                                  }}
                                >
                                  <option value="">Select an option</option>
                                  {q.options.map((opt, oIdx) => (
                                    <option key={oIdx} value={opt}>{opt}</option>
                                  ))}
                                </select>
                                {isOtherSelected && (
                                  <input
                                    type="text"
                                    className="pf-input"
                                    placeholder="Your answer"
                                    value={value || ''}
                                    onChange={(e) => {
                                      const textVal = e.target.value;
                                      setOtherTexts(prev => ({ ...prev, [idx]: textVal }));
                                      setAnswers(prev => ({ ...prev, [idx]: textVal }));
                                    }}
                                    style={{ marginTop: '4px' }}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {q.type === 'checkbox' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          {q.options.map((opt, oIdx) => {
                            const isOther = opt.toLowerCase().trim().startsWith('other');
                            const standardOptions = q.options.filter(o => !o.toLowerCase().trim().startsWith('other'));
                            const otherSelectedValue = (value || []).find(v => !standardOptions.includes(v));

                            const isChecked = isOther
                              ? otherSelectedValue !== undefined
                              : (value || []).includes(opt);

                            return (
                              <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isOther) {
                                      if (isChecked) {
                                        const nextVal = (value || []).filter(v => v !== otherSelectedValue);
                                        setAnswers({ ...answers, [idx]: nextVal });
                                      } else {
                                        const textVal = otherTexts[idx] || '';
                                        const nextVal = [...(value || []), textVal];
                                        setAnswers({ ...answers, [idx]: nextVal });
                                      }
                                    } else {
                                      const nextVal = isChecked
                                        ? (value || []).filter(v => v !== opt)
                                        : [...(value || []), opt];
                                      setAnswers({ ...answers, [idx]: nextVal });
                                    }
                                  }}
                                />
                                {isOther ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                    <span>{opt}</span>
                                    <input
                                      type="text"
                                      placeholder="Your answer"
                                      value={otherSelectedValue !== undefined ? otherSelectedValue : (otherTexts[idx] || '')}
                                      onChange={(e) => {
                                        const textVal = e.target.value;
                                        setOtherTexts(prev => ({ ...prev, [idx]: textVal }));

                                        let nextVal = [...(value || [])];
                                        if (otherSelectedValue !== undefined) {
                                          nextVal = nextVal.map(v => v === otherSelectedValue ? textVal : v);
                                        } else {
                                          nextVal.push(textVal);
                                        }
                                        setAnswers({ ...answers, [idx]: nextVal });
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (otherSelectedValue === undefined) {
                                          const textVal = otherTexts[idx] || '';
                                          setAnswers({ ...answers, [idx]: [...(value || []), textVal] });
                                        }
                                      }}
                                      style={{
                                        flex: 1,
                                        border: 'none',
                                        borderBottom: '1px solid #cbd5e1',
                                        background: 'transparent',
                                        fontSize: '13.5px',
                                        padding: '2px 4px',
                                        outline: 'none',
                                        color: '#334155'
                                      }}
                                    />
                                  </div>
                                ) : (
                                  opt
                                )}
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'date' && (
                        <input
                          type="date"
                          className="pf-input"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        />
                      )}

                      {q.type === 'scale' && (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                          {[1, 2, 3, 4, 5].map(val => (
                            <label key={val} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '13px' }}>
                              <input
                                type="radio"
                                name={`scale-${idx}`}
                                checked={value === String(val)}
                                onChange={() => setAnswers({ ...answers, [idx]: String(val) })}
                              />
                              {val}
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'file' && (
                        <div style={{ width: '100%' }}>
                          <input
                            type="file"
                            id={`file-input-${idx}`}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setAnswers({ ...answers, [idx]: e.target.files[0].name });
                              }
                            }}
                          />
                          {value ? (
                            <div style={{ padding: '12px 14px', border: '1.5px solid #27c93f', borderRadius: '8px', background: '#e8f8ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e7e34', fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>
                                <span>📄</span> {value}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAnswers({ ...answers, [idx]: '' });
                                }}
                                style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => document.getElementById(`file-input-${idx}`).click()}
                              style={{ padding: '18px', border: '1.5px dashed rgba(123, 28, 28, 0.25)', borderRadius: '8px', background: 'rgba(123, 28, 28, 0.01)', textAlign: 'center', color: '#64748b', fontSize: '13px', cursor: 'pointer', marginTop: '6px', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = 'rgba(123, 28, 28, 0.03)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(123, 28, 28, 0.25)'; e.currentTarget.style.background = 'rgba(123, 28, 28, 0.01)'; }}
                            >
                              <span style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }}>📁</span>
                              Drag & drop project proposal documents here or <strong style={{ color: theme.accent }}>browse files</strong> (PDF, DOCX, ZIP up to 10MB)
                            </div>
                          )}
                        </div>
                      )}

                      {q.type === 'roll' && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px', width: '100%' }}>
                          <input
                            type="text"
                            className="pf-input"
                            style={{ flex: 1, margin: 0 }}
                            placeholder="Type ID (e.g. 23-CO-101)"
                            required={q.required}
                            value={value || ''}
                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                          />
                          {value && (
                            <div style={{
                              background: (/^\d{2}-[A-Za-z]{2,3}-\d{3}$/.test(value) || (value.length >= 4 && /^[a-zA-Z0-9]+$/.test(value))) ? '#e8f8ec' : '#ffebeb',
                              color: (/^\d{2}-[A-Za-z]{2,3}-\d{3}$/.test(value) || (value.length >= 4 && /^[a-zA-Z0-9]+$/.test(value))) ? '#27c93f' : '#ff3b30',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap',
                              fontFamily: 'Inter, sans-serif'
                            }}>
                              {(/^\d{2}-[A-Za-z]{2,3}-\d{3}$/.test(value) || (value.length >= 4 && /^[a-zA-Z0-9]+$/.test(value))) ? '✓ Verified ID' : '✗ Invalid Format'}
                            </div>
                          )}
                        </div>
                      )}

                      {q.type === 'signature' && (
                        <SignaturePad
                          accent={theme.accent}
                          onChange={(dataUrl) => setAnswers({ ...answers, [idx]: dataUrl })}
                        />
                      )}

                      {q.type === 'budget' && (
                        <div style={{ width: '100%', marginTop: '6px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Expense Item</th>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', width: '120px', fontFamily: 'Inter, sans-serif' }}>Cost (₹)</th>
                                <th style={{ width: '36px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(value || [{ item: '', cost: '' }]).map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="text"
                                      value={row.item}
                                      onChange={(e) => {
                                        const current = value || [{ item: '', cost: '' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], item: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      placeholder="e.g. Hosting, Hardware components"
                                      style={{ width: '90%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="number"
                                      value={row.cost}
                                      onChange={(e) => {
                                        const current = value || [{ item: '', cost: '' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], cost: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      placeholder="0"
                                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = value || [{ item: '', cost: '' }];
                                        if (current.length === 1) return;
                                        const next = current.filter((_, i) => i !== rIdx);
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '14px', cursor: 'pointer' }}
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const current = value || [{ item: '', cost: '' }];
                                setAnswers({ ...answers, [idx]: [...current, { item: '', cost: '' }] });
                              }}
                              style={{ padding: '6px 12px', background: 'white', border: `1.5px solid ${theme.accent}`, color: theme.accent, borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                            >
                              + Add Row
                            </button>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: theme.accent, fontFamily: 'Inter, sans-serif' }}>
                              Total: ₹{((value || [{ item: '', cost: '' }]).reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0)).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>
                      )}

                      {q.type === 'team' && (
                        <div style={{ width: '100%', marginTop: '6px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Name</th>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', width: '150px', fontFamily: 'Inter, sans-serif' }}>Roll No</th>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', width: '120px', fontFamily: 'Inter, sans-serif' }}>Role</th>
                                <th style={{ width: '36px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(value || [{ name: '', roll: '', role: 'Developer' }]).map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="text"
                                      value={row.name}
                                      onChange={(e) => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], name: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      placeholder="Member name"
                                      style={{ width: '90%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="text"
                                      value={row.roll}
                                      onChange={(e) => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], roll: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      placeholder="ID No"
                                      style={{ width: '90%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px 0' }}>
                                    <select
                                      value={row.role}
                                      onChange={(e) => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], role: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', background: 'white' }}
                                    >
                                      <option value="Lead">Lead</option>
                                      <option value="Developer">Developer</option>
                                      <option value="Designer">Designer</option>
                                      <option value="Researcher">Researcher</option>
                                    </select>
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer' }];
                                        if (current.length === 1) return;
                                        const next = current.filter((_, i) => i !== rIdx);
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '14px', cursor: 'pointer' }}
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button
                            type="button"
                            onClick={() => {
                              const current = value || [{ name: '', roll: '', role: 'Developer' }];
                              setAnswers({ ...answers, [idx]: [...current, { name: '', roll: '', role: 'Developer' }] });
                            }}
                            style={{ padding: '6px 12px', background: 'white', border: `1.5px solid ${theme.accent}`, color: theme.accent, borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                          >
                            + Add Member
                          </button>
                        </div>
                      )}

                      {q.type === 'color' && (
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                          <input
                            type="color"
                            value={value || '#7B1C1C'}
                            onChange={(e) => setAnswers({ ...answers, [idx]: e.target.value })}
                            style={{ width: '48px', height: '36px', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '2px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13.5px', color: '#334155', fontFamily: 'Inter, sans-serif' }}>
                            Choose Scheme color (Hex: <strong style={{ color: theme.accent }}>{value || '#7B1C1C'}</strong>)
                          </span>
                        </div>
                      )}

                      {q.type === 'deadline' && (
                        <div style={{ width: '100%', marginTop: '6px' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '12px' }}>
                            <thead>
                              <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Milestone / Phase</th>
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', width: '180px', fontFamily: 'Inter, sans-serif' }}>Date</th>
                                <th style={{ width: '36px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(value || [{ phase: '', date: '' }]).map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="text"
                                      value={row.phase}
                                      onChange={(e) => {
                                        const current = value || [{ phase: '', date: '' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], phase: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      placeholder="e.g. Prototype delivery, Testing phase"
                                      style={{ width: '90%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="date"
                                      value={row.date}
                                      onChange={(e) => {
                                        const current = value || [{ phase: '', date: '' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], date: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = value || [{ phase: '', date: '' }];
                                        if (current.length === 1) return;
                                        const next = current.filter((_, i) => i !== rIdx);
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '14px', cursor: 'pointer' }}
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <button
                            type="button"
                            onClick={() => {
                              const current = value || [{ phase: '', date: '' }];
                              setAnswers({ ...answers, [idx]: [...current, { phase: '', date: '' }] });
                            }}
                            style={{ padding: '6px 12px', background: 'white', border: `1.5px solid ${theme.accent}`, color: theme.accent, borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                          >
                            + Add Phase
                          </button>
                        </div>
                      )}

                      {q.type === 'time' && (
                        <input
                          type="time"
                          className="pf-input"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        />
                      )}

                      {q.type === 'ai_assist' && (
                        <AiAssistantInput
                          q={q}
                          accent={theme.accent}
                          value={value}
                          onChange={(val) => setAnswers({ ...answers, [idx]: val })}
                        />
                      )}

                      {q.type === 'voice' && (
                        <VoiceInputComponent
                          q={q}
                          accent={theme.accent}
                          value={value}
                          onChange={(val) => setAnswers({ ...answers, [idx]: val })}
                        />
                      )}

                      {q.type === 'video' && (
                        <VideoUploadComponent
                          q={q}
                          accent={theme.accent}
                          value={value}
                          onChange={(val) => setAnswers({ ...answers, [idx]: val })}
                        />
                      )}

                      {q.type === 'location' && (
                        <LocationPickerComponent
                          q={q}
                          accent={theme.accent}
                          value={value}
                          onChange={(val) => setAnswers({ ...answers, [idx]: val })}
                        />
                      )}

                      {!['short', 'paragraph', 'multiple', 'dropdown', 'checkbox', 'date', 'scale', 'number', 'file', 'roll', 'signature', 'budget', 'team', 'color', 'deadline', 'time', 'ai_assist', 'voice', 'video', 'location'].includes(q.type) && (
                        <input
                          type="text"
                          className="pf-input"
                          placeholder="Your answer"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <button type="submit" className="pf-submit-btn" style={{ background: theme.accent }}>
                Submit Responses
              </button>
            </form>
          ) : (
            <div className="pf-success-card">
              <div className="pf-success-icon" style={{ background: theme.accent }}>✓</div>
              <h2>Submission Recorded!</h2>
              <p>Thank you for submitting your response. Your submission has been saved successfully.</p>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
                Submission ID: <strong>{submissionId}</strong>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="pf-btn-link" onClick={() => { setSubmitted(false); setAnswers({}); }}>
                  Submit Another Response
                </button>
                <Link to="/" className="pf-btn-link" style={{ background: theme.accent, color: 'white' }}>
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Close Button */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
            navigate(loggedIn ? '/my-forms' : '/');
          }
        }}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: 'white',
          border: '1px solid #e2e8f0',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#64748b',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s',
          zIndex: 1000
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = '#f8fafc';
          e.currentTarget.style.color = '#0f172a';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.12)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'white';
          e.currentTarget.style.color = '#64748b';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
        }}
        title="Go Back"
        aria-label="Go Back"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

function SignaturePad({ accent, onChange }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = accent || '#7B1C1C';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientX || !clientY) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (canvasRef.current && onChange) {
        onChange(canvasRef.current.toDataURL());
      }
    }
  };

  const clearCanvas = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (onChange) {
      onChange('');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: '6px' }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={100}
        style={{ border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fafafa', display: 'block', width: '100%', height: '100px', cursor: 'crosshair' }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <button
        type="button"
        onClick={clearCanvas}
        style={{ position: 'absolute', right: '12px', top: '10px', background: 'rgba(0,0,0,0.06)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: '#555', fontFamily: 'Inter, sans-serif' }}
      >
        Clear
      </button>
    </div>
  );
}

function AiAssistantInput({ q, accent, value, onChange }) {
  const [generating, setGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const getTypos = () => {
    if (!value) return [];
    const words = value.split(/\s+/);
    const found = [];
    const TYPOS = {
      'heo': 'hello', 'teh': 'the', 'worng': 'wrong', 'reaserch': 'research',
      'colg': 'college', 'univ': 'university', 'recived': 'received',
      'studen': 'student', 'proposel': 'proposal', 'devlop': 'develop',
      'sofware': 'software', 'fild': 'field', 'abt': 'about', 'plz': 'please',
      'thks': 'thanks', 'u': 'you', 'r': 'are'
    };
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "");
      if (TYPOS[clean]) {
        found.push({ original: clean, correction: TYPOS[clean] });
      }
    });
    return found.filter((v, i, a) => a.findIndex(t => t.original === v.original) === i);
  };

  const detectedTypos = getTypos();

  const fixTypos = () => {
    let fixedText = value;
    detectedTypos.forEach(item => {
      const regex = new RegExp(`\\b${item.original}\\b`, 'gi');
      fixedText = fixedText.replace(regex, item.correction);
    });
    onChange(fixedText);
  };

  const triggerAi = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const lower = (value || '').toLowerCase();
      let response = "MCC Student Research Portal: A unified, secure digital platform designed to automate student project submissions, department reviews, and visual presentation approvals.";
      if (lower.includes('attendance') || lower.includes('fingerprint') || lower.includes('facial')) {
        response = "IoT-Based Student Attendance Guard: A hardware-software solution incorporating low-power biometric fingerprint sensors and high-accuracy facial recognition pipelines.";
      } else if (lower.includes('water') || lower.includes('recycling') || lower.includes('hostel')) {
        response = "IoT Hostel Water Recycling Grid: An environmental engineering initiative that recycles greywater from student hostel blocks.";
      } else if (lower.includes('solar') || lower.includes('energy') || lower.includes('battery')) {
        response = "Smart Lab Microgrid & Solar Ledger: An automated energy distribution and tracking framework designed for campus lab facilities.";
      }
      onChange(response);
    }, 800);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          onChange(value ? value + " " + transcript : transcript);
        };
        recognition.onerror = () => {
          onChange(value ? value + " [Simulated Voice: IoT project proposal]" : "Simulated Voice: IoT project proposal");
        };
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        onChange(value ? value + " [Simulated Voice: IoT project proposal]" : "Simulated Voice: IoT project proposal");
        setTimeout(() => setIsRecording(false), 1000);
      }
    }
  };

  return (
    <div style={{ width: '100%', marginTop: '6px' }}>
      <textarea
        className="pf-input"
        style={{ height: '100px', resize: 'vertical', paddingTop: '8px' }}
        placeholder="Type or use AI suggestion below..."
        required={q.required}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={triggerAi}
          disabled={generating}
          style={{ padding: '6px 12px', background: accent, color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
        >
          {generating ? '✨ Generating...' : '✨ Improve with AI'}
        </button>
        <button
          type="button"
          onClick={toggleRecording}
          style={{ padding: '6px 12px', background: isRecording ? '#ffebeb' : '#f1f5f9', color: isRecording ? '#ff3b30' : '#475569', border: isRecording ? '1px solid #ff3b30' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
        >
          {isRecording ? '🎙 Listening...' : '🎙 Dictate (Voice)'}
        </button>
        {detectedTypos.length > 0 && (
          <button
            type="button"
            onClick={fixTypos}
            style={{ padding: '6px 12px', background: '#e8f8ec', color: '#1e7e34', border: '1px solid #27c93f', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            🔧 Fix {detectedTypos.length} Typos
          </button>
        )}
      </div>
    </div>
  );
}

function VoiceInputComponent({ q, accent, value, onChange }) {
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          onChange(value ? value + " " + transcript : transcript);
        };
        recognition.onerror = () => {
          onChange(value ? value + " [Voice input transcription]" : "Voice input transcription");
        };
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        onChange(value ? value + " [Voice input transcription]" : "Voice input transcription");
        setTimeout(() => setIsRecording(false), 1000);
      }
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', width: '100%' }}>
      <input
        type="text"
        className="pf-input"
        style={{ flex: 1, margin: 0 }}
        placeholder="Type or click microphone to speak..."
        required={q.required}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={toggleRecording}
        style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: isRecording ? '#ffebeb' : '#f1f5f9',
          color: isRecording ? '#ff3b30' : '#475569',
          border: isRecording ? '1px solid #ff3b30' : '1px solid #cbd5e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', cursor: 'pointer', flexShrink: 0
        }}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        🎙
      </button>
    </div>
  );
}

function VideoUploadComponent({ q, accent, value, onChange }) {
  const [url, setUrl] = useState(value || '');

  const applyVideo = () => {
    onChange(url);
  };

  const getEmbedUrl = (val) => {
    if (!val) return null;
    let videoId = null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = val.match(regExp);
    if (match && match[2].length === 11) {
      videoId = match[2];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const embedUrl = getEmbedUrl(value);

  return (
    <div style={{ width: '100%', marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        <input
          type="text"
          className="pf-input"
          style={{ flex: 1, margin: 0 }}
          placeholder="Paste YouTube Video URL (e.g., https://youtu.be/...)"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          type="button"
          onClick={applyVideo}
          style={{ padding: '8px 14px', background: accent, color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
        >
          Add
        </button>
      </div>
      {value && (
        <div style={{ marginTop: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
          {embedUrl ? (
            <iframe
              width="100%"
              height="200"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: '6px' }}
            />
          ) : (
            <div style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎥</span> {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LocationPickerComponent({ q, accent, value, onChange }) {
  const [loading, setLoading] = useState(false);

  const getLoc = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false);
          onChange(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
        },
        () => {
          setLoading(false);
          onChange("12.919799, 80.122858 (Madras Christian College)");
        }
      );
    } else {
      setLoading(false);
      onChange("12.919799, 80.122858 (Madras Christian College)");
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center', width: '100%' }}>
      <input
        type="text"
        className="pf-input"
        style={{ flex: 1, margin: 0 }}
        placeholder="Latitude, Longitude or Address"
        required={q.required}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={getLoc}
        disabled={loading}
        style={{
          padding: '8px 14px', background: '#f1f5f9', color: '#475569',
          border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px',
          fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
        }}
      >
        📍 {loading ? 'Locating...' : 'Get Location'}
      </button>
    </div>
  );
}
