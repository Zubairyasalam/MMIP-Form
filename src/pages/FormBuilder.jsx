import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TEMPLATES } from '../data/templates';
import './FormBuilder.css';

const TYPES = [
  { value: 'short',     label: '📝 Short answer' },
  { value: 'paragraph', label: '📄 Paragraph' },
  { value: 'multiple',  label: '🔘 Multiple choice' },
  { value: 'checkbox',  label: '☑ Checkboxes' },
  { value: 'dropdown',  label: '🔽 Dropdown' },
  { value: 'date',      label: '📅 Date' },
  { value: 'time',      label: '🕐 Time' },
  { value: 'scale',     label: '📊 Linear scale' },
  { value: 'file',      label: '📁 File upload (PDF/Proposals)' },
  { value: 'roll',      label: '🆔 MCC Roll No / Staff Code' },
  { value: 'signature', label: '✍️ Digital Signature Pad' },
  { value: 'budget',    label: '💰 Budget Breakdown Table' },
  { value: 'team',      label: '👥 Team Members' },
  { value: 'color',     label: '🎨 Color Picker' },
  { value: 'deadline',  label: '⏰ Deadline Reminder' },
  { value: 'ai_assist', label: '🤖 AI Assistant' },
  { value: 'voice',     label: '🎙️ Voice Input' },
  { value: 'video',     label: '🎥 Video Upload' },
  { value: 'location',  label: '📍 Location Picker' },
];

let nextId = 100;

function makeQ(q) {
  return { ...q, id: nextId++, cardType: 'question' };
}

