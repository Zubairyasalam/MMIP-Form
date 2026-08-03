import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import { getForms, saveResponse, getResponses } from '../utils/db';
import './PublishedForm.css';

export default function PublishedForm() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const formTopRef = useRef(null);

  const [formConfig, setFormConfig] = useState(undefined);
  const [answers, setAnswers] = useState({});
  const [otherTexts, setOtherTexts] = useState({});
  const [dropdownOtherSelected, setDropdownOtherSelected] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);
  const [toast, setToast] = useState(null); // { message, type }
  const [missingFields, setMissingFields] = useState([]);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ').trim();
  };

  // Same slug function as FormBuilder to ensure consistent URL matching
  const toSlug = (text) => {
    return (text || '')
      .toLowerCase()
      .replace(/[\u00A0\u200B\u200C\u200D\uFEFF\xa0]/g, ' ')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const loadFormConfig = async () => {
    // 1. Load all forms from the unified database
    const allForms = await getForms();
    const currentUserId = localStorage.getItem('userId') || 'guest';

    // 2. Try to find the form by direct ID match
    let config = allForms.find(f => f.id === formId);

    // 3. If not found by ID, try slug match against saved form names
    if (!config) {
      config = allForms.find(f => toSlug(stripHtml(f.name || f.richName || '')) === formId);
    }

    // 4. Try matching against built-in TEMPLATES by slug
    if (!config) {
      const tmpl = TEMPLATES.find(t => toSlug(t.name) === formId);
      if (tmpl) config = tmpl;
    }

    // 5. Fallback for 'innovation-grant' specifically
    if (!config && formId === 'innovation-grant') {
      config = TEMPLATES.find(t => t.name === 'Innovation Grant Application');
    }

    // 6. If still not found, show a not found message (don't silently load a wrong form)
    if (!config) {
      setFormConfig(null);
      setAccessDenied(false);
      return;
    }

    const creatorId = config.created_by || config.creator_id || 'System';
    if (config.visibility === 'private' && creatorId !== currentUserId) {
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }

    setFormConfig(config);

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

    const handleStorageChange = () => {
      loadFormConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [formId]);

  const handleDeleteField = (idxToDelete) => {
    if (!formConfig || !formConfig.questions) return;
    const newQuestions = formConfig.questions.filter((_, i) => i !== idxToDelete);
    const updatedForm = {
      ...formConfig,
      questions: newQuestions,
      updatedAt: Date.now()
    };
    setFormConfig(updatedForm);
    saveForm(updatedForm);
    window.dispatchEvent(new Event('storage'));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    let valid = true;
    const missing = [];
    formConfig.questions.forEach((q, idx) => {
      if ((q.cardType === 'question' || !q.cardType) && q.required) {
        const val = answers[idx];
        if (q.type === 'checkbox') {
          if (!val || val.length === 0) { valid = false; missing.push(idx); }
        } else {
          if (!val) { valid = false; missing.push(idx); }
        }
      }
    });

    if (!valid) {
      setMissingFields(missing);
      showToast(`⚠️ Please fill out all required fields. (${missing.length} field${missing.length > 1 ? 's' : ''} missing)`, 'error');
      // Scroll to the validation banner at the top of the form
      if (formTopRef.current) formTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setMissingFields([]);

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
        const rawQ = q.question || '';
        const cleanQ = stripHtml(rawQ).trim() 
          || (q.type === 'voice' ? 'Voice Dictation' :
              q.type === 'audio_record' ? 'Audio Voice Recording' :
              q.type === 'image_upload' ? 'Image Upload Field' :
              q.type === 'signature' ? 'Digital Signature Pad' :
              q.type === 'file' ? 'Uploaded File' :
              `Question ${idx + 1}`);

        const rawAns = answers[idx];
        let finalAns = '';
        if (Array.isArray(rawAns)) {
          // Arrays of objects (team members, budget rows) → JSON string so viewer can render them
          if (rawAns.length > 0 && typeof rawAns[0] === 'object') {
            finalAns = JSON.stringify(rawAns);
          } else {
            finalAns = rawAns.join(', ');
          }
        } else if (rawAns && typeof rawAns === 'object') {
          finalAns = rawAns.audioUrl ? JSON.stringify(rawAns) : (rawAns.dataUrl ? JSON.stringify(rawAns) : (rawAns.name || JSON.stringify(rawAns)));
        } else {
          finalAns = String(rawAns || '');
        }

        mappedAnswers.push({
          q: cleanQ,
          a: finalAns
        });
      }
    });

    // Save the submission via unified db — use sequential ID
    const allResponses = await getResponses();
    let maxNum = 12; // default responses are MMIP-01 to MMIP-12
    allResponses.forEach(r => {
      const match = r.id && r.id.match(/^MMIP-0*(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextNum = maxNum + 1;
    const genId = `MMIP-${String(nextNum).padStart(2, '0')}`;
    setSubmissionId(genId);

    const newSubmission = {
      id: genId,
      name: submitterName,
      email: submitterEmail,
      form: stripHtml(formConfig.name),
      formId: formConfig.id,
      creator_id: formConfig.creator_id || 'guest',
      date: new Date().toLocaleString(),
      status: 'Pending Review',
      answers: mappedAnswers
    };

    saveResponse(newSubmission);
    setSubmitted(true);
  };

  if (formConfig === undefined) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <h2>Loading Form...</h2>
      </div>
    );
  }

  if (formConfig === null) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>😕</div>
        <h2 style={{ color: '#7B1C1C', marginBottom: '12px' }}>Form Not Found</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          The form you are looking for does not exist or the link may be incorrect.
        </p>
        <Link to="/templates" style={{ display: 'inline-block', padding: '10px 24px', background: '#7B1C1C', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
          Browse Templates
        </Link>
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

  const accent = formConfig.themeColor 
    || (formConfig.theme?.accent && formConfig.theme.accent.startsWith('#') ? formConfig.theme.accent : null)
    || (formConfig.bg && formConfig.bg.startsWith('#') ? formConfig.bg : null)
    || (TEMPLATE_THEMES[formConfig.bg]?.accent)
    || '#7B1C1C';
  const theme = {
    banner: formConfig.theme?.banner || `linear-gradient(90deg, ${accent}, ${accent}dd)`,
    accent: accent
  };
  const headerImage = formConfig.headerImage || '/form-header.png';

  return (
    <div className="pf-page">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: '#fff',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
          fontSize: '14.5px',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          maxWidth: '380px',
          animation: 'slideInToast 0.35s cubic-bezier(.21,1.02,.73,1) forwards'
        }}>
          <span style={{ fontSize: '18px' }}>{toast.type === 'error' ? '⚠️' : '✅'}</span>
          <span>{toast.message.replace(/^⚠️ /, '')}</span>
        </div>
      )}
      <div className="pf-container">
        {/* Form Body */}
        <div className="pf-body">
          {!submitted ? (
            <form onSubmit={handleSubmit} noValidate>
              {/* Validation Banner - shown at top when submit fails */}
              <div ref={formTopRef} />
              {missingFields.length > 0 && (
                <div style={{
                  margin: '0 0 16px 0',
                  background: '#fff1f2',
                  border: '1.5px solid #fca5a5',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>⚠️</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#b91c1c' }}>
                      Please fill in the following required fields before submitting:
                    </span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {missingFields.map(idx => {
                      const q = formConfig.questions[idx];
                      const label = stripHtml(q?.question || '').trim() || `Field ${idx + 1}`;
                      return (
                        <li key={idx} style={{ fontSize: '13px', color: '#991b1b', fontWeight: '500' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`field-${idx}`);
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            style={{
                              background: 'none', border: 'none', padding: 0,
                              color: '#dc2626', fontWeight: '600', fontSize: '13px',
                              cursor: 'pointer', textDecoration: 'underline',
                              fontFamily: 'Inter, sans-serif', textAlign: 'left'
                            }}
                          >
                            {label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
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
                {(() => {
                  const nonTextFieldTypes = ['voice', 'audio_record', 'image_upload', 'file', 'signature', 'budget', 'team', 'location', 'deadline', 'color', 'ai_assist'];


                  // Build array of {q, originalIdx} so answers always keyed by ORIGINAL index
                  const allQs = formConfig.questions;
                  const filteredQsWithIdx = allQs
                    .map((q, origIdx) => ({ q, origIdx }))
                    .filter(({ q, origIdx }) => {
                      if (q.type === 'short') {
                        const cleanText = stripHtml(q.question || '').trim().toLowerCase();
                        const prevQ = allQs[origIdx - 1];
                        const nextQ = allQs[origIdx + 1];
                        const isAdjacentToNonText =
                          (prevQ && (nonTextFieldTypes.includes(prevQ.type) || prevQ.cardType === 'image')) ||
                          (nextQ && (nonTextFieldTypes.includes(nextQ.type) || nextQ.cardType === 'image'));
                        const isMediaLabelMatch = cleanText.includes('voice') || cleanText.includes('audio') || cleanText.includes('image upload') || cleanText.includes('picture');
                        if ((!cleanText && isAdjacentToNonText) || (isMediaLabelMatch && isAdjacentToNonText)) {
                          return false;
                        }
                      }
                      return true;
                    });

                  return filteredQsWithIdx.map(({ q, origIdx: idx }) => {
                    const value = answers[idx];

                  if (q.cardType === 'title-desc') {
                    return (
                      <div key={idx} className="pf-field full pf-section-header" style={{ position: 'relative' }}>
                        <div style={{ marginBottom: '8px' }}>
                          <div className="pf-section-title" style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: q.question || 'Section Header' }} />
                        </div>
                        {q.description && <div className="pf-section-desc" dangerouslySetInnerHTML={{ __html: q.description }} />}
                      </div>
                    );
                  }

                  if (q.cardType === 'image') {
                    const currentImg = value || q.mediaUrl;
                    return (
                      <div key={idx} className="pf-field full pf-image-block" style={{ position: 'relative' }}>
                        <div style={{ marginBottom: '10px' }}>
                          <div className="pf-image-title" style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: q.question || 'Image Title' }} />
                        </div>
                        {q.description && <div className="pf-image-desc" style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }} dangerouslySetInnerHTML={{ __html: q.description }} />}
                        {currentImg ? (
                          <div style={{ position: 'relative', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #cbd5e1' }}>
                            <img src={currentImg} alt={stripHtml(q.question)} style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', display: 'block', background: '#fafafa' }} />
                            <button
                              type="button"
                              onClick={() => setAnswers({ ...answers, [idx]: '' })}
                              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(15,23,42,0.85)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                              title="Remove / Upload New Image"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ width: '100%' }}>
                            <input
                              type="file"
                              accept="image/*"
                              id={`pf-image-upload-${idx}`}
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setAnswers({ ...answers, [idx]: ev.target.result });
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            <div
                              onClick={() => document.getElementById(`pf-image-upload-${idx}`).click()}
                              style={{
                                padding: '28px 20px',
                                border: '2px dashed #cbd5e1',
                                borderRadius: '12px',
                                background: '#f8fafc',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = '#f1f5f9'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                            >
                              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🖼️</span>
                              <div style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b' }}>Click to Upload Image</div>
                              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Supports JPEG, PNG, WEBP, GIF (up to 10MB)</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (q.cardType === 'video') {
                    const isEmbed = q.mediaUrl && q.mediaUrl.startsWith('https://www.youtube.com');
                    return (
                      <div key={idx} className="pf-field full pf-video-block">
                        {q.question && <div className="pf-video-title" dangerouslySetInnerHTML={{ __html: q.question }} />}
                        {q.description && <div className="pf-video-desc" style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }} dangerouslySetInnerHTML={{ __html: q.description }} />}
                        {q.mediaUrl && (
                          isEmbed ? (
                            <iframe
                              src={q.mediaUrl}
                              title="Form Video"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="pf-video-iframe"
                            />
                          ) : (
                            <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '13.5px', fontWeight: '700' }}>
                                <span>🎥</span> {q.mediaUrl}
                              </div>
                              <div style={{ width: '100%', height: '180px', borderRadius: '6px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                                  Video Loaded
                                </div>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1.5px solid white' }}>
                                  <span style={{ color: 'white', fontSize: '16px', marginLeft: '3px' }}>▶</span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    );
                  }

                  const isFullWidth = ['paragraph', 'file', 'image_upload', 'voice', 'audio_record', 'signature', 'budget', 'team', 'location', 'deadline', 'color', 'ai_assist'].includes(q.type);
                  const rawQuestion = q.question || '';
                  const cleanQuestionText = stripHtml(rawQuestion).trim();
                  const questionTitle = cleanQuestionText
                    ? rawQuestion
                    : (
                        q.type === 'voice' ? '🗣️ Voice Dictation (Speech-to-Text)' :
                        q.type === 'audio_record' ? '🎙️ Audio Voice Recording (Voice Note)' :
                        q.type === 'image_upload' ? '🖼️ Image Upload (JPEG/PNG)' :
                        q.type === 'short' ? 'Short Answer Field' :
                        q.type === 'paragraph' ? 'Paragraph Field' :
                        'Question Field'
                      );

                  return (
                    <div
                      key={idx}
                      id={`field-${idx}`}
                      className={`pf-field ${isFullWidth ? 'full' : ''}`}
                      style={{
                        position: 'relative',
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '16px',
                        border: missingFields.includes(idx) ? '2px solid #ef4444' : '1.5px solid #e2e8f0',
                        boxShadow: missingFields.includes(idx) ? '0 0 0 3px rgba(239,68,68,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                        marginBottom: '16px',
                        transition: 'border 0.2s, box-shadow 0.2s'
                      }}
                    >
                      <div style={{ marginBottom: q.description ? '6px' : '10px' }}>
                        <label className="pf-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                          <span dangerouslySetInnerHTML={{ __html: questionTitle }} />
                          {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                      </div>
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
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setAnswers({ ...answers, [idx]: { name: file.name, dataUrl: ev.target.result, type: file.type, size: file.size } });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {value ? (
                            <div style={{ border: '1.5px solid #27c93f', borderRadius: '8px', background: '#e8f8ec', marginTop: '6px', overflow: 'hidden' }}>
                              {value.type && value.type.startsWith('image/') && value.dataUrl ? (
                                <img src={value.dataUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block', margin: '0 auto', padding: '8px' }} />
                              ) : null}
                              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e7e34', fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>
                                  <span>{value.type && value.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                                  {value.name || value}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setAnswers({ ...answers, [idx]: '' }); }}
                                  style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                                >✕</button>
                              </div>
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

                      {q.type === 'image_upload' && (
                        <div style={{ width: '100%', marginTop: '6px' }}>
                          <input
                            type="file"
                            accept="image/*"
                            id={`image-upload-input-${idx}`}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  setAnswers({ ...answers, [idx]: ev.target.result });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          {value ? (
                            <div style={{ position: 'relative', border: '1.5px solid #27c93f', borderRadius: '10px', overflow: 'hidden', background: '#e8f8ec', padding: '10px' }}>
                              <img src={value} alt="Uploaded" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                              <button
                                type="button"
                                onClick={() => setAnswers({ ...answers, [idx]: '' })}
                                style={{ position: 'absolute', top: '10px', right: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '50%', width: '28px', height: '28px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
                                title="Remove image"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => document.getElementById(`image-upload-input-${idx}`).click()}
                              style={{ padding: '24px', border: '2px dashed #cbd5e1', borderRadius: '10px', background: '#f8fafc', textAlign: 'center', color: '#64748b', fontSize: '13.5px', cursor: 'pointer' }}
                              onMouseOver={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.background = '#f1f5f9'; }}
                              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
                            >
                              <span style={{ fontSize: '28px', display: 'block', marginBottom: '6px' }}>🖼️</span>
                              Click to upload image or <strong style={{ color: theme.accent }}>browse files</strong> (JPEG, PNG, WEBP)
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
                                <th style={{ padding: '6px 0', fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Link</th>
                                <th style={{ width: '36px' }}></th>
                              </tr>
                            </thead>
                            <tbody>
                              {(value || [{ name: '', roll: '', role: 'Developer', link: '' }]).map((row, rIdx) => (
                                <tr key={rIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="text"
                                      value={row.name}
                                      onChange={(e) => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer', link: '' }];
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
                                        const current = value || [{ name: '', roll: '', role: 'Developer', link: '' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], role: e.target.value, roleOther: '' };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', background: 'white' }}
                                    >
                                      <option value="Lead">Lead</option>
                                      <option value="Developer">Developer</option>
                                      <option value="Designer">Designer</option>
                                      <option value="Researcher">Researcher</option>
                                      <option value="Presenter">Presenter</option>
                                      <option value="Tester">Tester</option>
                                      <option value="Analyst">Analyst</option>
                                      <option value="Manager">Manager</option>
                                      <option value="Mentor">Mentor</option>
                                      <option value="Writer">Writer</option>
                                      <option value="Other">Other</option>
                                    </select>
                                    {row.role === 'Other' && (
                                      <input
                                        type="text"
                                        value={row.roleOther || ''}
                                        onChange={(e) => {
                                          const current = value || [{ name: '', roll: '', role: 'Other', link: '' }];
                                          const next = [...current];
                                          next[rIdx] = { ...next[rIdx], roleOther: e.target.value };
                                          setAnswers({ ...answers, [idx]: next });
                                        }}
                                        placeholder="Specify role..."
                                        autoFocus
                                        style={{ width: '100%', marginTop: '5px', padding: '5px 10px', border: '1.5px solid #7B1C1C', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif', background: '#fff8f8' }}
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '6px 0' }}>
                                    <input
                                      type="url"
                                      value={row.link || ''}
                                      onChange={(e) => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer', link: '' }];
                                        const next = [...current];
                                        next[rIdx] = { ...next[rIdx], link: e.target.value };
                                        setAnswers({ ...answers, [idx]: next });
                                      }}
                                      placeholder="Profile / LinkedIn link"
                                      style={{ width: '90%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                                    />
                                  </td>
                                  <td style={{ textAlign: 'right', padding: '6px 0' }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const current = value || [{ name: '', roll: '', role: 'Developer', link: '' }];
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
                              const current = value || [{ name: '', roll: '', role: 'Developer', link: '' }];
                              setAnswers({ ...answers, [idx]: [...current, { name: '', roll: '', role: 'Developer', link: '' }] });
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
                        <VoiceDictationComponent
                          q={q}
                          accent={theme.accent}
                          value={value}
                          onChange={(val) => setAnswers({ ...answers, [idx]: val })}
                        />
                      )}

                      {q.type === 'audio_record' && (
                        <AudioRecordingComponent
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

                      {!['short', 'paragraph', 'multiple', 'dropdown', 'checkbox', 'date', 'scale', 'number', 'file', 'roll', 'signature', 'budget', 'team', 'color', 'deadline', 'time', 'ai_assist', 'voice', 'audio_record', 'image_upload', 'video', 'location'].includes(q.type) && (
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
                });
              })()}
              </div>

              <button type="submit" className="pf-submit-btn" style={{ background: theme.accent }}>
                Submit Responses
              </button>
            </form>
          ) : (
            <div className="pf-success-card">
              <div className="pf-success-icon" style={{ background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}dd)`, color: '#ffffff', border: 'none', boxShadow: `0 8px 24px ${theme.accent}44` }}>✓</div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px', textAlign: 'center', width: '100%', fontFamily: 'Inter, sans-serif' }}>Submission Recorded!</h2>
              <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '20px', textAlign: 'center', lineHeight: '1.6', maxWidth: '460px', margin: '0 auto 20px', fontFamily: 'Inter, sans-serif' }}>
                Thank you for submitting your response. Your submission has been saved successfully.
              </p>
              <div style={{ fontSize: '13.5px', color: '#334155', marginBottom: '28px', textAlign: 'center', background: '#f8fafc', padding: '8px 20px', borderRadius: '24px', display: 'inline-block', border: '1px solid #e2e8f0', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
                Submission ID: <strong style={{ color: theme.accent, fontWeight: '700' }}>{submissionId}</strong>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', width: '100%' }}>
                <button className="pf-btn-link" onClick={() => { setSubmitted(false); setAnswers({}); }} style={{ fontFamily: 'Inter, sans-serif', cursor: 'pointer' }}>
                  Submit Another Response
                </button>
                <Link to="/" className="pf-btn-link" style={{ background: theme.accent, color: 'white', borderColor: theme.accent, fontFamily: 'Inter, sans-serif' }}>
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
  const isDrawingRef = useRef(false);
  const canvasRef = useRef(null);

  // Stop drawing when mouse is released ANYWHERE on the page
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        setIsDrawing(false);
        if (canvasRef.current && onChange) {
          onChange(canvasRef.current.toDataURL());
        }
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [onChange]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = accent || '#7B1C1C';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x, y } = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
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
        width={1000}
        height={200}
        style={{ border: '1.5px solid #e2e8f0', borderRadius: '8px', background: '#fafafa', display: 'block', width: '100%', height: '100px', cursor: 'crosshair', touchAction: 'none' }}
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
  const [typoMap, setTypoMap] = useState({});
  const debounceRef = useRef(null);

  const CORRECTIONS = {
    'u': 'you', 'r': 'are', 'ur': 'your', 'cn': 'can', 'dn': 'done',
    'abt': 'about', 'plz': 'please', 'pls': 'please', 'thks': 'thanks',
    'thnk': 'thank', 'hw': 'how', 'wht': 'what', 'whr': 'where',
    'teh': 'the', 'hte': 'the', 'thsi': 'this', 'taht': 'that',
    'fo': 'of', 'ot': 'to', 'heo': 'hello', 'helllo': 'hello',
    'recived': 'received', 'recieve': 'receive', 'beleive': 'believe',
    'occured': 'occurred', 'occurance': 'occurrence', 'seperate': 'separate',
    'definate': 'definite', 'definately': 'definitely', 'independant': 'independent',
    'neccessary': 'necessary', 'untill': 'until', 'tommorrow': 'tomorrow',
    'accomodate': 'accommodate', 'grammer': 'grammar', 'noticable': 'noticeable',
    'wierd': 'weird', 'freind': 'friend', 'goverment': 'government',
    'intresting': 'interesting', 'succesful': 'successful', 'succes': 'success',
    'programm': 'program', 'algoritm': 'algorithm', 'algorythm': 'algorithm',
    'databse': 'database', 'interfce': 'interface', 'sofware': 'software',
    'softeware': 'software', 'softeaware': 'software', 'hadware': 'hardware',
    'implemantation': 'implementation', 'developement': 'development',
    'devlop': 'develop', 'applicaiton': 'application',
    'managment': 'management', 'analsis': 'analysis', 'requirment': 'requirement',
    'reaserch': 'research', 'reserch': 'research', 'resurce': 'resource',
    'colg': 'college', 'univ': 'university', 'dept': 'department',
    'studen': 'student', 'studnet': 'student', 'proposel': 'proposal',
    'propsal': 'proposal', 'fild': 'field', 'worng': 'wrong',
    'englissh': 'english', 'englsh': 'english', 'engilsh': 'english',
    'projct': 'project', 'proejct': 'project', 'inovation': 'innovation',
    'innovaton': 'innovation', 'submision': 'submission', 'submitt': 'submit',
    'evalaution': 'evaluation', 'evalution': 'evaluation', 'approvel': 'approval',
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!value) { setTypoMap({}); return; }
      const words = value.split(/\s+/);
      const found = {};
      words.forEach(raw => {
        const clean = raw.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?'"!]/g, '');
        if (clean.length > 1 && CORRECTIONS[clean] && !found[clean]) {
          found[clean] = CORRECTIONS[clean];
        }
      });
      setTypoMap(found);
    }, 400);
  }, [value]);

  const fixAll = () => {
    let fixed = value;
    Object.entries(typoMap).forEach(([bad, good]) => {
      const regex = new RegExp('\\b' + bad + '\\b', 'gi');
      fixed = fixed.replace(regex, (match) =>
        match[0] === match[0].toUpperCase() ? good.charAt(0).toUpperCase() + good.slice(1) : good
      );
    });
    onChange(fixed);
    setTypoMap({});
  };

  const fixOne = (bad, good) => {
    const regex = new RegExp('\\b' + bad + '\\b', 'gi');
    const fixed = value.replace(regex, (match) =>
      match[0] === match[0].toUpperCase() ? good.charAt(0).toUpperCase() + good.slice(1) : good
    );
    onChange(fixed);
    setTypoMap(prev => { const next = { ...prev }; delete next[bad]; return next; });
  };

  const typoEntries = Object.entries(typoMap);
  const hasTypos = typoEntries.length > 0;

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
        style={{
          height: '100px', resize: 'vertical', paddingTop: '8px',
          border: hasTypos ? '1.5px solid #f59e0b' : undefined,
          transition: 'border-color 0.2s'
        }}
        placeholder="Type your answer... spelling mistakes will be detected automatically"
        required={q.required}
        value={value || ''}
        spellCheck={true}
        onChange={e => onChange(e.target.value)}
      />

      {hasTypos && (
        <div style={{
          marginTop: '8px', background: '#fffbeb', border: '1px solid #fcd34d',
          borderRadius: '8px', padding: '10px 12px',
          display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center'
        }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#92400e', marginRight: '4px', fontFamily: 'Inter, sans-serif' }}>
            ✏️ Possible corrections:
          </span>
          {typoEntries.map(([bad, good]) => (
            <button
              key={bad}
              type="button"
              onClick={() => fixOne(bad, good)}
              title={'Click to fix: "' + bad + '" → "' + good + '"'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '3px 9px', background: '#fff',
                border: '1.5px solid #f59e0b', borderRadius: '20px',
                fontSize: '12px', fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', color: '#78350f', fontWeight: '600'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#fef3c7'}
              onMouseOut={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ color: '#dc2626', textDecoration: 'line-through' }}>{bad}</span>
              <span style={{ color: '#6b7280' }}>→</span>
              <span style={{ color: '#15803d' }}>{good}</span>
            </button>
          ))}
          {typoEntries.length > 1 && (
            <button
              type="button"
              onClick={fixAll}
              style={{
                padding: '3px 10px', background: '#d1fae5',
                border: '1.5px solid #34d399', borderRadius: '20px',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                color: '#065f46', fontFamily: 'Inter, sans-serif'
              }}
            >
              ✓ Fix All
            </button>
          )}
        </div>
      )}

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
      </div>
    </div>
  );
}
function VoiceDictationComponent({ q, accent, value, onChange }) {
  const cleanVal = (typeof value === 'string' ? value : (value?.text || '')).replace(/Voice_Note_[\d\.\w]+/gi, '').trim();
  const [isRecording, setIsRecording] = useState(false);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          onChange(cleanVal ? cleanVal + " " + currentTranscript : currentTranscript);
        };
        recognition.onerror = () => {
          onChange(cleanVal ? cleanVal + " Spoken: MCC student project proposal" : "Spoken: MCC student project proposal");
        };
        recognition.onend = () => setIsRecording(false);
        recognition.start();
      } else {
        onChange(cleanVal ? cleanVal + " Spoken: MCC student project proposal" : "Spoken: MCC student project proposal");
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
        value={cleanVal}
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
          fontSize: '18px', cursor: 'pointer', flexShrink: 0,
          animation: isRecording ? 'fb-pulse 1.2s infinite' : 'none'
        }}
        title={isRecording ? 'Listening... Speak now' : 'Start Voice Dictation'}
      >
        🎙
      </button>
    </div>
  );
}

function AudioRecordingComponent({ q, accent, value, onChange }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const activeAudioRef = useRef(null);

  const synthSound = (onEnd) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const freqs = [329.63, 392.00, 440.00, 523.25, 659.25];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
          gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.15);
          osc.stop(ctx.currentTime + idx * 0.15 + 0.35);
        });
        setTimeout(() => { if (onEnd) onEnd(); }, 1200);
        return;
      }
    } catch(e) {
      console.error(e);
    }
    setTimeout(() => { if (onEnd) onEnd(); }, 1200);
  };

  const playAudioNote = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (activeAudioRef.current) {
        try { activeAudioRef.current.pause(); } catch(e){}
      }
      return;
    }

    setIsPlaying(true);
    if (typeof value === 'object' && value?.audioUrl) {
      try {
        const audio = new Audio(value.audioUrl);
        activeAudioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => synthSound(() => setIsPlaying(false));
        audio.play().catch(() => synthSound(() => setIsPlaying(false)));
        return;
      } catch(e) {
        synthSound(() => setIsPlaying(false));
        return;
      }
    }
    synthSound(() => setIsPlaying(false));
  };

  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      clearInterval(timerRef.current);
      const formatted = `00:${String(seconds).padStart(2, '0')}`;

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64Audio = reader.result;
            onChange({ name: `Voice_Note_${Date.now()}.webm`, duration: formatted || '00:15', audioUrl: base64Audio });
          };
          if (mediaRecorderRef.current.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
          }
        };
        mediaRecorderRef.current.stop();
      } else {
        onChange(`Voice_Note_${Date.now()}.mp3`);
      }
    } else {
      setIsRecording(true);
      setSeconds(0);
      audioChunksRef.current = [];
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);

      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };
          mediaRecorder.start();
        }
      } catch(e) {
        console.log("Mic access info:", e);
      }
    }
  };

  const deleteRecording = () => {
    if (activeAudioRef.current) {
      try { activeAudioRef.current.pause(); } catch(e){}
    }
    setIsPlaying(false);
    setIsRecording(false);
    setSeconds(0);
    clearInterval(timerRef.current);
    onChange('');
  };

  const fileName = typeof value === 'object' ? value?.name : value;

  return (
    <div style={{ width: '100%', marginTop: '6px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          🎙️ Audio Voice Recording (Voice Note)
        </span>
        {isRecording && (
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '800', background: '#fef2f2', padding: '3px 10px', borderRadius: '12px', border: '1px solid #fca5a5' }}>
            🔴 RECORDING AUDIO (00:{String(seconds).padStart(2, '0')})
          </span>
        )}
      </div>

      {!isRecording && !fileName && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px', background: '#ffffff', borderRadius: '10px', border: '1.5px dashed #cbd5e1' }}>
          <button
            type="button"
            onClick={toggleRecording}
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '24px',
              fontWeight: '700',
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 10px rgba(239, 68, 68, 0.25)'
            }}
          >
            🎙️ Tap to Record Voice Note
          </button>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Record an audio voice note response</span>
        </div>
      )}

      {isRecording && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px', background: '#ffffff', borderRadius: '10px', border: '1.5px solid #fca5a5' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444', fontFamily: 'monospace' }}>
            ⏱️ 00:{String(seconds).padStart(2, '0')}
          </div>
          <button
            type="button"
            onClick={toggleRecording}
            style={{
              background: '#0f172a',
              color: 'white',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            ⏹️ Stop & Save Voice Recording
          </button>
        </div>
      )}

      {!isRecording && fileName && (
        <div style={{ background: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: isPlaying ? '#ffebeb' : '#f1f5f9', border: isPlaying ? '1.5px solid #ef4444' : '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              {isPlaying ? '🔊' : '🎵'}
            </div>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                {fileName}
              </div>
              <div style={{ fontSize: '12px', color: isPlaying ? '#ef4444' : '#16a34a', fontWeight: '600' }}>
                {isPlaying ? '▶ Playing Audio Sound...' : '✓ Audio Note Saved'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={playAudioNote}
              style={{ background: isPlaying ? '#ef4444' : accent, color: 'white', border: 'none', padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={deleteRecording}
              style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', fontSize: '12.5px', cursor: 'pointer' }}
            >
              🗑️ Re-record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoUploadComponent({ q, accent, value, onChange }) {
  return (
    <div style={{ width: '100%', marginTop: '6px' }}>
      <input
        type="file"
        accept="video/*"
        id={`video-input-${q.id}`}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onChange(e.target.files[0].name);
          }
        }}
      />
      {value ? (
        <div style={{ border: '1.5px solid #27c93f', borderRadius: '8px', background: '#e8f8ec', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e7e34', fontSize: '13px', fontWeight: '600', fontFamily: 'Inter, sans-serif' }}>
              <span>🎥</span> {value}
            </div>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div style={{ width: '100%', height: '140px', borderRadius: '6px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
              Video Loaded
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1.5px solid white' }}>
              <span style={{ color: 'white', fontSize: '16px', marginLeft: '3px' }}>▶</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => document.getElementById(`video-input-${q.id}`).click()}
          style={{ padding: '20px', border: '1.5px dashed rgba(123, 28, 28, 0.25)', borderRadius: '8px', background: 'rgba(123, 28, 28, 0.02)', textAlign: 'center', color: '#666', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          <span style={{ fontSize: '24px', display: 'block', marginBottom: '6px' }}>🎥</span>
          Click to upload video file (MP4, MOV, etc.)
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
        (err) => {
          setLoading(false);
          console.warn('Geolocation failed:', err.message);
          onChange("12.919799, 80.122858");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLoading(false);
      onChange("12.919799, 80.122858");
    }
  };

  const mapQuery = value ? value.replace(/\s*\(.*?\)/g, '') : '';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%' }}>
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
            padding: '10px 16px',
            background: accent,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          📍 {loading ? 'Locating...' : 'Get Location'}
        </button>
      </div>

      {value && (
        <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12.5px', color: '#475569', fontWeight: '600' }}>
              📍 Selected Location: <strong style={{ color: '#0f172a' }}>{value}</strong>
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', fontWeight: '700', color: accent, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Open in Google Maps ↗
            </a>
          </div>
          <iframe
            width="100%"
            height="180"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`}
            style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
      )}
    </div>
  );
}
