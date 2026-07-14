import { useState, useEffect } from 'react';
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

    const saved = localStorage.getItem('customForms');
    let existing = [];
    try {
      existing = saved ? JSON.parse(saved) : [];
    } catch (e) {
      existing = [];
    }

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

    setForms(existing);
  }, []);

  // Save to localStorage
  const saveForms = (updatedForms) => {
    setForms(updatedForms);
    localStorage.setItem('customForms', JSON.stringify(updatedForms));
    
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
      creator: 'Administrator'
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
            const theme = TEMPLATE_THEMES[tmpl.bg] || TEMPLATE_THEMES['maroon-bg'];
            return (
              <div key={tmpl.id} className="template-card">
                <div className="template-card-banner" style={{ background: theme.banner }}>
                  <div className="template-card-header-overlay">
                    <span className="tmpl-badge-status" style={{ background: tmpl.status === 'Active' ? '#22c55e' : '#94a3b8' }}>
                      {tmpl.status}
                    </span>
                  </div>
                  <div className="template-card-preview-mini">
                    <div className="preview-field-mini" />
                    <div className="preview-field-mini" />
                    <button className="preview-btn-mini" style={{ background: theme.accent }} type="button">
                      {tmpl.button_text || 'Use Template'}
                    </button>
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
      {editingForm && (
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">Card Theme Color</label>
                      <select
                        value={editingForm.bg}
                        onChange={e => setEditingForm(prev => ({ ...prev, bg: e.target.value }))}
                        className="form-select"
                      >
                        {Object.entries(TEMPLATE_THEMES).map(([key, val]) => (
                          <option key={key} value={key}>{val.label} Accent</option>
                        ))}
                      </select>
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
                              <strong style={{ fontSize: '13px', color: '#334155' }}>{q.question}</strong>
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
        </div>
      )}

      {/* ── LIVE PREVIEW MODAL ── */}
      {selectedForm && (
        <div className="super-modal-overlay">
          <div className="super-modal" style={{ maxWidth: '600px', width: '90%' }}>
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
                    <label style={{ display: 'block', fontWeight: '700', fontSize: '12.5px', color: '#334155', marginBottom: '6px' }}>
                      {q.question} {q.required && <span style={{ color: '#dc2626' }}>*</span>}
                    </label>
                    
                    {q.type === 'paragraph' ? (
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
            <div className="modal-footer">
              <button type="button" className="super-btn-primary" onClick={() => setSelectedForm(null)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
