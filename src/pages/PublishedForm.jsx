import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import './PublishedForm.css';

export default function PublishedForm() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  useEffect(() => {

    // 1. Check custom forms across all user workspaces
    let customForms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('customForms_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(parsed)) {
            customForms = [...customForms, ...parsed];
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

    // 3. Fallback for 'innovation-grant' specifically
    if (!config && formId === 'innovation-grant') {
      config = TEMPLATES.find(t => t.name === 'Innovation Grant Application');
    }

    // 4. Default fallback if nothing matches
    if (!config) {
      config = TEMPLATES[0]; // fallback to first template
    }

    setFormConfig(config);

    // Initialize answers state
    const initialAnswers = {};
    config.questions.forEach((q, idx) => {
      initialAnswers[idx] = q.type === 'checkbox' ? [] : '';
    });
    setAnswers(initialAnswers);
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
      const qText = q.question.toLowerCase();
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
          q: q.question,
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
      form: formConfig.name,
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

              <div className="pf-title-row" style={{ borderBottom: `3px solid ${theme.accent}` }}>
                {formConfig.name}
              </div>

              {formConfig.desc && (
                <div style={{ padding: '0 24px', fontSize: '13.5px', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
                  {formConfig.desc}
                </div>
              )}

              <div className="pf-grid">
                {formConfig.questions.map((q, idx) => {
                  const value = answers[idx];

                  if (q.cardType === 'title-desc') {
                    return (
                      <div key={idx} className="pf-field full pf-section-header">
                        <div className="pf-section-title">{q.question}</div>
                        {q.description && <div className="pf-section-desc">{q.description}</div>}
                      </div>
                    );
                  }

                  if (q.cardType === 'image') {
                    return (
                      <div key={idx} className="pf-field full pf-image-block">
                        {q.question && <div className="pf-image-title">{q.question}</div>}
                        {q.mediaUrl && <img src={q.mediaUrl} alt={q.question} className="pf-image-img" />}
                      </div>
                    );
                  }

                  if (q.cardType === 'video') {
                    return (
                      <div key={idx} className="pf-field full pf-video-block">
                        {q.question && <div className="pf-video-title">{q.question}</div>}
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
                      <label className="pf-label" style={{ marginBottom: q.description ? '4px' : '8px' }}>
                        {q.question} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      {q.description && (
                        <div className="pf-question-desc" style={{ fontSize: '12.5px', color: '#000000', marginTop: '-2px', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
                          {q.description}
                        </div>
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
                        <select
                          className="pf-select"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        >
                          <option value="">Select an option</option>
                          {q.options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {q.type === 'dropdown' && (
                        <select
                          className="pf-select"
                          required={q.required}
                          value={value || ''}
                          onChange={e => setAnswers({ ...answers, [idx]: e.target.value })}
                        >
                          <option value="">Select an option</option>
                          {q.options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {q.type === 'checkbox' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                          {q.options.map((opt, oIdx) => {
                            const isChecked = (value || []).includes(opt);
                            return (
                              <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#334155', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const nextVal = isChecked
                                      ? (value || []).filter(v => v !== opt)
                                      : [...(value || []), opt];
                                    setAnswers({ ...answers, [idx]: nextVal });
                                  }}
                                />
                                {opt}
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

                      {!['short', 'paragraph', 'multiple', 'dropdown', 'checkbox', 'date', 'scale', 'number'].includes(q.type) && (
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