function RichTextToolbar({ onFormat }) {
  const tools = [
    { cmd: 'bold',          icon: <strong style={{ fontSize: '13px', fontFamily: 'Georgia, serif' }}>B</strong>,      title: 'Bold' },
    { cmd: 'italic',        icon: <em style={{ fontSize: '13px', fontFamily: 'Georgia, serif' }}>I</em>,              title: 'Italic' },
    { cmd: 'underline',     icon: <span style={{ textDecoration: 'underline', fontSize: '13px' }}>U</span>,          title: 'Underline' },
    { cmd: 'link',          icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>, title: 'Link' },
    { cmd: 'strikethrough', icon: <span style={{ textDecoration: 'line-through', fontSize: '13px' }}>S</span>,        title: 'Strikethrough' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2px', padding: '4px 6px', background: '#f8f8f8', borderRadius: '6px', border: '1px solid #e0e0e0', alignItems: 'center', width: 'fit-content', marginBottom: '6px' }}>
      {tools.map(({ cmd, icon, title }) => (
        <button
          key={cmd}
          type="button"
          title={title}
          onMouseDown={(e) => {
            e.preventDefault();
            onFormat(cmd);
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#444',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e8e8e8'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

function SignaturePad({ accent }) {
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
    setIsDrawing(false);
  };

  const clearCanvas = (e) => {
    e.stopPropagation();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={500}
        height={100}
        style={{ border: '1.5px solid #e0e0e0', borderRadius: '8px', background: '#fafafa', display: 'block', width: '100%', height: '100px', cursor: 'crosshair' }}
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
        style={{ position: 'absolute', right: '12px', top: '10px', background: 'rgba(0,0,0,0.06)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color: '#555' }}
      >
        Clear
      </button>
    </div>
  );
}

function AnswerArea({
  q, accent, onChange, uploadedFiles, setUploadedFiles, rollInputs, setRollInputs, budgets, setBudgets,
  teams, setTeams, colors, setColors, deadlines, setDeadlines,
  aiTexts, setAiTexts, voiceInputs, setVoiceInputs, videoUploads, setVideoUploads,
  locationInputs, setLocationInputs
}) {
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  
  const addOption = () => onChange({ ...q, options: [...q.options, `Option ${q.options.length + 1}`] });
  const updateOption = (i, val) => { const opts = [...q.options]; opts[i] = val; onChange({ ...q, options: opts }); };
  const deleteOption = (i) => onChange({ ...q, options: q.options.filter((_, idx) => idx !== i) });

  if (q.type === 'short') {
    return (
      <div className="fb-answer-area">
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Short answer text..."
          style={{
            minHeight: '36px',
            padding: '8px 10px',
            border: '1px solid #e0e0e0',
            borderBottom: '2px solid #aaa',
            borderRadius: '4px 4px 0 0',
            fontSize: '13.5px',
            color: '#111',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            background: 'transparent',
          }}
        />
      </div>
    );
  }
  if (q.type === 'paragraph') {
    return (
      <div className="fb-answer-area">
        <div
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Long answer text..."
          style={{
            minHeight: '72px',
            padding: '10px 12px',
            border: '1px solid #e0e0e0',
            borderBottom: '2px solid #aaa',
            borderRadius: '4px 4px 0 0',
            fontSize: '13.5px',
            color: '#111',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            background: 'transparent',
            overflow: 'auto'
          }}
        />
      </div>
    );
  }

  if (['multiple', 'checkbox', 'dropdown'].includes(q.type)) {
    const isCb = q.type === 'checkbox';

    const handleBulletClick = (i) => {
      if (isCb) {
        setSelectedIndices(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
      } else {
        setSelectedIdx(selectedIdx === i ? null : i);
      }
    };

    return (
      <div className="fb-answer-area">
        {q.options.map((opt, i) => {
          const isSelected = isCb ? selectedIndices.includes(i) : selectedIdx === i;
          return (
            <div className="fb-option-row" key={i}>
              <div
                className={`fb-option-bullet${isCb ? ' square' : ''}`}
                onClick={() => handleBulletClick(i)}
                style={{
                  borderColor: accent,
                  cursor: 'pointer',
                  background: isSelected ? accent : 'transparent',
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {!isCb && isSelected && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: 'white',
                    borderRadius: '50%',
                  }} />
                )}
                {isCb && isSelected && (
                  <span style={{
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    lineHeight: 1
                  }}>✓</span>
                )}
              </div>
              <input className="fb-option-input" value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
              <button className="fb-option-delete" onClick={() => deleteOption(i)}>✕</button>
            </div>
          );
        })}
        <button className="fb-add-option-btn" onClick={addOption} style={{ color: accent }}>
          <div className={`fb-option-bullet${isCb ? ' square' : ''}`} style={{ opacity: 0.4, borderColor: accent }} />
          Add option
        </button>
      </div>
    );
  }
  if (q.type === 'date') {
    return (
      <div className="fb-answer-area">
        <input
          type="date"
          className="fb-date-input-field"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1.5px solid #e0e0e0',
            color: '#111',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            outline: 'none',
            background: '#ffffff',
            width: '220px',
            cursor: 'pointer'
          }}
        />
      </div>
    );
  }
  if (q.type === 'time') {
    return (
      <div className="fb-answer-area">
        <input
          type="time"
          className="fb-time-input-field"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1.5px solid #e0e0e0',
            color: '#111',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            outline: 'none',
            background: '#ffffff',
            width: '160px',
            cursor: 'pointer'
          }}
        />
      </div>
    );
  }
  if (q.type === 'scale') return (
    <div className="fb-answer-area">
      <div className="fb-scale-row">
        {[1,2,3,4,5].map(n => (
          <div className="fb-scale-item" key={n}>
            <div className="fb-scale-radio" style={{ borderColor: accent }} />
            <span>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
  if (q.type === 'file') {
    const fileName = uploadedFiles?.[q.id];
    return (
      <div className="fb-answer-area">
        <input 
          type="file" 
          id={`file-input-${q.id}`} 
          style={{ display: 'none' }} 
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setUploadedFiles(prev => ({ ...prev, [q.id]: e.target.files[0].name }));
            }
          }}
        />
        {fileName ? (
          <div style={{ padding: '14px', border: '1.5px solid #27c93f', borderRadius: '8px', background: '#e8f8ec', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#1e7e34', fontSize: '13.5px', fontWeight: '600' }}>
              <span>📄</span> {fileName}
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setUploadedFiles(prev => {
                  const updated = { ...prev };
                  delete updated[q.id];
                  return updated;
                });
              }}
              style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ) : (
          <div 
            className="fb-file-upload-preview" 
            onClick={() => document.getElementById(`file-input-${q.id}`).click()}
            style={{ padding: '16px', border: '1.5px dashed rgba(123, 28, 28, 0.25)', borderRadius: '8px', background: 'rgba(123, 28, 28, 0.02)', textAlign: 'center', color: '#666', fontSize: '13.5px', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '20px', display: 'block', marginBottom: '6px' }}>📁</span>
            Drag & drop project proposal documents here or <strong>browse files</strong> (PDF, DOCX, ZIP up to 10MB)
          </div>
        )}
      </div>
    );
  }
  if (q.type === 'roll') {
    const val = rollInputs?.[q.id] || '';
    const isValid = /^\d{2}-[A-Za-z]{2,3}-\d{3}$/.test(val) || (val.length >= 4 && /^[a-zA-Z0-9]+$/.test(val));
    return (
      <div className="fb-answer-area">
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            className="fb-input"
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            placeholder="Type ID (e.g. 23-CO-101)"
            value={val}
            onChange={(e) => setRollInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
          />
          {val && (
            <div style={{ 
              alignSelf: 'center', 
              background: isValid ? '#e8f8ec' : '#ffebeb', 
              color: isValid ? '#27c93f' : '#ff3b30', 
              padding: '8px 12px', 
              borderRadius: '6px', 
              fontSize: '11px', 
              fontWeight: '700' 
            }}>
              {isValid ? '✓ Verified ID' : '✗ Invalid Format'}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (q.type === 'signature') {
    return (
      <div className="fb-answer-area">
        <SignaturePad accent={accent} />
      </div>
    );
  }
  if (q.type === 'budget') {
    const defaultRows = [
      { item: 'Equipment & Hardware', cost: 15000 },
      { item: 'Cloud Hosting & APIs', cost: 5000 },
    ];
    const rows = budgets?.[q.id] || defaultRows;

    const updateRow = (idx, field, val) => {
      const updatedRows = [...rows];
      updatedRows[idx] = { ...updatedRows[idx], [field]: val };
      setBudgets(prev => ({ ...prev, [q.id]: updatedRows }));
    };

    const addRow = () => {
      setBudgets(prev => ({
        ...prev,
        [q.id]: [...rows, { item: '', cost: 0 }]
      }));
    };

    const deleteRow = (idx) => {
      if (rows.length === 1) return;
      const updatedRows = rows.filter((_, i) => i !== idx);
      setBudgets(prev => ({ ...prev, [q.id]: updatedRows }));
    };

    const total = rows.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0);

    return (
      <div className="fb-answer-area">
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
              <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Expense Item</th>
              <th style={{ padding: '8px 0', fontSize: '11px', fontWeight: '800', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px', width: '150px' }}>Cost (₹)</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px 0' }}>
                  <input
                    type="text"
                    value={row.item}
                    onChange={(e) => updateRow(idx, 'item', e.target.value)}
                    placeholder="e.g. Hosting, Hardware components, Travel"
                    style={{ width: '95%', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                </td>
                <td style={{ padding: '8px 0' }}>
                  <input
                    type="number"
                    value={row.cost}
                    onChange={(e) => updateRow(idx, 'cost', e.target.value)}
                    placeholder="0"
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  <button
                    type="button"
                    onClick={() => deleteRow(idx)}
                    style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '15px', cursor: 'pointer', padding: '4px' }}
                    title="Remove row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e0e0e0', flexWrap: 'wrap', gap: '12px' }}>
          <button
            type="button"
            onClick={addRow}
            style={{ padding: '8px 14px', background: 'white', border: `1.5px solid ${accent}`, color: accent, borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' }}
          >
            + Add Row
          </button>
          <div style={{ fontSize: '14px', fontWeight: '800', color: accent, fontFamily: 'Inter, sans-serif' }}>
            Total requested: ₹{total.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    );
  }
  if (q.type === 'team') {
    return <TeamEditor q={q} accent={accent} teams={teams} setTeams={setTeams} />;
  }
  if (q.type === 'color') {
    return <ColorPickerEditor q={q} accent={accent} colors={colors} setColors={setColors} />;
  }
  if (q.type === 'deadline') {
    return <DeadlineReminderEditor q={q} accent={accent} deadlines={deadlines} setDeadlines={setDeadlines} />;
  }
  if (q.type === 'ai_assist') {
    return <AiAssistantEditor q={q} accent={accent} aiTexts={aiTexts} setAiTexts={setAiTexts} />;
  }
  if (q.type === 'voice') {
    return <VoiceInputEditor q={q} accent={accent} voiceInputs={voiceInputs} setVoiceInputs={setVoiceInputs} />;
  }
  if (q.type === 'video') {
    return <VideoUploadEditor q={q} accent={accent} videoUploads={videoUploads} setVideoUploads={setVideoUploads} />;
  }
  if (q.type === 'location') {
    return <LocationPickerEditor q={q} accent={accent} locationInputs={locationInputs} setLocationInputs={setLocationInputs} />;
  }
  return null;
}

// ── Custom Interactive Question Components ──

function TeamEditor({ q, accent, teams, setTeams }) {
  const defaultMembers = [{ name: '', roll: '', role: 'Developer' }];
  const members = teams?.[q.id] || defaultMembers;

  const updateMember = (idx, field, val) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: val };
    setTeams(prev => ({ ...prev, [q.id]: updated }));
  };

  const addMember = () => {
    setTeams(prev => ({
      ...prev,
      [q.id]: [...members, { name: '', roll: '', role: 'Developer' }]
    }));
  };

  const removeMember = (idx) => {
    if (members.length === 1) return;
    const updated = members.filter((_, i) => i !== idx);
    setTeams(prev => ({ ...prev, [q.id]: updated }));
  };

  return (
    <div className="fb-answer-area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {members.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fcfcfc', padding: '10px', borderRadius: '8px', border: '1px solid #e0e0e0', flexWrap: 'wrap' }}>
            <input
              type="text"
              value={m.name}
              onChange={e => updateMember(idx, 'name', e.target.value)}
              placeholder="Full Name"
              style={{ flex: 2, minWidth: '130px', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
            />
            <input
              type="text"
              value={m.roll}
              onChange={e => updateMember(idx, 'roll', e.target.value)}
              placeholder="Roll No / Email"
              style={{ flex: 1.5, minWidth: '110px', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }}
            />
            <select
              value={m.role}
              onChange={e => updateMember(idx, 'role', e.target.value)}
              style={{ flex: 1.2, minWidth: '100px', padding: '8px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none', background: 'white' }}
            >
              <option value="Lead">Lead</option>
              <option value="Developer">Developer</option>
              <option value="Designer">Designer</option>
              <option value="Researcher">Researcher</option>
              <option value="Presenter">Presenter</option>
            </select>
            {members.length > 1 && (
              <button
                type="button"
                onClick={() => removeMember(idx)}
                style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '15px', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addMember}
          style={{ alignSelf: 'flex-start', padding: '8px 14px', background: 'white', border: `1.5px solid ${accent}`, color: accent, borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          + Add Team Member
        </button>
      </div>
    </div>
  );
}

function ColorPickerEditor({ q, accent, colors, setColors }) {
  const val = colors?.[q.id] || '#7B1C1C';
  const presets = [
    { hex: '#7B1C1C', label: 'MCC Maroon' },
    { hex: '#1E3A8A', label: 'Royal Blue' },
    { hex: '#008080', label: 'Deep Teal' },
    { hex: '#047857', label: 'Emerald' },
    { hex: '#D97706', label: 'Golden Amber' },
  ];
  return (
    <div className="fb-answer-area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: val }}>
            <input
              type="color"
              value={val}
              onChange={e => setColors(prev => ({ ...prev, [q.id]: e.target.value }))}
              style={{ position: 'absolute', top: -10, left: -10, width: 70, height: 70, opacity: 0, cursor: 'pointer' }}
            />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '4px' }}>Selected HEX</div>
            <input
              type="text"
              value={val.toUpperCase()}
              onChange={e => setColors(prev => ({ ...prev, [q.id]: e.target.value }))}
              style={{ width: '100px', padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', outline: 'none' }}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '800', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Theme Presets</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presets.map(p => (
              <button
                key={p.hex}
                type="button"
                onClick={() => setColors(prev => ({ ...prev, [q.id]: p.hex }))}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', border: '1.5px solid', borderColor: val === p.hex ? p.hex : '#e0e0e0', borderRadius: '20px', background: 'white', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: p.hex, display: 'inline-block' }} />
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: val === p.hex ? p.hex : '#555' }}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlineReminderEditor({ q, accent, deadlines, setDeadlines }) {
  const val = deadlines?.[q.id] || { datetime: '', reminderEnabled: false, reminderType: '1day' };
  const updateDeadline = (field, value) => {
    setDeadlines(prev => ({
      ...prev,
      [q.id]: { ...val, [field]: value }
    }));
  };
  return (
    <div className="fb-answer-area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input
          type="datetime-local"
          value={val.datetime}
          onChange={e => updateDeadline('datetime', e.target.value)}
          style={{ width: '220px', padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
        />
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '10px', background: '#fafafa', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => updateDeadline('reminderEnabled', !val.reminderEnabled)}>
            <div style={{ 
              width: '18px', 
              height: '18px', 
              borderRadius: '4px', 
              border: '1.5px solid', 
              borderColor: val.reminderEnabled ? accent : '#a0a0a0', 
              background: val.reminderEnabled ? accent : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '11px',
              fontWeight: 'bold',
              transition: 'all 0.15s'
            }}>
              {val.reminderEnabled && '✓'}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#333' }}>Automated Deadline Reminder Alert</span>
          </div>
          {val.reminderEnabled && (
            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#555' }}>Send alert email</span>
              <select
                value={val.reminderType}
                onChange={e => updateDeadline('reminderType', e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', background: 'white', outline: 'none' }}
              >
                <option value="2hours">2 hours before</option>
                <option value="1day">1 day before</option>
                <option value="3days">3 days before</option>
              </select>
              {val.datetime && (
                <span style={{ fontSize: '11px', color: '#666', fontWeight: '500', background: '#eef3fc', padding: '4px 8px', borderRadius: '4px' }}>
                  Trigger date: {new Date(new Date(val.datetime).getTime() - (val.reminderType === '2hours' ? 2 : val.reminderType === '1day' ? 24 : 72) * 60 * 60 * 1000).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AiAssistantEditor({ q, accent, aiTexts, setAiTexts }) {
  const textVal = aiTexts?.[q.id] || '';
  const [generating, setGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [suggestTip, setSuggestTip] = useState(false);

  const getTypos = () => {
    if (!textVal) return [];
    const words = textVal.split(/\s+/);
    const found = [];
    const TYPOS = {
      'heo': 'hello',
      'teh': 'the',
      'worng': 'wrong',
      'reaserch': 'research',
      'colg': 'college',
      'univ': 'university',
      'recived': 'received',
      'studen': 'student',
      'proposel': 'proposal',
      'devlop': 'develop',
      'sofware': 'software',
      'fild': 'field',
      'abt': 'about',
      'plz': 'please',
      'thks': 'thanks',
      'u': 'you',
      'r': 'are'
    };
    
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g,"");
      if (TYPOS[clean]) {
        found.push({ original: clean, correction: TYPOS[clean] });
      }
    });
    return found.filter((v, i, a) => a.findIndex(t => t.original === v.original) === i);
  };

  const detectedTypos = getTypos();

  const fixTypos = () => {
    let fixedText = textVal;
    
    detectedTypos.forEach(item => {
      const regex = new RegExp(`\\b${item.original}\\b`, 'gi');
      fixedText = fixedText.replace(regex, item.correction);
    });
    
    setAiTexts(prev => ({
      ...prev,
      [q.id]: fixedText
    }));
  };

  const triggerAi = () => {
    setGenerating(true);
    setSuggestTip(false);
    setTimeout(() => {
      setGenerating(false);
      
      const lower = textVal.toLowerCase();
      let response = "MCC Student Research Portal: A unified, secure digital platform designed to automate student project submissions, department reviews, and visual presentation approvals. The software supports automated PDF report parsing, integrated budget ledger tools, and direct feedback channels between incubation leads and student project leads.";
      
      if (lower.includes('attendance') || lower.includes('fingerprint') || lower.includes('facial')) {
        response = "IoT-Based Student Attendance Guard: A hardware-software solution incorporating low-power biometric fingerprint sensors and high-accuracy facial recognition pipelines. The platform logs real-time student check-ins, updates attendance ledgers automatically, and integrates seamlessly with Madras Christian College's academic portal.";
      } else if (lower.includes('water') || lower.includes('recycling') || lower.includes('hostel')) {
        response = "IoT Hostel Water Recycling Grid: An environmental engineering initiative that recycles greywater from student hostel blocks. Using real-time turbidity, pH, and flow sensors linked to an automated filtration circuit, the system safely repurposes laundry and bathwater for gardening, cutting MCC campus water consumption by 35%.";
      } else if (lower.includes('solar') || lower.includes('energy') || lower.includes('battery')) {
        response = "Smart Lab Microgrid & Solar Ledger: An automated energy distribution and tracking framework designed for campus lab facilities. Utilizing IoT current sensors and a React-based energy ledger, the project dynamically manages battery discharge cycles and solar energy redirection, providing real-time carbon offsets visualization.";
      }
      
      setAiTexts(prev => ({
        ...prev,
        [q.id]: response
      }));
    }, 950);
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
          setAiTexts(prev => ({
            ...prev,
            [q.id]: textVal ? textVal + " " + transcript : transcript
          }));
          setSuggestTip(true);
        };
        
        recognition.onerror = () => {
          simulateSpeechInput();
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognition.start();
      } else {
        simulateSpeechInput();
      }
    }
  };

  const simulateSpeechInput = () => {
    const mockQueries = [
      "how to build smart campus water recycling with sensors",
      "can you describe an rfid biometric student attendance grid",
      "explain the details of a campus solar energy ledger proposal"
    ];
    const query = mockQueries[Math.floor(Math.random() * mockQueries.length)];
    let current = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < query.length) {
        current += query.slice(i, i + 3);
        setAiTexts(prev => ({
          ...prev,
          [q.id]: current
        }));
        i += 3;
      } else {
        clearInterval(interval);
        setIsRecording(false);
        setSuggestTip(true);
      }
    }, 50);
  };

  return (
    <div className="fb-answer-area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Voice & Text Copilot
          </span>
          {isRecording && (
            <span style={{ fontSize: '11px', color: '#ff3b30', fontWeight: '700', animation: 'fb-pulse 1.2s infinite', padding: '2px 8px', borderRadius: '12px', background: '#ffebeb' }}>
              🎙️ Listening... Speak now
            </span>
          )}
        </div>
        
        <textarea
          value={textVal}
          onChange={e => setAiTexts(prev => ({ ...prev, [q.id]: e.target.value }))}
          placeholder="Type keywords, ask a doubt, or click the microphone to speak your project details..."
          style={{ width: '100%', height: '115px', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13.5px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
        />

        {detectedTypos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffebeb', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #ff3b30', gap: '10px' }}>
            <div style={{ fontSize: '12px', color: '#c92a2a', fontWeight: '700' }}>
              ⚠️ Typo detected: {detectedTypos.map(t => `"${t.original}" → "${t.correction}"`).join(', ')}
            </div>
            <button
              type="button"
              onClick={fixTypos}
              style={{ background: '#ff3b30', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' }}
            >
              🔧 Auto-Correct
            </button>
          </div>
        )}

        {suggestTip && (
          <div style={{ fontSize: '11.5px', color: accent, background: 'rgba(123, 28, 28, 0.05)', padding: '8px 12px', borderRadius: '6px', borderLeft: `3px solid ${accent}`, fontWeight: '600' }}>
            💡 Click <strong>Generate with AI</strong> below to turn your voice note into a professional proposal!
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={triggerAi}
            disabled={generating || isRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              background: (generating || isRecording) ? '#f0f0f0' : `linear-gradient(135deg, ${accent}, #a82828)`,
              color: (generating || isRecording) ? '#999' : 'white',
              border: 'none',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: (generating || isRecording) ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s'
            }}
          >
            {generating ? (
              <>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #ccc', borderTopColor: accent, borderRadius: '50%', animation: 'fb-spin 0.6s linear infinite' }} />
                🤖 Drafting proposal...
              </>
            ) : (
              <>✨ Generate description with AI Assistant</>
            )}
          </button>

          <button
            type="button"
            onClick={toggleRecording}
            disabled={generating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              background: isRecording ? '#ff3b30' : 'white',
              color: isRecording ? 'white' : '#333',
              border: isRecording ? 'none' : '1.5px solid #ccc',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              animation: isRecording ? 'fb-pulse 1.5s infinite' : 'none',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
          >
            <span>🎙️ {isRecording ? 'Stop Dictating' : 'Dictate with Voice'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function VoiceInputEditor({ q, accent, voiceInputs, setVoiceInputs }) {
  const val = voiceInputs?.[q.id] || { text: '', isRecording: false };
  const [recState, setRecState] = useState(false);

  const toggleRecording = () => {
    if (recState) {
      setRecState(false);
      setVoiceInputs(prev => ({ ...prev, [q.id]: { ...val, isRecording: false } }));
    } else {
      setRecState(true);
      setVoiceInputs(prev => ({ ...prev, [q.id]: { ...val, isRecording: true } }));
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setVoiceInputs(prev => ({
            ...prev,
            [q.id]: { text: val.text ? val.text + " " + transcript : transcript, isRecording: false }
          }));
        };
        
        recognition.onerror = () => {
          simulateVoiceTyping();
        };
        
        recognition.onend = () => {
          setRecState(false);
        };
        
        recognition.start();
      } else {
        simulateVoiceTyping();
      }
    }
  };

  const simulateVoiceTyping = () => {
    let phrase = "Madras Christian College student proposal seeks funding for clean-energy battery systems inside campus labs.";
    let current = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < phrase.length) {
        current += phrase.slice(i, i + 3);
        setVoiceInputs(prev => ({
          ...prev,
          [q.id]: { text: current, isRecording: true }
        }));
        i += 3;
      } else {
        clearInterval(interval);
        setRecState(false);
        setVoiceInputs(prev => ({
          ...prev,
          [q.id]: { text: phrase, isRecording: false }
        }));
      }
    }, 60);
  };

  return (
    <div className="fb-answer-area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <textarea
          value={val.text}
          onChange={e => setVoiceInputs(prev => ({ ...prev, [q.id]: { ...val, text: e.target.value } }))}
          placeholder="Click mic to start voice description recording..."
          style={{ width: '100%', height: '100px', padding: '12px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13.5px', outline: 'none', resize: 'vertical', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
        />
        <button
          type="button"
          onClick={toggleRecording}
          style={{
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: val.isRecording ? '#ff3b30' : '#f0f0f0',
            color: val.isRecording ? 'white' : '#333',
            border: val.isRecording ? 'none' : '1.5px solid #ccc',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            animation: val.isRecording ? 'fb-pulse 1.5s infinite' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <span>{val.isRecording ? '🔴 Recording... Tap to Stop' : '🎙️ Record Project Description'}</span>
        </button>
      </div>
    </div>
  );
}

function VideoUploadEditor({ q, accent, videoUploads, setVideoUploads }) {
  const val = videoUploads?.[q.id] || '';
  return (
    <div className="fb-answer-area">
      <input
        type="file"
        accept="video/*"
        id={`video-input-${q.id}`}
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setVideoUploads(prev => ({ ...prev, [q.id]: e.target.files[0].name }));
          }
        }}
      />
      {val ? (
        <div style={{ border: '1.5px solid #27c93f', borderRadius: '10px', background: '#e8f8ec', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e7e34', fontSize: '13px', fontWeight: '700' }}>
              <span>🎥</span> {val} (8.4 MB)
            </div>
            <button
              type="button"
              onClick={() => setVideoUploads(prev => ({ ...prev, [q.id]: '' }))}
              style={{ background: 'none', border: 'none', color: '#ff3b30', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div style={{ width: '100%', height: '180px', borderRadius: '6px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '10px', left: '10px', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>
              Ready to Play
            </div>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1.5px solid white' }}>
              <span style={{ color: 'white', fontSize: '20px', marginLeft: '4px' }}>▶</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => document.getElementById(`video-input-${q.id}`).click()}
          style={{ padding: '24px', border: '1.5px dashed rgba(123, 28, 28, 0.25)', borderRadius: '8px', background: 'rgba(123, 28, 28, 0.02)', textAlign: 'center', color: '#666', fontSize: '13px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>🎥</span>
          Drag & drop project demo videos here or <strong>browse files</strong> (MP4, MOV up to 50MB)
        </div>
      )}
    </div>
  );
}

function LocationPickerEditor({ q, accent, locationInputs, setLocationInputs }) {
  const val = locationInputs?.[q.id] || { address: '', coords: { lat: 12.9224, lng: 80.1226 }, set: false };
  const [searching, setSearching] = useState(false);

  const pinCoordinates = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setLocationInputs(prev => ({
        ...prev,
        [q.id]: {
          address: 'Madras Christian College (MCC) Incubation Center, Chennai',
          coords: { lat: 12.9229, lng: 80.1221 },
          set: true
        }
      }));
    }, 700);
  };

  return (
    <div className="fb-answer-area">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={val.address}
            onChange={e => setLocationInputs(prev => ({ ...prev, [q.id]: { ...val, address: e.target.value, set: true } }))}
            placeholder="Enter address or venue name..."
            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '13.5px', outline: 'none', fontFamily: 'Inter, sans-serif' }}
          />
          <button
            type="button"
            onClick={pinCoordinates}
            disabled={searching}
            style={{ padding: '10px 14px', background: accent, color: 'white', border: 'none', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          >
            {searching ? 'Locating...' : '📍 Pin GPS'}
          </button>
        </div>
        {val.set && (
          <div style={{ background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '6px', fontFamily: 'Inter, sans-serif' }}>
              <span>Latitude: {val.coords.lat.toFixed(6)}</span>
              <span>Longitude: {val.coords.lng.toFixed(6)}</span>
            </div>
            <div style={{ width: '100%', height: '140px', borderRadius: '6px', background: '#e3eaef', position: 'relative', overflow: 'hidden', backgroundImage: 'radial-gradient(circle, #bcd0db 20%, transparent 20%), radial-gradient(circle, #bcd0db 20%, transparent 20%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 8px 8px' }}>
              <div style={{ position: 'absolute', top: '40px', left: 0, right: 0, height: '12px', background: 'white', opacity: 0.6 }} />
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '80px', width: '12px', background: 'white', opacity: 0.6 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50% 50% 50% 0', background: '#ff3b30', transform: 'rotate(-45deg)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid #ff3b30', position: 'absolute', top: '-5px', left: '-5px', animation: 'fb-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              </div>
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(255,255,255,0.85)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', color: '#444', fontFamily: 'Inter, sans-serif' }}>
                MCC CAMPUS MAP
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionCard({
  q, focused, accent, onFocus, onChange, onDuplicate, onDelete,
  uploadedFiles, setUploadedFiles, rollInputs, setRollInputs, budgets, setBudgets,
  teams, setTeams, colors, setColors, deadlines, setDeadlines,
  aiTexts, setAiTexts, voiceInputs, setVoiceInputs, videoUploads, setVideoUploads,
  locationInputs, setLocationInputs
}) {
  const toggleRequired = () => onChange({ ...q, required: !q.required });
  const questionInputRef = useRef(null);
  const savedRangeRef = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const handleFormat = (cmd) => {
    restoreSelection();
    if (cmd === 'link') {
      const url = prompt('Enter URL:');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    questionInputRef.current?.focus();
  };

  return (
    <div
      className={`fb-card fb-question-card${focused ? ' focused' : ''}`}
      style={focused ? { borderLeftColor: accent } : {}}
      onClick={onFocus}
      id={`question-card-${q.id}`}
    >
      <div className="fb-question-top">
        <div
          ref={questionInputRef}
          contentEditable
          suppressContentEditableWarning
          className="fb-question-input"
          style={{ '--acc': accent, outline: 'none', cursor: 'text' }}
          onInput={e => onChange({ ...q, question: e.currentTarget.innerText })}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          data-placeholder="Question"
          dangerouslySetInnerHTML={undefined}
          suppressHydrationWarning
        >
          {q.question || ''}
        </div>
        <select
          className="fb-question-type-select"
          value={q.type}
          onChange={e => {
            const newType = e.target.value;
            onChange({
              ...q,
              type: newType,
              options: ['multiple','checkbox','dropdown'].includes(newType) && q.options.length === 0
                ? ['Option 1', 'Option 2'] : q.options,
            });
          }}
          id={`type-select-${q.id}`}
        >
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {focused && (
        <div style={{ padding: '4px 0 6px 0' }}>
          <RichTextToolbar onFormat={handleFormat} />
        </div>
      )}

      <AnswerArea 
        q={q} 
        accent={accent} 
        onChange={onChange} 
        uploadedFiles={uploadedFiles} 
        setUploadedFiles={setUploadedFiles} 
        rollInputs={rollInputs} 
        setRollInputs={setRollInputs} 
        budgets={budgets}
        setBudgets={setBudgets}
        teams={teams}
        setTeams={setTeams}
        colors={colors}
        setColors={setColors}
        deadlines={deadlines}
        setDeadlines={setDeadlines}
        aiTexts={aiTexts}
        setAiTexts={setAiTexts}
        voiceInputs={voiceInputs}
        setVoiceInputs={setVoiceInputs}
        videoUploads={videoUploads}
        setVideoUploads={setVideoUploads}
        locationInputs={locationInputs}
        setLocationInputs={setLocationInputs}
      />

      {focused && (
        <div className="fb-question-bottom">
          <button className="fb-q-action-btn" title="Duplicate" onClick={onDuplicate}>⧉</button>
          <button className="fb-q-action-btn" title="Delete" onClick={onDelete}>🗑</button>
          <div className="fb-required-toggle">
            Required
            <button
              className={`fb-toggle-switch${q.required ? ' on' : ''}`}
              style={q.required ? { background: accent } : {}}
              onClick={toggleRequired}
              id={`required-toggle-${q.id}`}
            >
              <div className="fb-toggle-knob" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Custom Blocks ──

function TitleDescCard({ q, focused, accent, onFocus, onChange, onDuplicate, onDelete }) {
  return (
    <div
      className={`fb-card fb-section-title-card${focused ? ' focused' : ''}`}
      style={focused ? { borderLeftColor: accent } : {}}
      onClick={onFocus}
      id={`section-title-card-${q.id}`}
    >
      <input
        className="fb-section-title-input"
        value={q.question}
        placeholder="Section Title"
        style={{ '--acc': accent }}
        onChange={e => onChange({ ...q, question: e.target.value })}
      />
      <textarea
        className="fb-section-desc-input"
        value={q.description || ''}
        placeholder="Description (optional)"
        style={{ '--acc': accent }}
        rows={1}
        onChange={e => onChange({ ...q, description: e.target.value })}
      />
      {focused && (
        <div className="fb-question-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button className="fb-q-action-btn" title="Duplicate" onClick={onDuplicate}>⧉</button>
          <button className="fb-q-action-btn" title="Delete" onClick={onDelete}>🗑</button>
        </div>
      )}
    </div>
  );
}

function ImageCard({ q, focused, accent, onFocus, onChange, onDuplicate, onDelete }) {
  const [urlInput, setUrlInput] = useState('');
  const handleUpload = () => {
    // Mock image file upload
    const mockImages = [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80'
    ];
    const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
    onChange({ ...q, mediaUrl: randomImg });
  };

  return (
    <div
      className={`fb-card fb-image-card${focused ? ' focused' : ''}`}
      style={focused ? { borderLeftColor: accent } : {}}
      onClick={onFocus}
      id={`image-card-${q.id}`}
    >
      <input
        className="fb-image-title-input"
        value={q.question}
        placeholder="Image Title"
        style={{ '--acc': accent }}
        onChange={e => onChange({ ...q, question: e.target.value })}
      />

      {q.mediaUrl ? (
        <div className="fb-image-preview-container">
          <img src={q.mediaUrl} alt={q.question || 'Form Image'} />
          <button className="fb-image-remove-btn" onClick={() => onChange({ ...q, mediaUrl: null })}>✕</button>
        </div>
      ) : (
        <div className="fb-image-uploader" onClick={handleUpload} style={{ '--acc': accent }}>
          <span className="fb-image-uploader-icon">🖼️</span>
          <div className="fb-image-uploader-text">Click to Upload / Choose an Image</div>
          <div className="fb-image-uploader-sub">Supports JPEG, PNG, WEBP (Mock file load)</div>
        </div>
      )}

      {focused && (
        <div className="fb-question-bottom">
          <button className="fb-q-action-btn" title="Duplicate" onClick={onDuplicate}>⧉</button>
          <button className="fb-q-action-btn" title="Delete" onClick={onDelete}>🗑</button>
        </div>
      )}
    </div>
  );
}

function VideoCard({ q, focused, accent, onFocus, onChange, onDuplicate, onDelete }) {
  const [url, setUrl] = useState(q.mediaUrl || '');
  const applyVideo = () => {
    // Extract video ID from youtube URL
    let videoId = 'dQw4w9WgXcQ'; // Default Rick Roll
    if (url.includes('v=')) {
      videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    onChange({ ...q, mediaUrl: `https://www.youtube.com/embed/${videoId}` });
  };

  return (
    <div
      className={`fb-card fb-video-card${focused ? ' focused' : ''}`}
      style={focused ? { borderLeftColor: accent } : {}}
      onClick={onFocus}
      id={`video-card-${q.id}`}
    >
      <input
        className="fb-video-title-input"
        value={q.question}
        placeholder="Video Title"
        style={{ '--acc': accent }}
        onChange={e => onChange({ ...q, question: e.target.value })}
      />

      {q.mediaUrl ? (
        <div className="fb-video-player-container">
          <iframe
            src={q.mediaUrl}
            title="Form Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {focused && (
            <button
              className="fb-image-remove-btn"
              style={{ position: 'absolute', top: 10, right: 10 }}
              onClick={() => { setUrl(''); onChange({ ...q, mediaUrl: null }); }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div className="fb-video-input-row">
          <input
            className="fb-video-url-input"
            value={url}
            placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
            style={{ '--acc': accent }}
            onChange={e => setUrl(e.target.value)}
          />
          <button className="fb-video-btn" onClick={applyVideo} style={{ background: accent }}>Add Video</button>
        </div>
      )}

      {focused && (
        <div className="fb-question-bottom">
          <button className="fb-q-action-btn" title="Duplicate" onClick={onDuplicate}>⧉</button>
          <button className="fb-q-action-btn" title="Delete" onClick={onDelete}>🗑</button>
        </div>
      )}
    </div>
  );
}

export default function FormBuilder() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/auth?mode=login');
    }
  }, [navigate]);

  const state = location.state || {};

  // Use template data if provided, else defaults
  const defaultTheme = { banner: 'linear-gradient(90deg, #5a1313, #7B1C1C, #a82828)', accent: '#7B1C1C' };
  const theme = state.theme || defaultTheme;
  const accent = theme.accent;

  const initQuestions = (state.questions && state.questions.length > 0)
    ? state.questions.map(makeQ)
    : [
        { id: nextId++, type: 'short',    question: 'Your full name', options: [], required: false },
        { id: nextId++, type: 'multiple', question: 'Select your department',
          options: ['Computer Science', 'Electronics', 'Mechanical', 'Civil'], required: false },
      ];

  const [formTitle, setFormTitle]   = useState(state.templateName || 'Untitled form');
  const [formDesc, setFormDesc]     = useState('Form description');
  const [questions, setQuestions]   = useState(initQuestions);
  const [focusedId, setFocusedId]   = useState(initQuestions[0]?.id);
  const [activeTab, setActiveTab]   = useState('Questions');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [rollInputs, setRollInputs] = useState({});
  const [budgets, setBudgets] = useState({});
  const [teams, setTeams] = useState({});
  const [colors, setColors] = useState({});
  const [deadlines, setDeadlines] = useState({});
  const [aiTexts, setAiTexts] = useState({});
  const [voiceInputs, setVoiceInputs] = useState({});
  const [videoUploads, setVideoUploads] = useState({});
  const [locationInputs, setLocationInputs] = useState({});
  const [collectEmail, setCollectEmail] = useState('do-not');

  // Responses states
  const [acceptingResponses, setAcceptingResponses] = useState(true);
  const [mockResponses, setMockResponses] = useState([]);
  const [respTab, setRespTab] = useState('Summary'); // Summary, Question, Individual

  // Settings states
  const [isQuiz, setIsQuiz] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState({
    responses: false,
    presentation: false,
    formDefaults: false,
    questionDefaults: false
  });

  const toggleSettingSection = (sec) => {
    setSettingsOpen(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const generateMockResponses = () => {
    // Generate mock submissions based on the current template name
    const names = ['Aravind Kumar', 'Priya Dharshini', 'Sanjay Raj', 'Meera Nair', 'Rohan Sharma'];
    const depts = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
    const domains = ['Technology & AI', 'Biomedical', 'Sustainability', 'Social Sciences'];

    const items = names.map((name, i) => {
      return {
        name,
        dept: depts[i % depts.length],
        domain: domains[i % domains.length],
        rating: (i % 3) + 3, // 3, 4, 5
        date: `2026-07-${10 + i}`
      };
    });
    setMockResponses(items);
  };

  const clearMockResponses = () => {
    setMockResponses([]);
  };

  const handlePublish = () => {
    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const formId = slug || `form-${Date.now()}`;
    const newForm = {
      id: formId,
      name: formTitle,
      desc: formDesc,
      tag: 'Custom Form',
      fields: `${questions.filter(q => q.cardType === 'question').length} fields`,
      bg: 'maroon-bg',
      theme: theme,
      questions: questions.filter(q => q.cardType === 'question').map(q => ({
        type: q.type,
        question: q.question,
        options: q.options || [],
        required: q.required || false
      })),
      created: new Date().toLocaleDateString(),
      creator: 'Super Admin'
    };

    const existing = JSON.parse(localStorage.getItem('customForms') || '[]');
    const index = existing.findIndex(f => f.id === formId);
    if (index > -1) {
      existing[index] = newForm;
    } else {
      existing.unshift(newForm);
    }
    localStorage.setItem('customForms', JSON.stringify(existing));
    setShowSuccess(true);
  };

  const addQuestion = (type = 'short') => {
    const newQ = {
      id: nextId++,
      cardType: 'question',
      type,
      question: '',
      options: ['multiple','checkbox','dropdown'].includes(type) ? ['Option 1','Option 2'] : [],
      required: false,
    };
    setQuestions(prev => [...prev, newQ]);
    setFocusedId(newQ.id);
  };

  const addTitleDesc = () => {
    const newTitle = {
      id: nextId++,
      cardType: 'title-desc',
      question: 'Section Title',
      description: 'Section description (optional)'
    };
    setQuestions(prev => [...prev, newTitle]);
    setFocusedId(newTitle.id);
  };

  const addImage = () => {
    const newImg = {
      id: nextId++,
      cardType: 'image',
      question: 'Image Title',
      mediaUrl: null
    };
    setQuestions(prev => [...prev, newImg]);
    setFocusedId(newImg.id);
  };

  const addVideo = () => {
    const newVid = {
      id: nextId++,
      cardType: 'video',
      question: 'Video Title',
      mediaUrl: null
    };
    setQuestions(prev => [...prev, newVid]);
    setFocusedId(newVid.id);
  };

  const handleImport = (template) => {
    const importedQs = template.questions.map(makeQ);
    setQuestions(prev => [...prev, ...importedQs]);
    setShowImport(false);
  };

  const updateQuestion = (updated) => setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));

  const duplicateQuestion = (q) => {
    const dup = { ...q, id: nextId++ };
    setQuestions(prev => {
      const idx = prev.findIndex(x => x.id === q.id);
      const next = [...prev];
      next.splice(idx + 1, 0, dup);
      return next;
    });
    setFocusedId(dup.id);
  };

  const deleteQuestion = (id) => {
    if (questions.length === 1) return;
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  return (
    <div className="fb-page">
      {/* ── Top bar ── */}
      <div className="fb-topbar">
        <div className="fb-topbar-inner">
          <Link to="/templates">
            <img src="/mcc-mrf-logo.png" alt="MCC-MRF" className="fb-logo" />
          </Link>

          <div className="fb-title-area">
            <input
              className="fb-form-title-input"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              id="fb-title-topbar"
              style={{ '--acc': accent }}
            />
            <div className="fb-tabs">
              {['Questions', 'Responses', 'Settings'].map(tab => (
                <button
                  key={tab}
                  className={`fb-tab${activeTab === tab ? ' active' : ''}`}
                  style={activeTab === tab ? { color: accent, borderBottomColor: accent } : {}}
                  onClick={() => setActiveTab(tab)}
                  id={`fb-tab-${tab.toLowerCase()}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="fb-topbar-actions">
            <button className="fb-icon-btn" title="Undo" id="fb-undo-btn">↩</button>
            <button className="fb-icon-btn" title="More options" id="fb-more-btn">⋮</button>
            <button
              className="fb-send-btn"
              style={{ background: accent }}
              onClick={handlePublish}
              id="fb-send-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send
            </button>
          </div>
        </div>
      </div>

      <div className="fb-main">
        {/* ── 1. QUESTIONS TAB VIEW ── */}
        {activeTab === 'Questions' && (
          <>
            {/* Left toolbar */}
            <div className="fb-toolbar">
              <button className="fb-tool-btn" title="Add question" onClick={() => addQuestion('short')} id="tool-add-q" style={{ color: accent }}>➕</button>
              <button className="fb-tool-btn" title="Add title & description" onClick={addTitleDesc} id="tool-add-title">T</button>
              <div className="fb-tool-divider" />
              <button className="fb-tool-btn" title="Add image" onClick={addImage} id="tool-img">🖼</button>
              <button className="fb-tool-btn" title="Add video" onClick={addVideo} id="tool-video">▶</button>
              <div className="fb-tool-divider" />
              <button className="fb-tool-btn" title="Import questions" onClick={() => setShowImport(true)} id="tool-import">📥</button>
            </div>

            {/* Form content */}
            <div className="fb-content">
              {/* Title card */}
              <div
                className={`fb-card fb-title-card${focusedId === 'title' ? ' focused' : ''}`}
                style={focusedId === 'title' ? { borderLeftColor: accent } : {}}
                onClick={() => setFocusedId('title')}
              >
                {/* Themed banner */}
                <div className="fb-banner" style={{ background: theme.banner }} />
                <div className="fb-title-card-inner">
                  <input
                    className="fb-main-title-input"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Form title"
                    id="fb-main-title"
                  />
                  <textarea
                    className="fb-main-desc-input"
                    value={formDesc}
                    onChange={e => setFormDesc(e.target.value)}
                    placeholder="Form description"
                    rows={1}
                    id="fb-main-desc"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f0f0f0' }}>
                    <button
                      type="button"
                      className={`fb-toggle-switch${collectEmail !== 'do-not' ? ' on' : ''}`}
                      style={collectEmail !== 'do-not' ? { background: accent, width: '32px', height: '18px' } : { width: '32px', height: '18px' }}
                      onClick={() => setCollectEmail(prev => prev === 'do-not' ? 'responder' : 'do-not')}
                    >
                      <div className="fb-toggle-knob" style={collectEmail !== 'do-not' ? { left: '16px', width: '14px', height: '14px' } : { width: '14px', height: '14px' }} />
                    </button>
                    <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#555' }}>
                      ✉️ Collect email addresses automatically
                    </span>
                  </div>
                </div>
              </div>

              {/* Email collection notification banner */}
              {collectEmail !== 'do-not' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#f0f4ff',
                  border: '1px solid #c5d8f8',
                  borderLeft: '4px solid #1a73e8',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  color: '#333',
                  marginBottom: '4px',
                  gap: '8px',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✉️</span>
                    <span>This form is automatically collecting emails from all respondents.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('Settings');
                      setSettingsOpen(prev => ({ ...prev, responses: true }));
                      setTimeout(() => {
                        const el = document.getElementById('settings-email-row');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 150);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: '0',
                      whiteSpace: 'nowrap',
                      fontFamily: 'Inter, sans-serif',
                      textDecoration: 'underline',
                      textUnderlineOffset: '2px'
                    }}
                  >
                    Change settings
                  </button>
                </div>
              )}

              {/* Cards Loop (Questions & Custom Blocks) */}
              {questions.map(q => {
                const props = {
                  q,
                  focused: focusedId === q.id,
                  accent,
                  onFocus: () => setFocusedId(q.id),
                  onChange: updateQuestion,
                  onDuplicate: () => duplicateQuestion(q),
                  onDelete: () => deleteQuestion(q.id),
                  uploadedFiles,
                  setUploadedFiles,
                  rollInputs,
                  setRollInputs,
                  budgets,
                  setBudgets,
                  teams,
                  setTeams,
                  colors,
                  setColors,
                  deadlines,
                  setDeadlines,
                  aiTexts,
                  setAiTexts,
                  voiceInputs,
                  setVoiceInputs,
                  videoUploads,
                  setVideoUploads,
                  locationInputs,
                  setLocationInputs
                };

                if (q.cardType === 'title-desc') {
                  return <TitleDescCard key={q.id} {...props} />;
                }
                if (q.cardType === 'image') {
                  return <ImageCard key={q.id} {...props} />;
                }
                if (q.cardType === 'video') {
                  return <VideoCard key={q.id} {...props} />;
                }
                return <QuestionCard key={q.id} {...props} />;
              })}

              {/* Submit & Publish Card */}
              <div className="fb-submit-card">
                <button
                  className="fb-main-submit-btn"
                  style={{ background: accent }}
                  onClick={handlePublish}
                  id="fb-submit-publish-btn"
                >
                  Submit & Publish Form
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── 2. RESPONSES TAB VIEW ── */}
        {activeTab === 'Responses' && (
          <div className="fb-content">
            {/* Responses Header Card */}
            <div className="fb-resp-header-card">
              <div className="fb-resp-count-title">
                {mockResponses.length} response{mockResponses.length !== 1 ? 's' : ''}
              </div>
              <div className="fb-resp-header-actions">
                <button className="fb-sheets-btn" id="fb-sheets-btn">
                  <span className="fb-sheets-icon">📊</span> Link to Sheets
                </button>
                <div className="fb-resp-toggle-label">
                  Accepting responses
                  <button
                    className={`fb-toggle-switch${acceptingResponses ? ' on' : ''}`}
                    style={acceptingResponses ? { background: accent } : {}}
                    onClick={() => setAcceptingResponses(!acceptingResponses)}
                    id="fb-toggle-accepting"
                  >
                    <div className="fb-toggle-knob" />
                  </button>
                </div>
              </div>
            </div>

            {mockResponses.length === 0 ? (
              <div className="fb-resp-empty-card">
                <p style={{ marginBottom: '16px' }}>No responses yet. Publish your form to start accepting responses.</p>
                <button
                  className="fb-mock-data-btn"
                  style={{ '--acc': accent }}
                  onClick={generateMockResponses}
                  id="fb-generate-mock-btn"
                >
                  ✨ Generate Mock Responses (Simulation)
                </button>
              </div>
            ) : (
              <div>
                <button
                  className="fb-mock-data-btn"
                  style={{ '--acc': accent, marginBottom: '16px' }}
                  onClick={clearMockResponses}
                  id="fb-clear-mock-btn"
                >
                  🗑 Clear Responses
                </button>

                {/* Summary Charts Card */}
                <div className="fb-resp-summary-card">
                  <h4>Department Breakdown</h4>
                  <div className="fb-resp-chart-bar-container">
                    <div className="fb-resp-chart-bar-row">
                      <div className="fb-resp-chart-label">Computer Science</div>
                      <div className="fb-resp-chart-track">
                        <div className="fb-resp-chart-fill" style={{ width: '60%', background: accent }} />
                      </div>
                      <div className="fb-resp-chart-val">3</div>
                    </div>
                    <div className="fb-resp-chart-bar-row">
                      <div className="fb-resp-chart-label">Electronics</div>
                      <div className="fb-resp-chart-track">
                        <div className="fb-resp-chart-fill" style={{ width: '20%', background: accent }} />
                      </div>
                      <div className="fb-resp-chart-val">1</div>
                    </div>
                    <div className="fb-resp-chart-bar-row">
                      <div className="fb-resp-chart-label">Mechanical</div>
                      <div className="fb-resp-chart-track">
                        <div className="fb-resp-chart-fill" style={{ width: '20%', background: accent }} />
                      </div>
                      <div className="fb-resp-chart-val">1</div>
                    </div>
                  </div>
                </div>

                {/* Submitter Log */}
                <div className="fb-resp-summary-card">
                  <h4>Recent Submissions</h4>
                  {mockResponses.map((r, idx) => (
                    <div className="fb-resp-item-row" key={idx} style={{ '--acc': accent }}>
                      <strong>{r.name}</strong> ({r.dept}) — Submitted on {r.date}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. SETTINGS TAB VIEW ── */}
        {activeTab === 'Settings' && (
          <div className="fb-content">
            {/* Quiz Card */}
            <div className="fb-card" style={{ padding: '20px 24px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '4px' }}>Make this a quiz</h4>
                  <p style={{ fontSize: '12.5px', color: '#666' }}>Assign point values, set answers, and automatically provide feedback</p>
                </div>
                <button
                  className={`fb-toggle-switch${isQuiz ? ' on' : ''}`}
                  style={isQuiz ? { background: accent } : {}}
                  onClick={() => setIsQuiz(!isQuiz)}
                  id="fb-toggle-quiz"
                >
                  <div className="fb-toggle-knob" />
                </button>
              </div>
            </div>

            {/* Accordion 1: Responses */}
            <div className="fb-settings-section-card">
              <div
                className={`fb-settings-accordion-header${settingsOpen.responses ? ' open' : ''}`}
                onClick={() => toggleSettingSection('responses')}
              >
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Responses</h3>
                  <p style={{ fontSize: '12px', color: '#666' }}>Manage how responses are collected and protected</p>
                </div>
                <span className={`fb-settings-arrow-icon${settingsOpen.responses ? ' open' : ''}`}>▼</span>
              </div>
              {settingsOpen.responses && (
                <div className="fb-settings-body">
                  <div className="fb-settings-row" id="settings-email-row" style={{ transition: 'background 0.3s', borderRadius: '8px', padding: '12px 14px' }}>
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Collect email addresses</span>
                      <span className="fb-settings-row-desc">Senders will receive a copy of their response</span>
                    </div>
                    <select
                      className="fb-settings-select"
                      value={collectEmail}
                      onChange={e => setCollectEmail(e.target.value)}
                    >
                      <option value="do-not">Do not collect</option>
                      <option value="verified">Verified only</option>
                      <option value="responder">Responder input</option>
                    </select>
                  </div>
                  <div className="fb-settings-row">
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Allow response editing</span>
                      <span className="fb-settings-row-desc">Responses can be changed after being submitted</span>
                    </div>
                    <button className="fb-toggle-switch"><div className="fb-toggle-knob" /></button>
                  </div>
                  <div className="fb-settings-row">
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Limit to 1 response</span>
                      <span className="fb-settings-row-desc">Requires users to sign in with their institution ID</span>
                    </div>
                    <button className="fb-toggle-switch"><div className="fb-toggle-knob" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Presentation */}
            <div className="fb-settings-section-card">
              <div
                className={`fb-settings-accordion-header${settingsOpen.presentation ? ' open' : ''}`}
                onClick={() => toggleSettingSection('presentation')}
              >
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Presentation</h3>
                  <p style={{ fontSize: '12px', color: '#666' }}>Manage how the form and responses are presented</p>
                </div>
                <span className={`fb-settings-arrow-icon${settingsOpen.presentation ? ' open' : ''}`}>▼</span>
              </div>
              {settingsOpen.presentation && (
                <div className="fb-settings-body">
                  <div className="fb-settings-row">
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Show progress bar</span>
                      <span className="fb-settings-row-desc">Helps responders track multi-page forms</span>
                    </div>
                    <button className="fb-toggle-switch"><div className="fb-toggle-knob" /></button>
                  </div>
                  <div className="fb-settings-row">
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Shuffle question order</span>
                      <span className="fb-settings-row-desc">Randomize the order of questions for each responder</span>
                    </div>
                    <button className="fb-toggle-switch"><div className="fb-toggle-knob" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Defaults */}
            <div className="fb-settings-section-card">
              <div
                className={`fb-settings-accordion-header${settingsOpen.formDefaults ? ' open' : ''}`}
                onClick={() => toggleSettingSection('formDefaults')}
              >
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Form defaults</h3>
                  <p style={{ fontSize: '12px', color: '#666' }}>Settings applied to this form and new forms</p>
                </div>
                <span className={`fb-settings-arrow-icon${settingsOpen.formDefaults ? ' open' : ''}`}>▼</span>
              </div>
              {settingsOpen.formDefaults && (
                <div className="fb-settings-body">
                  <div className="fb-settings-row">
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Collect emails by default</span>
                      <span className="fb-settings-row-desc">Automatically enable email collection on new forms</span>
                    </div>
                    <button className="fb-toggle-switch"><div className="fb-toggle-knob" /></button>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 4: Question Defaults */}
            <div className="fb-settings-section-card">
              <div
                className={`fb-settings-accordion-header${settingsOpen.questionDefaults ? ' open' : ''}`}
                onClick={() => toggleSettingSection('questionDefaults')}
              >
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Question defaults</h3>
                  <p style={{ fontSize: '12px', color: '#666' }}>Settings applied to all new questions</p>
                </div>
                <span className={`fb-settings-arrow-icon${settingsOpen.questionDefaults ? ' open' : ''}`}>▼</span>
              </div>
              {settingsOpen.questionDefaults && (
                <div className="fb-settings-body">
                  <div className="fb-settings-row">
                    <div className="fb-settings-row-left">
                      <span className="fb-settings-row-title">Make questions required by default</span>
                      <span className="fb-settings-row-desc">Enforce required constraint on newly added question cards</span>
                    </div>
                    <button className="fb-toggle-switch"><div className="fb-toggle-knob" /></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating + button (Questions tab only) ── */}
      {activeTab === 'Questions' && (
        <button
          className="fb-add-question-fab"
          style={{ background: accent, boxShadow: `0 4px 16px ${accent}66` }}
          onClick={() => addQuestion('short')}
          title="Add question"
          id="fb-fab-add"
        >
          +
        </button>
      )}

      {/* ── Success Modal ── */}
      {showSuccess && (
        <div className="fb-success-overlay" onClick={() => { setShowSuccess(false); }}>
          <div className="fb-success-card" onClick={e => e.stopPropagation()}>
            {/* Animated checkmark circle */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto',
                boxShadow: `0 8px 32px ${accent}44`,
                animation: 'fb-success-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
              }}>
                <span style={{ fontSize: '36px', color: 'white', lineHeight: 1 }}>✓</span>
              </div>
              {/* Ripple rings */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80px', height: '80px', borderRadius: '50%',
                border: `3px solid ${accent}55`,
                animation: 'fb-ripple 1.2s ease-out 0.3s infinite'
              }} />
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', marginBottom: '8px', fontFamily: 'Inter, sans-serif' }}>
              🎉 Form Successfully Published!
            </h2>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}>
              Your form <strong>"{formTitle}"</strong> is now live and ready to collect submissions.
            </p>
            
            {/* Shareable Link Block */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Shareable Form Link</div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  readOnly 
                  value={`${window.location.origin}/form/${formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form'}`}
                  style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13px', color: '#0f172a', fontWeight: '600', outline: 'none' }}
                />
                <button 
                  onClick={() => {
                    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form';
                    const link = `${window.location.origin}/form/${slug}`;
                    navigator.clipboard.writeText(link);
                    alert('Link copied to clipboard!');
                  }}
                  style={{ background: accent, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            {/* QR Code Scanner Card */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', gap: '8px' }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '16px',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.04)',
                border: '1px solid #f1f5f9',
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                    `${window.location.origin}/form/${formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form'}`
                  )}&color=000000`}
                  alt="Form QR Code"
                  style={{ width: '150px', height: '150px', display: 'block' }}
                />
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
                Scan to preview or screenshot to share QR scanner.
              </span>
            </div>

            {/* Divider */}
            <div style={{ width: '48px', height: '3px', background: `linear-gradient(90deg, ${accent}, ${accent}66)`, borderRadius: '99px', margin: '0 auto 24px' }} />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={`/form/${formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'form'}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: `2px solid ${accent}`,
                  background: 'white', color: accent, fontSize: '13px', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', textDecoration: 'none'
                }}
              >
                👁️ View Form
              </a>
              <button
                onClick={() => { setShowSuccess(false); navigate('/admin'); }}
                style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, color: 'white',
                  fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                  boxShadow: `0 4px 12px ${accent}44`
                }}
              >
                📊 Go to Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Questions Modal ── */}
      {showImport && (
        <div className="fb-import-overlay">
          <div className="fb-import-modal">
            <div className="fb-import-header">
              <h3>Import Questions</h3>
              <button className="fb-import-close" onClick={() => setShowImport(false)}>✕</button>
            </div>
            <div className="fb-import-body">
              <p style={{ fontSize: '13.5px', color: '#666', marginBottom: '16px' }}>
                Select a template to import its pre-configured questions into your current form:
              </p>
              <div className="fb-import-list">
                {TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    className="fb-import-item"
                    onClick={() => handleImport(tmpl)}
                  >
                    <div>
                      <div className="fb-import-item-title">{tmpl.name}</div>
                      <div className="fb-import-item-desc">{tmpl.desc}</div>
                    </div>
                    <span
                      className="fb-import-item-badge"
                      style={{ color: accent, background: `${accent}12` }}
                    >
                      {tmpl.fields}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
