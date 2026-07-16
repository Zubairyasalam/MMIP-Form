import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TEMPLATES, TEMPLATE_THEMES } from '../data/templates';
import './AdminFormManagement.css';

export default function AdminFormManagement({ onLogAction }) {
  // View states
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'oldest', 'alpha'

  // Forms state
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null); // For preview
  const [editingForm, setEditingForm] = useState(null); // For add/edit modal
  const [activeModalTab, setActiveModalTab] = useState('basic'); // 'basic' or 'fields'

  const handleDownloadSchema = (form) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(form, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${form.id || 'form'}-schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadSubmissions = (form) => {
    const allSubs = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    const formSubs = allSubs.filter(s => s.formId === form.id || s.formName === form.name);

    if (formSubs.length === 0) {
      alert(`No submissions found for the form "${form.name}".`);
      return;
    }

    const headers = ['Submission ID', 'Timestamp'];
    form.questions.forEach((q) => {
      if (q.cardType === 'question' || !q.cardType) {
        headers.push(`"${q.question.replace(/"/g, '""')}"`);
      }
    });

    const rows = formSubs.map(sub => {
      const row = [
        sub.id,
        sub.timestamp || new Date(sub.submittedAt || Date.now()).toISOString()
      ];

      form.questions.forEach((q, qIdx) => {
        if (q.cardType === 'question' || !q.cardType) {
          const ans = sub.answers?.[qIdx];
          if (ans === undefined || ans === null) {
            row.push('');
          } else if (Array.isArray(ans)) {
            row.push(`"${ans.join(', ').replace(/"/g, '""')}"`);
          } else {
            row.push(`"${String(ans).replace(/"/g, '""')}"`);
          }
        }
      });
      return row.join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `${form.id}-submissions.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // New field working state (within modal)
  const [newFieldData, setNewFieldData] = useState({
    question: '',
    type: 'short',
    placeholder: '',
    required: false,
    options: '',
    default_value: '',
    help_text: ''
  });

  // Categories
  const categories = [
    'Registration', 'Research', 'Feedback', 'Education',
    'Healthcare', 'Events', 'Grant Application', 'Custom'
  ];

  // Load from localStorage, merging any new built-in templates
  useEffect(() => {
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

    let existing = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('customForms_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(parsed)) {
            existing = [...existing, ...parsed];
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

    setForms(existing);
  }, []);

  // Save to localStorage
  const saveForms = (updatedForms) => {
    setForms(updatedForms);
    
    // Group forms by creator_id
    const formsByUser = {};
    updatedForms.forEach(f => {
      if (f.id.startsWith('default-')) return;
      const cid = f.creator_id || 'guest';
      if (!formsByUser[cid]) formsByUser[cid] = [];
      formsByUser[cid].push(f);
    });

    // Update existing user keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('customForms_')) {
        const cid = key.replace('customForms_', '');
        localStorage.setItem(key, JSON.stringify(formsByUser[cid] || []));
      }
    }
    // Create new keys if needed
    Object.keys(formsByUser).forEach(cid => {
      localStorage.setItem(`customForms_${cid}`, JSON.stringify(formsByUser[cid]));
    });

    // Dispatch a storage event so other open pages (like Templates.jsx) automatically sync
    window.dispatchEvent(new Event('storage'));
  };

  // Log actions helper
  const triggerLog = (msg) => {
    if (typeof onLogAction === 'function') {
      onLogAction('Form', msg);
    }
  };

  // Add / Edit submission
  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!editingForm.name) return;

    let updated;
    const nowStr = new Date().toLocaleDateString();

    const formToSave = {
      ...editingForm,
      fields: `${editingForm.questions.length} fields`,
      updated_at: nowStr
    };

    const isEdit = forms.some(f => f.id === formToSave.id);

    if (isEdit) {
      updated = forms.map(f => f.id === formToSave.id ? formToSave : f);
      triggerLog(`Updated template structure: "${formToSave.name}"`);
    } else {
      formToSave.created_at = nowStr;
      updated = [formToSave, ...forms];
      triggerLog(`Created new form template: "${formToSave.name}"`);
    }

    saveForms(updated);
    setEditingForm(null);
  };

  // Delete Form
  const handleDeleteForm = (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete the template: "${name}"? This action cannot be undone.`)) {
      const updated = forms.filter(f => f.id !== id);
      saveForms(updated);
      triggerLog(`Deleted form template: "${name}"`);
    }
  };

  // Duplicate / Clone Form
  const handleCloneForm = (form) => {
    const cloned = {
      ...form,
      id: `clone-${Date.now()}`,
      name: `${form.name} (Copy)`,
      created_at: new Date().toLocaleDateString(),
      updated_at: new Date().toLocaleDateString(),
      creator_id: sessionStorage.getItem('userId') || localStorage.getItem('userId') || 'guest'
    };
    const updated = [cloned, ...forms];
    saveForms(updated);
    triggerLog(`Cloned template: "${form.name}" into "${cloned.name}"`);
  };

  // Toggle publish status
  const handleToggleStatus = (id, currentStatus, name) => {
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const updated = forms.map(f => f.id === id ? { ...f, status: nextStatus } : f);
    saveForms(updated);
    triggerLog(`Changed "${name}" status to: ${nextStatus}`);
  };

  // Initialize new form
  const startNewForm = () => {
    setEditingForm({
      id: `form-${Date.now()}`,
      name: '',
      desc: '',
      tag: 'Registration',
      bg: 'maroon-bg',
      button_text: 'Use Template',
      status: 'Active',
      questions: [],
      creator: 'Administrator',
      creator_id: sessionStorage.getItem('userId') || localStorage.getItem('userId') || 'guest'
    });
    setActiveModalTab('basic');
  };

  // Start editing existing form
  const startEditForm = (form) => {
    setEditingForm({
      ...form,
      questions: form.questions || []
    });
    setActiveModalTab('basic');
  };

  // Dynamic fields builder helpers
  const handleAddField = () => {
    if (!newFieldData.question) return;

    const preparedField = {
      type: newFieldData.type,
      question: newFieldData.question,
      required: newFieldData.required,
      placeholder: newFieldData.placeholder,
      help_text: newFieldData.help_text,
      default_value: newFieldData.default_value,
      options: newFieldData.options
        ? newFieldData.options.split(',').map(o => o.trim()).filter(Boolean)
        : []
    };

    setEditingForm(prev => ({
      ...prev,
      questions: [...prev.questions, preparedField]
    }));

    // Reset field state
    setNewFieldData({
      question: '',
      type: 'short',
      placeholder: '',
      required: false,
      options: '',
      default_value: '',
      help_text: ''
    });
  };

  const handleRemoveField = (index) => {
    const updatedQs = [...editingForm.questions];
    updatedQs.splice(index, 1);
    setEditingForm(prev => ({ ...prev, questions: updatedQs }));
  };

  const handleMoveField = (index, direction) => {
    const updatedQs = [...editingForm.questions];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= updatedQs.length) return;

    // Swap
    const temp = updatedQs[index];
    updatedQs[index] = updatedQs[targetIdx];
    updatedQs[targetIdx] = temp;

    setEditingForm(prev => ({ ...prev, questions: updatedQs }));
  };

  // Filtering & Sorting
  const filteredForms = (forms || []).map(f => ({
    ...f,
    name: f.name || f.title || 'Untitled Form',
    status: f.status || 'Active'
  })).filter(f => {
    const nameVal = (f.name || '').toLowerCase();
    const descVal = (f.desc || '').toLowerCase();
    const matchesSearch = nameVal.includes(searchQuery.toLowerCase()) ||
      descVal.includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || f.tag === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || f.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  }).sort((a, b) => {
    if (sortBy === 'alpha') {
      return (a.name || '').localeCompare(b.name || '');
    }
    const dateA = new Date(a.created_at || a.created || 0);
    const dateB = new Date(b.created_at || b.created || 0);
    return sortBy === 'latest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="tmpl-mgmt-container">
      {/* Search and Filters Header */}
      <div className="tmpl-mgmt-controls">
        <div className="tmpl-search-bar">
          <input
            type="text"
            placeholder="Search forms by name or description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="tmpl-filters-group">
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="latest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alpha">Alphabetical (A-Z)</option>
          </select>

          <div className="tmpl-view-toggles">
            <button
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              type="button"
            >
              Table
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Card View"
              type="button"
            >
              Grid
            </button>
          </div>

          <button className="super-btn-primary add-tmpl-btn" onClick={startNewForm} type="button">
            + Add New Form
          </button>
        </div>
      </div>

      {/* Grid or Table Listing */}
      {filteredForms.length === 0 ? (
        <div className="tmpl-empty-state">
          <p>No form templates match the selected criteria.</p>
          <button className="super-btn-primary" onClick={startNewForm} type="button">+ Create First Template</button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="templates-grid" style={{ padding: 0 }}>
          {filteredForms.map(tmpl => {
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
              <div key={tmpl.id} className="template-card">
                <div className={`template-card-preview ${isDynamic ? '' : tmpl.bg}`} style={{ position: 'relative', ...(isDynamic ? dynamicBannerStyle : {}) }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 2 }}>
                    <span className="tmpl-badge-status" style={{ background: tmpl.status === 'Active' ? '#22c55e' : '#94a3b8', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      {tmpl.status}
                    </span>
                  </div>
                  <div className="template-mini-form">
                    <div className="mini-form-title">{tmpl.name}</div>
                    <div className="mini-form-field full" />
                    <div className="mini-form-field short" />
                    <div className="mini-form-field full" />
                    <div className="mini-form-btn" style={{ background: theme.accent }} />
                  </div>
                </div>
                <div className="template-card-info">
                  <h3>{tmpl.name}</h3>
                  <p>{tmpl.desc}</p>
                  <div className="template-card-meta">
                    <span className="template-tag" style={{ color: theme.accent, background: `${theme.accent}12` }}>
                      {tmpl.tag}
                    </span>
                    <span className="template-fields">{tmpl.fields || `${tmpl.questions?.length || 0} fields`}</span>
                  </div>

                  <div className="template-card-actions">
                    <button type="button" onClick={() => setSelectedForm(tmpl)} className="card-act-btn preview">Preview</button>
                    <button type="button" onClick={() => startEditForm(tmpl)} className="card-act-btn edit">Edit</button>
                    <button type="button" onClick={() => handleCloneForm(tmpl)} className="card-act-btn clone">Clone</button>
                    <button type="button" onClick={() => handleToggleStatus(tmpl.id, tmpl.status, tmpl.name)} className="card-act-btn" style={{ background: tmpl.status === 'Active' ? '#f59e0b' : '#10b981', color: 'white' }}>
                      {tmpl.status === 'Active' ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" onClick={() => handleDeleteForm(tmpl.id, tmpl.name)} className="card-act-btn delete">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="super-table-container">
          <table className="super-data-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Category</th>
                <th>Fields</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map(tmpl => (
                <tr key={tmpl.id}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ color: '#1e293b', fontSize: '13.5px' }}>{tmpl.name}</strong>
                      <span style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                        {tmpl.desc}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="table-tag-badge" style={{ color: (TEMPLATE_THEMES[tmpl.bg] || TEMPLATE_THEMES['maroon-bg']).accent }}>
                      {tmpl.tag}
                    </span>
                  </td>
                  <td className="font-semibold">{tmpl.questions?.length || 0}</td>
                  <td>
                    <button
                      onClick={() => handleToggleStatus(tmpl.id, tmpl.status, tmpl.name)}
                      className={`status-pill ${tmpl.status.toLowerCase()}`}
                      style={{ border: 'none', cursor: 'pointer' }}
                      type="button"
                    >
                      {tmpl.status === 'Active' ? '🟢 Active' : '⚪ Inactive'}
                    </button>
                  </td>
                  <td>{tmpl.created_at || tmpl.created || 'N/A'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => setSelectedForm(tmpl)} className="action-btn view">
                        View
                      </button>
                      <button type="button" onClick={() => startEditForm(tmpl)} className="action-btn edit">
                        Edit
                      </button>
                      <button type="button" onClick={() => handleCloneForm(tmpl)} className="action-btn clone">
                        Clone
                      </button>
                      <button type="button" onClick={() => handleDeleteForm(tmpl.id, tmpl.name)} className="action-btn delete">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      {editingForm && createPortal(
        <div className="super-modal-overlay">
          <form onSubmit={handleSaveForm} className="super-modal" style={{ maxWidth: '750px', width: '90%' }}>
            <div className="modal-header">
              <h4>{forms.some(f => f.id === editingForm.id) ? 'Edit Form Template' : 'Create New Form Template'}</h4>
              <button type="button" className="modal-close" onClick={() => setEditingForm(null)}>×</button>
            </div>

            {/* Modal Tabs Header */}
            <div className="modal-tabs-header">
              <button
                type="button"
                className={`modal-tab-btn ${activeModalTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('basic')}
              >
                1. Basic Metadata
              </button>
              <button
                type="button"
                className={`modal-tab-btn ${activeModalTab === 'fields' ? 'active' : ''}`}
                onClick={() => setActiveModalTab('fields')}
              >
                2. Dynamic Fields Builder ({editingForm.questions?.length || 0})
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '480px', overflowY: 'auto' }}>
              {activeModalTab === 'basic' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Form Name / Title</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Workshop Registration Form"
                        value={editingForm.name}
                        onChange={e => setEditingForm(prev => ({ ...prev, name: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select
                        value={editingForm.tag}
                        onChange={e => setEditingForm(prev => ({ ...prev, tag: e.target.value }))}
                        className="form-select"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      placeholder="Give a short overview of the form..."
                      value={editingForm.desc}
                      onChange={e => setEditingForm(prev => ({ ...prev, desc: e.target.value }))}
                      className="form-textarea"
                      rows={2}
                    />
                  </div>

                  <div className="tmpl-form-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label className="form-label">Card Theme Color</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <select
                          value={editingForm.bg?.startsWith('#') ? 'custom' : editingForm.bg}
                          onChange={e => {
                            if (e.target.value === 'custom') {
                              setEditingForm(prev => ({ ...prev, bg: '#3b82f6' }));
                            } else {
                              setEditingForm(prev => ({ ...prev, bg: e.target.value }));
                            }
                          }}
                          className="form-select"
                          style={{ flex: 1 }}
                        >
                          {Object.entries(TEMPLATE_THEMES).map(([key, val]) => (
                            <option key={key} value={key}>{val.label} Accent</option>
                          ))}
                          <option value="custom">Custom Color...</option>
                        </select>
                        {editingForm.bg?.startsWith('#') && (
                          <input
                            type="color"
                            value={editingForm.bg}
                            onChange={e => setEditingForm(prev => ({ ...prev, bg: e.target.value }))}
                            style={{ height: '42px', width: '42px', padding: '0', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', background: 'white' }}
                            title="Choose Custom Color"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="form-label">CTA Button Text</label>
                      <input
                        type="text"
                        placeholder="e.g. Use Template"
                        value={editingForm.button_text}
                        onChange={e => setEditingForm(prev => ({ ...prev, button_text: e.target.value }))}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Publishing Status</label>
                    <div className="status-radio-group">
                      <label className={`status-radio-option ${editingForm.status === 'Active' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="tmpl-status"
                          checked={editingForm.status === 'Active'}
                          onChange={() => setEditingForm(prev => ({ ...prev, status: 'Active' }))}
                          style={{ display: 'none' }}
                        />
                        <span className="status-dot online"></span>
                        <span className="status-option-text">Active & Published</span>
                      </label>
                      <label className={`status-radio-option ${editingForm.status === 'Inactive' ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="tmpl-status"
                          checked={editingForm.status === 'Inactive'}
                          onChange={() => setEditingForm(prev => ({ ...prev, status: 'Inactive' }))}
                          style={{ display: 'none' }}
                        />
                        <span className="status-dot offline"></span>
                        <span className="status-option-text">Draft / Inactive</span>
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Dynamic Fields List */}
                  <h5 style={{ fontSize: '14px', marginBottom: '12px', color: '#1e293b' }}>Configured Fields</h5>

                  {editingForm.questions.length === 0 ? (
                    <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '12.5px', marginBottom: '20px' }}>
                      No fields configured yet. Add fields using the panel below.
                    </p>
                  ) : (
                    <div className="builder-fields-list">
                      {editingForm.questions.map((q, idx) => (
                        <div key={idx} className="builder-field-row">
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '13px', color: '#334155' }}>
                                {q.question} {q.required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
                              </strong>
                              <span className="field-type-pill">{q.type}</span>
                              {q.required && <span className="field-required-pill">Required</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                              {q.placeholder && <span>Placeholder: "{q.placeholder}"</span>}
                              {q.options?.length > 0 && <span>Options: {q.options.join(', ')}</span>}
                            </div>
                          </div>

                          <div className="builder-field-actions">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveField(idx, -1)}
                              className="order-btn"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={idx === editingForm.questions.length - 1}
                              onClick={() => handleMoveField(idx, 1)}
                              className="order-btn"
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveField(idx)}
                              className="field-del-btn"
                              title="Delete Field"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <hr style={{ borderColor: '#f1f5f9', margin: '20px 0' }} />

                  {/* Add New Field form sub-panel */}
                  <h5 style={{ fontSize: '14px', marginBottom: '12px', color: '#1e293b' }}>➕ Add New Field</h5>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>Field Label</label>
                        <input
                          type="text"
                          placeholder="e.g. Full Name"
                          value={newFieldData.question}
                          onChange={e => setNewFieldData(prev => ({ ...prev, question: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>Field Type</label>
                        <select
                          value={newFieldData.type}
                          onChange={e => setNewFieldData(prev => ({ ...prev, type: e.target.value }))}
                          className="form-select"
                        >
                          <option value="short">Short text</option>
                          <option value="paragraph">Paragraph textarea</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="phone">Phone Number</option>
                          <option value="password">Password</option>
                          <option value="date">Date picker</option>
                          <option value="multiple">Dropdown select</option>
                          <option value="radio">Radio buttons</option>
                          <option value="checkbox">Checkboxes</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>Placeholder text</label>
                        <input
                          type="text"
                          placeholder="e.g. Enter your name"
                          value={newFieldData.placeholder}
                          onChange={e => setNewFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>Help / Tooltip text</label>
                        <input
                          type="text"
                          placeholder="Optional help context..."
                          value={newFieldData.help_text}
                          onChange={e => setNewFieldData(prev => ({ ...prev, help_text: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {['multiple', 'radio', 'checkbox'].includes(newFieldData.type) && (
                      <div style={{ marginBottom: '12px' }}>
                        <label className="form-label" style={{ fontSize: '11.5px' }}>Options (Comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Yes, No, Maybe"
                          value={newFieldData.options}
                          onChange={e => setNewFieldData(prev => ({ ...prev, options: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newFieldData.required}
                          onChange={e => setNewFieldData(prev => ({ ...prev, required: e.target.checked }))}
                        />
                        Required Field
                      </label>
                      <button
                        type="button"
                        onClick={handleAddField}
                        disabled={!newFieldData.question}
                        className="super-btn-primary"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Add Field to Form
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="super-btn-secondary" onClick={() => setEditingForm(null)}>
                Cancel
              </button>
              <button type="submit" className="super-btn-primary">
                Save Template Configuration
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {selectedForm && createPortal(
        <div className="super-modal-overlay">
          <div className="super-modal" style={{ maxWidth: '950px', width: '95%' }}>
            <div className="modal-header">
              <h4>Preview Template: "{selectedForm.name}"</h4>
              <button type="button" className="modal-close" onClick={() => setSelectedForm(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <div className="fb-banner" style={{ background: (TEMPLATE_THEMES[selectedForm.bg] || TEMPLATE_THEMES['maroon-bg']).banner, height: '100px', borderRadius: '12px', marginBottom: '20px' }} />

              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>{selectedForm.name}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>{selectedForm.desc}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedForm.questions?.map((q, idx) => (
                  <div key={idx}>
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', color: '#334155', marginBottom: q.description ? '3px' : '6px' }}>
                      {q.question} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {q.description && (
                      <p style={{ fontSize: '11px', color: '#000000', marginTop: '-2px', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>
                        {q.description}
                      </p>
                    )}

                    {q.type === 'number' ? (
                      <input type="number" placeholder="Enter number..." disabled style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }} />
                    ) : q.type === 'paragraph' ? (
                      <textarea placeholder={q.placeholder} disabled style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }} />
                    ) : ['multiple', 'select', 'dropdown'].includes(q.type) ? (
                      <select disabled style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }}>
                        <option value="">Choose Option...</option>
                        {q.options?.map((o, oIdx) => <option key={oIdx} value={o}>{o}</option>)}
                      </select>
                    ) : q.type === 'radio' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '4px' }}>
                        {q.options?.map((o, oIdx) => (
                          <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                            <input type="radio" disabled /> {o}
                          </label>
                        ))}
                      </div>
                    ) : q.type === 'checkbox' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', padding: '4px' }}>
                        {q.options?.map((o, oIdx) => (
                          <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#475569' }}>
                            <input type="checkbox" disabled /> {o}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input type={q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'} placeholder={q.placeholder} disabled style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', background: '#f8fafc' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="super-btn-primary"
                style={{ background: '#0284c7', borderColor: '#0284c7' }}
                onClick={() => handleDownloadSchema(selectedForm)}
              >
                📥 Download Schema (JSON)
              </button>
              <button
                type="button"
                className="super-btn-primary"
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                onClick={() => handleDownloadSubmissions(selectedForm)}
              >
                📊 Download Submissions (CSV)
              </button>
              <button type="button" className="super-btn-primary" style={{ background: '#64748b', borderColor: '#64748b' }} onClick={() => setSelectedForm(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
