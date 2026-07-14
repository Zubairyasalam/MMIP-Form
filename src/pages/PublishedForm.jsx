import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import './PublishedForm.css';

export default function PublishedForm() {
  const { formId } = useParams();
  
  const [formConfig, setFormConfig] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');

  useEffect(() => {

    // 1. Check custom forms in localStorage
    const customForms = JSON.parse(localStorage.getItem('customForms') || '[]');
    let config = customForms.find(f => f.id === formId);
    
    // 2. If not found, check in prebuilt TEMPLATES
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
      if (q.required) {
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

    // Construct the answers array
    const mappedAnswers = formConfig.questions.map((q, idx) => ({
      q: q.question,
      a: Array.isArray(answers[idx]) ? answers[idx].join(', ') : String(answers[idx] || '')
    }));

    // Create a unique submission ID
    const genId = `MMIP-${String(Date.now()).slice(-4)}`;
    setSubmissionId(genId);

    const newSubmission = {
      id: genId,
      name: submitterName,
      email: submitterEmail,
      form: formConfig.name,
      date: new Date().toLocaleString(),
      status: 'Pending Review',
      answers: mappedAnswers
    };

    const existing = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
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

  return (
    <div className="pf-page">
      <div className="pf-container">
        {/* Form Body */}
        <div className="pf-body">
          {!submitted ? (
            <form onSubmit={handleSubmit}>
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
                  const isFullWidth = ['paragraph', 'file', 'signature', 'budget'].includes(q.type);
                  
                  return (
                    <div key={idx} className={`pf-field ${isFullWidth ? 'full' : ''}`}>
                      <label className="pf-label">
                        {q.question} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      
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

                      {!['short', 'paragraph', 'multiple', 'dropdown', 'checkbox', 'date', 'scale'].includes(q.type) && (
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
                Submit Response →
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
    </div>
  );
}
