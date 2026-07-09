import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const getColumnHeaders = (formTitle) => {
  const titleLower = (formTitle || '').toLowerCase();
  if (titleLower.includes('visitor') || titleLower.includes('grant') || titleLower.includes('expo')) {
    return ['ID', 'Visitor Name', 'Mobile', 'WhatsApp', 'State', 'District', 'Business Details', 'Website'];
  }
  if (titleLower.includes('proposal') || titleLower.includes('research')) {
    return ['ID', 'Applicant Name', 'Department', 'Research Title', 'Equipment/Domain', 'Duration', 'Grant Amount', 'Start Date'];
  }
  if (titleLower.includes('internship')) {
    return ['ID', 'Student Name', 'Email', 'Phone', 'Domain', 'CGPA', 'Availability', 'Start Date'];
  }
  if (titleLower.includes('booking') || titleLower.includes('lab')) {
    return ['ID', 'Researcher Name', 'Student ID', 'Lab Name', 'Booking Date', 'Time Slot', 'Purpose', 'Status'];
  }
  if (titleLower.includes('feedback')) {
    return ['ID', 'Faculty Name', 'Department', 'Teaching Rating', 'Availability', 'Content Rating', 'Syllabus Complete', 'Suggestions'];
  }
  return ['ID', 'Submitter Name', 'Contact Info', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7'];
};

const getRowCells = (row, formTitle) => {
  if (!row) {
    return {
      col1: '—', col2: '—', col3: '—', col4: '—', col5: '—', col6: '—',
      col7: { title: '—', sub: '—' }, col8: '—'
    };
  }

  const titleLower = (formTitle || '').toLowerCase();

  if (row.id && (row.id.toString().startsWith('MIL-00') || row.name === 'Zubairya Salam khan')) {
    return {
      col1: row.id,
      col2: row.name || 'Anonymous',
      col3: row.mobile || '—',
      col4: row.whatsapp || '—',
      col5: row.state || 'Tamil Nadu',
      col6: row.district || 'Karur',
      col7: { title: row.bizTitle || 'mrf', sub: row.bizSub || 'Health Care • R&D' },
      col8: row.website || '—'
    };
  }

  const ans = row.answers || [];
  const getAns = (keywords, fallback = '') => {
    const match = ans.find(a => a && a.q && keywords.some(k => a.q.toLowerCase().includes(k)));
    return match ? match.a : fallback;
  };

  if (titleLower.includes('visitor') || titleLower.includes('grant') || titleLower.includes('expo')) {
    const name = getAns(['name', 'investigator', 'applicant'], row.name || 'Anonymous');
    const email = row.email || getAns(['email'], '—');
    const dept = getAns(['department', 'institution'], '—');
    const proj = getAns(['project title', 'business'], 'mrf');
    const domain = getAns(['domain', 'sector'], 'Grant Application');
    const budget = getAns(['amount', 'budget'], '—');
    const start = getAns(['start date'], '—');
    
    return {
      col1: row.id || '—',
      col2: name,
      col3: budget !== '—' ? budget : '09043898231',
      col4: '09043898231',
      col5: 'Tamil Nadu',
      col6: dept !== '—' ? dept : 'Karur',
      col7: { title: proj, sub: `${domain} • Start: ${start}` },
      col8: email
    };
  }
  
  if (titleLower.includes('proposal') || titleLower.includes('research')) {
    const applicant = getAns(['researcher', 'applicant', 'name'], row.name || 'Anonymous');
    const dept = getAns(['department'], '—');
    const title = getAns(['title'], 'Research Title');
    const type = getAns(['type'], 'Mixed Methods');
    const duration = getAns(['duration'], '12 Months');
    const guide = getAns(['guide', 'supervisor'], '—');
    
    return {
      col1: row.id || '—',
      col2: applicant,
      col3: dept,
      col4: title,
      col5: 'Active',
      col6: type,
      col7: { title: `Guide: ${guide}`, sub: `Duration: ${duration}` },
      col8: row.email || '—'
    };
  }

  if (titleLower.includes('internship')) {
    const name = getAns(['name'], row.name || 'Anonymous');
    const email = row.email || getAns(['email'], '—');
    const phone = getAns(['phone', 'mobile'], '—');
    const domain = getAns(['domain'], 'Software');
    const cgpa = getAns(['cgpa'], '—');
    const availability = getAns(['availability'], 'Full-time');
    const start = getAns(['start', 'date'], '—');
    
    return {
      col1: row.id || '—',
      col2: name,
      col3: email,
      col4: phone,
      col5: 'Active',
      col6: domain,
      col7: { title: `CGPA: ${cgpa}`, sub: `Avail: ${availability}` },
      col8: start
    };
  }

  if (titleLower.includes('booking') || titleLower.includes('lab')) {
    const name = getAns(['name', 'researcher'], row.name || 'Anonymous');
    const studentId = getAns(['id', 'roll'], '—');
    const labName = getAns(['lab name', 'lab'], 'Computer Lab A');
    const date = getAns(['date', 'booking'], '—');
    const slot = getAns(['slot', 'time'], '—');
    
    return {
      col1: row.id || '—',
      col2: name,
      col3: studentId,
      col4: labName,
      col5: 'Reserved',
      col6: date,
      col7: { title: slot, sub: `Lab Reserve Slot` },
      col8: '—'
    };
  }

  if (titleLower.includes('feedback')) {
    const faculty = getAns(['faculty', 'name'], 'Dr. Cooper');
    const dept = getAns(['department'], '—');
    const clarity = getAns(['clarity', 'teaching'], '5');
    const avail = getAns(['availability'], '5');
    const content = getAns(['content'], '5');
    const completed = getAns(['completed', 'syllabus'], 'Yes');
    const suggestions = getAns(['suggestions', 'remarks'], '—');
    
    return {
      col1: row.id || '—',
      col2: faculty,
      col3: dept,
      col4: `Clarity: ${clarity}/5`,
      col5: 'Feedback',
      col6: `Avail: ${avail}/5`,
      col7: { title: `Content: ${content}/5`, sub: `Syllabus Complete: ${completed}` },
      col8: suggestions.slice(0, 20) + (suggestions.length > 20 ? '...' : '')
    };
  }

  return {
    col1: row.id || '—',
    col2: row.name || 'Anonymous',
    col3: row.email || 'Contact',
    col4: ans[0] ? ans[0].a : '—',
    col5: 'Submitted',
    col6: ans[1] ? ans[1].a : '—',
    col7: { title: ans[2] ? ans[2].a : 'Form Submission', sub: ans[3] ? ans[3].a : 'Details' },
    col8: row.date || '—'
  };
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('overview'); // overview, forms, responses, settings
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedFormSummary, setSelectedFormSummary] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedFormDb, setSelectedFormDb] = useState(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [editingSubmission, setEditingSubmission] = useState(null);

  // Mock data for forms managed by admin
  const [forms, setForms] = useState([
    { id: 1, title: 'Innovation Grant Application', status: 'Active', responses: 42, created: '2026-06-12', creator: 'Dr. Jane Cooper' },
    { id: 2, title: 'Student Course Feedback', status: 'Active', responses: 128, created: '2026-06-18', creator: 'Prof. John Smith' },
    { id: 3, title: 'MCC Alumni Survey 2026', status: 'Draft', responses: 0, created: '2026-07-01', creator: 'Admin Team' },
    { id: 4, title: 'Workshop Registration Form', status: 'Inactive', responses: 89, created: '2026-05-24', creator: 'Dept of Chemistry' },
    { id: 5, title: 'Faculty Research Proposal', status: 'Active', responses: 15, created: '2026-06-29', creator: 'Dr. Sarah Connor' }
  ]);

  // Load submissions and forms from localStorage on mount
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    const defaultSubs = [
      {
        id: 'MIL-101', name: 'Arun Kumar', form: 'Innovation Grant Application', time: '10 mins ago', status: 'Pending Review', email: 'arun.k@mcc.edu.in', date: '2026-07-08 15:42',
        answers: [
          { q: 'Principal Investigator Name', a: 'Arun Kumar' },
          { q: 'Department / Institution', a: 'Computer Science' },
          { q: 'Project Title', a: 'AI-Powered Agricultural Drone for Precision Spraying' },
          { q: 'Project Abstract', a: 'This project aims to develop a cost-effective, autonomous drone equipped with multispectral cameras and precision sprayers to optimize fertilizer and pesticide delivery.' },
          { q: 'Objectives and Expected Outcomes', a: '1. Reduce chemical waste by 30%. 2. Identify crop diseases in real-time. 3. Increase overall yield by 15%.' },
          { q: 'Research Domain', a: 'Technology & AI' },
          { q: 'Requested Grant Amount (₹)', a: '₹4,50,000' },
          { q: 'Proposed Project Start Date', a: '2026-08-01' }
        ]
      },
      {
        id: 'MIL-102', name: 'Priya Sharma', form: 'Student Course Feedback', time: '24 mins ago', status: 'Completed', email: 'priya.s@mcc.edu.in', date: '2026-07-08 15:28',
        answers: [
          { q: 'Student Name', a: 'Priya Sharma' },
          { q: 'Course Title', a: 'Advanced Data Structures & Algorithms' },
          { q: 'Instructor', a: 'Dr. Jane Cooper' },
          { q: 'Feedback / Remarks', a: 'The course was exceptionally well-structured. The practical lab sessions helped in understanding complex tree and graph algorithms.' },
          { q: 'Rating (1-5)', a: '5 / 5' }
        ]
      },
      {
        id: 'MIL-103', name: 'Devadas K.', form: 'Faculty Research Proposal', time: '1 hour ago', status: 'Pending Review', email: 'devadas.k@mcc.edu.in', date: '2026-07-08 14:15',
        answers: [
          { q: 'Faculty Member Name', a: 'Prof. Devadas K.' },
          { q: 'Department', a: 'Physics' },
          { q: 'Research Title', a: 'Quantum Dot Solar Cells for Enhanced Efficiency' },
          { q: 'Estimated Duration', a: '18 Months' },
          { q: 'Required Equipment', a: 'Spectrophotometer, Thin Film Deposition Chamber' }
        ]
      },
      {
        id: 'MIL-104', name: 'Mercy George', form: 'Innovation Grant Application', time: '3 hours ago', status: 'Approved', email: 'mercy.g@mcc.edu.in', date: '2026-07-08 12:30',
        answers: [
          { q: 'Principal Investigator Name', a: 'Mercy George' },
          { q: 'Department / Institution', a: 'Biotechnology' },
          { q: 'Project Title', a: 'Biodegradable Plastic Alternatives from Marine Algae' },
          { q: 'Project Abstract', a: 'Synthesizing bioplastics using seaweed extracts to create a completely biodegradable packaging material.' },
          { q: 'Objectives and Expected Outcomes', a: 'Produce a prototype packaging material that decomposes within 20 days in natural soil.' },
          { q: 'Research Domain', a: 'Sustainability' },
          { q: 'Requested Grant Amount (₹)', a: '₹3,80,000' },
          { q: 'Proposed Project Start Date', a: '2026-09-01' }
        ]
      },
      {
        id: 'MIL-105', name: 'Sanjay Dutt', form: 'Student Course Feedback', time: '5 hours ago', status: 'Completed', email: 'sanjay.d@mcc.edu.in', date: '2026-07-08 10:45',
        answers: [
          { q: 'Student Name', a: 'Sanjay Dutt' },
          { q: 'Course Title', a: 'Organic Chemistry II' },
          { q: 'Instructor', a: 'Prof. John Smith' },
          { q: 'Feedback / Remarks', a: 'The lecture slides were very helpful, but more laboratory demonstrations would be appreciated.' },
          { q: 'Rating (1-5)', a: '4 / 5' }
        ]
      }
    ];

    const localMapped = local.map((s, idx) => ({
      id: s.id || `local-${idx}`,
      name: s.name,
      form: s.form,
      time: s.time || 'Just now',
      status: s.status,
      email: s.email,
      date: s.date,
      answers: s.answers
    }));

    setSubmissions([...localMapped, ...defaultSubs]);

    // Load custom forms and combine
    const custom = JSON.parse(localStorage.getItem('customForms') || '[]');
    const mappedCustom = custom.map(cf => ({
      id: cf.id,
      title: cf.name,
      status: 'Active',
      responses: 0,
      created: cf.created || new Date().toLocaleDateString(),
      creator: cf.creator || 'Super Admin'
    }));

    const defaultForms = [
      { id: '1', title: 'Innovation Grant Application', status: 'Active', responses: 42, created: '2026-06-12', creator: 'Dr. Jane Cooper' },
      { id: '2', title: 'Student Course Feedback', status: 'Active', responses: 128, created: '2026-06-18', creator: 'Prof. John Smith' },
      { id: '3', title: 'MCC Alumni Survey 2026', status: 'Draft', responses: 0, created: '2026-07-01', creator: 'Admin Team' },
      { id: '4', title: 'Workshop Registration Form', status: 'Inactive', responses: 89, created: '2026-05-24', creator: 'Dept of Chemistry' },
      { id: '5', title: 'Faculty Research Proposal', status: 'Active', responses: 15, created: '2026-06-29', creator: 'Dr. Sarah Connor' }
    ];

    const uniqueCustom = mappedCustom.filter(cf => !defaultForms.some(df => df.id === cf.id));
    const combinedForms = [...defaultForms, ...uniqueCustom];

    // Compute dynamic response counts
    const allSubs = [...localMapped, ...defaultSubs];
    const updatedForms = combinedForms.map(f => {
      const subCount = allSubs.filter(s => s.form && s.form.trim().toLowerCase() === f.title.trim().toLowerCase()).length;
      let baseCount = 0;
      if (f.title === 'Innovation Grant Application') baseCount = 40;
      else if (f.title === 'Student Course Feedback') baseCount = 126;
      else if (f.title === 'Workshop Registration Form') baseCount = 89;
      else if (f.title === 'Faculty Research Proposal') baseCount = 14;
      
      return { ...f, responses: baseCount + subCount };
    });

    setForms(updatedForms);
  }, [selectedFormDb, activeMenu]);



  const handleToggleStatus = (id) => {
    setForms(prev => prev.map(f => {
      if (f.id === id) {
        const nextStatus = f.status === 'Active' ? 'Inactive' : 'Active';
        return { ...f, status: nextStatus };
      }
      return f;
    }));
  };

  const handleDeleteForm = (id) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      setForms(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleDeleteSubmission = (id) => {
    if (window.confirm('Are you sure you want to delete this submission? This action cannot be undone.')) {
      const existing = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
      const updated = existing.filter(s => String(s.id) !== String(id));
      localStorage.setItem('formSubmissions', JSON.stringify(updated));
      
      setSubmissions(prev => prev.filter(s => String(s.id) !== String(id)));
      alert('Submission deleted successfully.');
    }
  };

  const handleSaveSubmissionEdit = () => {
    const existing = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    const updated = existing.map(s => {
      if (String(s.id) === String(editingSubmission.id)) {
        return {
          ...s,
          name: editingSubmission.name,
          email: editingSubmission.email,
          status: editingSubmission.status,
          answers: editingSubmission.answers
        };
      }
      return s;
    });
    localStorage.setItem('formSubmissions', JSON.stringify(updated));
    
    setSubmissions(prev => prev.map(s => {
      if (String(s.id) === String(editingSubmission.id)) {
        return {
          ...s,
          name: editingSubmission.name,
          email: editingSubmission.email,
          status: editingSubmission.status,
          answers: editingSubmission.answers
        };
      }
      return s;
    }));
    
    setEditingSubmission(null);
    alert('Submission updated successfully.');
  };

  const todayStr = new Date().toLocaleDateString();
  const todaySubs = submissions.filter(s => {
    if (!s.date) return false;
    return s.date.includes(todayStr) || s.date.includes('Today') || s.time?.includes('ago') || s.time?.includes('mins');
  }).length;

  if (selectedFormDb) {
    const formSubmissions = submissions.filter(s => s.form && s.form.trim().toLowerCase() === selectedFormDb.title.trim().toLowerCase());
    
    let filteredSubs = formSubmissions;
    if (dbSearchQuery) {
      const q = dbSearchQuery.toLowerCase();
      filteredSubs = filteredSubs.filter(sub => 
        sub.id.toLowerCase().includes(q) ||
        sub.name.toLowerCase().includes(q) ||
        sub.email.toLowerCase().includes(q) ||
        sub.answers.some(ans => ans.a.toLowerCase().includes(q))
      );
    }
    
    if (dateFilter !== 'all') {
      const today = new Date();
      filteredSubs = filteredSubs.filter(sub => {
        if (dateFilter === 'today') {
          return sub.date && (sub.date.includes(today.toLocaleDateString()) || sub.date.includes('Today') || sub.time?.includes('ago') || sub.time?.includes('mins'));
        }
        if (dateFilter === 'yesterday') {
          return sub.date && (sub.date.includes(new Date(today - 86400000).toLocaleDateString()) || sub.date.includes('Yesterday'));
        }
        return true;
      });
    }

    if (sortBy === 'latest') {
      filteredSubs.sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')));
    } else if (sortBy === 'oldest') {
      filteredSubs.sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')));
    } else if (sortBy === 'name') {
      filteredSubs.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    }

    const headers = [...getColumnHeaders(selectedFormDb.title), 'Actions'];

    return (
      <div className="admin-db-layout anim-fade-in" style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
        {/* Left Sidebar */}
        <aside className="db-sidebar" style={{ width: '280px', background: 'white', borderRight: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div className="db-sidebar-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <img src="/mcc-mrf-logo.png?v=2" alt="MCC Logo" style={{ height: '40px', width: '40px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>MCC-MRF Portal</div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b' }}>Database Explorer</div>
            </div>
          </div>

          <button 
            onClick={() => setSelectedFormDb(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', color: '#475569', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s', width: '100%' }}
          >
            ← Back to Overview
          </button>

          <div style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Other Form Databases</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {forms.map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFormDb(f);
                  setDbSearchQuery('');
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  background: f.id === selectedFormDb.id ? '#7B1C1C' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: f.id === selectedFormDb.id ? 'white' : '#475569',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  width: '100%'
                }}
              >
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginRight: '8px' }}>{f.title}</span>
                <span style={{ fontSize: '11px', padding: '2px 6px', background: f.id === selectedFormDb.id ? 'rgba(255,255,255,0.2)' : '#e2e8f0', borderRadius: '10px', color: f.id === selectedFormDb.id ? 'white' : '#64748b' }}>{f.responses}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{selectedFormDb.title} Submissions</h2>
              <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px' }}>Managing {filteredSubs.length} response records dynamically</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => {
                  if (filteredSubs.length === 0) {
                    alert('No submissions available to export.');
                    return;
                  }
                  const csvHeaders = headers.join(',');
                  const csvRows = filteredSubs.map(row => {
                    const cells = getRowCells(row, selectedFormDb.title);
                    return [
                      cells.col1,
                      `"${cells.col2}"`,
                      cells.col3,
                      cells.col4,
                      `"${cells.col5}"`,
                      `"${cells.col6}"`,
                      `"${cells.col7.title} - ${cells.col7.sub}"`,
                      cells.col8
                    ].join(',');
                  });
                  const csvContent = "data:text/csv;charset=utf-8," + [csvHeaders, ...csvRows].join("\n");
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `${selectedFormDb.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_submissions.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '10px', color: '#334155', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                📥 Export CSV
              </button>
              <a 
                href={`/form/${selectedFormDb.id}`}
                target="_blank"
                rel="noreferrer"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#7B1C1C', border: 'none', borderRadius: '10px', color: 'white', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                ➕ Register Form
              </a>
            </div>
          </div>

          {/* Controls Bar: Search, Date Filter, Sort */}
          <div className="db-controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px', flex: 1, minWidth: '240px' }}>
              <span style={{ color: '#94a3b8' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Search submission records by name, email, details..." 
                value={dbSearchQuery}
                onChange={e => setDbSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '13.5px', color: '#1e293b' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Date:</span>
                <select 
                  value={dateFilter} 
                  onChange={e => setDateFilter(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', color: '#334155', background: 'white', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#64748b' }}>Sort:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', fontSize: '13px', color: '#334155', background: 'white', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="latest">Latest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Database Card-Table Strip Layout */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Table Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1.2fr 1fr 1fr 90px 90px 2fr 1.2fr 100px', gap: '16px', padding: '12px 20px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '10px', fontSize: '11px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {headers.map((h, idx) => (
                <div key={idx} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: h === 'Actions' ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>

            {/* Table Body Card Strips */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredSubs.map((row, idx) => {
                const cells = getRowCells(row, selectedFormDb.title);
                return (
                  <div 
                    key={idx}
                    onClick={() => setSelectedSubmission(row)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1.2fr 1fr 1fr 90px 90px 2fr 1.2fr 100px',
                      gap: '16px',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      fontSize: '13.5px',
                      color: '#334155'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <div>
                      <span style={{ display: 'inline-block', background: '#1e293b', color: '#f8fafc', padding: '4px 8px', borderRadius: '6px', fontSize: '10.5px', fontWeight: '800' }}>
                        {cells.col1}
                      </span>
                    </div>
                    
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>
                      {cells.col2}
                    </div>
                    
                    <div style={{ fontWeight: '500' }}>{cells.col3}</div>
                    
                    <div style={{ fontWeight: '500' }}>{cells.col4}</div>
                    
                    <div>
                      <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                        {cells.col5}
                      </span>
                    </div>
                    
                    <div style={{ fontWeight: '500' }}>{cells.col6}</div>
                    
                    <div>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '13px' }}>{cells.col7.title}</div>
                      <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{cells.col7.sub}</div>
                    </div>
                    
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {cells.col8 && cells.col8 !== '—' ? (
                        <span style={{ color: '#2563eb', fontWeight: '600' }}>{cells.col8}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubmission(row);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '4px' }}
                        title="Edit Record"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubmission(row.id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '4px' }}
                        title="Delete Record"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredSubs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '64px 20px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#94a3b8' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '12px' }}>📥</span>
                  No submission records match the current filters.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const filteredForms = forms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src="/mcc-mrf-logo.png?v=2" alt="MCC Logo" className="admin-logo" />
          <div className="admin-logo-text">Admin Portal</div>
        </div>

        <nav className="admin-nav-links">
          <button
            className={`admin-nav-item${activeMenu === 'overview' ? ' active' : ''}`}
            onClick={() => setActiveMenu('overview')}
          >
            📊 Dashboard Overview
          </button>
          <button
            className={`admin-nav-item${activeMenu === 'forms' ? ' active' : ''}`}
            onClick={() => setActiveMenu('forms')}
          >
            📋 Manage Forms
          </button>
          <button
            className={`admin-nav-item${activeMenu === 'responses' ? ' active' : ''}`}
            onClick={() => setActiveMenu('responses')}
          >
            📥 Submissions Feed
          </button>
          <button
            className={`admin-nav-item${activeMenu === 'settings' ? ' active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            ⚙️ System Settings
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-back-btn">
            🏠 Back to Home
          </Link>
        </div>
      </aside>

      {/* ── Main Content Panel ── */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-title-wrap">
            <h2>MCC-MRF Portal Admin</h2>
            <p>Control center for Madras Christian College form management</p>
          </div>
          <div className="admin-profile-badge">
            <span className="profile-avatar">🛡️</span>
            <div>
              <div className="profile-name">Administrator</div>
              <div className="profile-role">Super Admin</div>
            </div>
          </div>
        </header>

        {/* ── OVERVIEW MENU TAB ── */}
        {activeMenu === 'overview' && (
          <div className="admin-tab-content anim-fade-in">
            {/* Quick Stats Grid */}
            <div className="admin-stats-grid">
              <div className="stat-card">
                <div className="stat-icon forms-icon">📋</div>
                <div className="stat-details">
                  <span className="stat-label">Total Templates</span>
                  <span className="stat-value">{forms.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon responses-icon">📥</div>
                <div className="stat-details">
                  <span className="stat-label">Total Submissions</span>
                  <span className="stat-value">{submissions.length}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon rate-icon">📈</div>
                <div className="stat-details">
                  <span className="stat-label">Today's Submissions</span>
                  <span className="stat-value">{todaySubs}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon active-icon">⚡</div>
                <div className="stat-details">
                  <span className="stat-label">Active Forms</span>
                  <span className="stat-value">{forms.filter(f => f.status === 'Active').length}</span>
                </div>
              </div>
            </div>

            {/* Form Submissions Databases Card Grid */}
            <div className="admin-content-card" style={{ marginTop: '24px', marginBottom: '24px' }}>
              <div className="card-header">
                <h3>Form Submissions Databases</h3>
                <span className="card-subtitle">Select any form database below to view, filter, export, and manage its submitted data records.</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {forms.map(form => (
                  <div 
                    key={form.id} 
                    className="db-form-card"
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    }}
                    onClick={() => setSelectedFormDb(form)}
                  >
                    {/* Top Status Border Accent */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: form.status === 'Active' ? '#7B1C1C' : '#94a3b8' }} />
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <span style={{ fontSize: '24px' }}>📋</span>
                        <span className={`status-badge ${form.status.toLowerCase()}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px' }}>
                          {form.status}
                        </span>
                      </div>
                      
                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', lineHeight: '1.4' }}>
                        {form.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                        Created by {form.creator} on {form.created}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px', marginTop: '12px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#475569' }}>
                        📊 {form.responses} Submissions
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#7B1C1C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View DB →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Dashboard Panel Layout */}
            <div className="admin-panel-row">
              {/* Recent Activity Card */}
              <div className="admin-content-card flex-2">
                <div className="card-header">
                  <h3>Recent Submissions Activity</h3>
                  <button className="card-action-link" onClick={() => setActiveMenu('responses')}>View Feed</button>
                </div>
                <div className="submissions-list">
                  {submissions.slice(0, 4).map(sub => (
                    <div key={sub.id} className="sub-row-item">
                      <div className="sub-avatar">👤</div>
                      <div className="sub-info">
                        <div className="sub-name">{sub.name}</div>
                        <div className="sub-form-title">submitted to <strong>{sub.form}</strong></div>
                      </div>
                      <div className="sub-meta">
                        <span className="sub-time">{sub.time}</span>
                        <span className={`sub-status-badge ${sub.status.toLowerCase().replace(' ', '-')}`}>
                          {sub.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="admin-content-card flex-1">
                <div className="card-header">
                  <h3>Quick Admin Tasks</h3>
                </div>
                <div className="quick-tasks-list">
                  <button className="task-btn" onClick={() => navigate('/templates')}>
                    ➕ Create New Form Template
                  </button>
                  <button className="task-btn outline" onClick={() => setActiveMenu('settings')}>
                    🔑 Manage Institutional Keys
                  </button>
                  <button className="task-btn outline" onClick={() => setActiveMenu('forms')}>
                    📂 Pause All Active Surveys
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FORMS TAB ── */}
        {activeMenu === 'forms' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="admin-content-card">
              <div className="card-header forms-header-row">
                <h3>All Managed Forms</h3>
                <div className="forms-search-box">
                  🔍
                  <input
                    type="text"
                    placeholder="Search forms by name or department..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Form Title</th>
                    <th>Created By</th>
                    <th>Date Created</th>
                    <th>Total Responses</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map(f => (
                    <tr key={f.id}>
                      <td className="table-form-title">
                        <strong>{f.title}</strong>
                      </td>
                      <td>{f.creator}</td>
                      <td>{f.created}</td>
                      <td>
                        <button
                          onClick={() => setSelectedFormDb(f)}
                          style={{
                            background: '#f1f5f9',
                            border: 'none',
                            color: '#7B1C1C',
                            fontWeight: 'bold',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                        >
                          👁️ {f.responses} responses
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${f.status.toLowerCase()}`}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-wrap">
                          <button
                            className="table-action-btn toggle"
                            onClick={() => handleToggleStatus(f.id)}
                            title={f.status === 'Active' ? 'Deactivate Form' : 'Activate Form'}
                          >
                            {f.status === 'Active' ? '⏸️ Pause' : '▶️ Resume'}
                          </button>
                          <button
                            className="table-action-btn delete"
                            onClick={() => handleDeleteForm(f.id)}
                            title="Delete Form"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredForms.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px 0', color: '#999' }}>
                        No forms found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── SUBMISSIONS TAB ── */}
        {activeMenu === 'responses' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="admin-content-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>Live Submissions Feed</h3>
                  <span className="card-subtitle">Real-time answers across all active MCC forms</span>
                </div>
                <div className="forms-search-box" style={{ width: '300px', margin: 0 }}>
                  🔍
                  <input
                    type="text"
                    placeholder="Filter submissions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="submissions-list full-list">
                {submissions
                  .filter(sub => 
                    sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    sub.form.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    sub.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => b.id.toString().localeCompare(a.id.toString()))
                  .map(sub => (
                    <div key={sub.id} className="sub-row-item expanded">
                      <div className="sub-avatar">👤</div>
                      <div className="sub-info">
                        <div className="sub-name">{sub.name}</div>
                        <div className="sub-form-title">submitted answers to <strong>{sub.form}</strong></div>
                        <span className="sub-time">Received {sub.time || sub.date}</span>
                      </div>
                      <div className="sub-right-section">
                        <span className={`sub-status-badge ${sub.status.toLowerCase().replace(' ', '-')}`}>
                          {sub.status}
                        </span>
                        <button className="sub-detail-btn" onClick={() => setSelectedSubmission(sub)}>
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SYSTEM SETTINGS TAB ── */}
        {activeMenu === 'settings' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="admin-panel-row">
              {/* Institution Identity Card */}
              <div className="admin-content-card flex-1">
                <div className="card-header">
                  <h3>Institution Profile</h3>
                </div>
                <div className="settings-form">
                  <div className="settings-field">
                    <label>Institution Name</label>
                    <input type="text" className="settings-input" defaultValue="Madras Christian College" />
                  </div>
                  <div className="settings-field">
                    <label>Domain Lock</label>
                    <input type="text" className="settings-input" defaultValue="mcc.edu.in" placeholder="e.g. mcc.edu.in" />
                    <span className="field-help">Limits account creation to users with this email domain.</span>
                  </div>
                  <button className="save-settings-btn" onClick={() => alert('Settings Saved Successfully!')}>
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Security & Access Controls */}
              <div className="admin-content-card flex-1">
                <div className="card-header">
                  <h3>Security & Access Controls</h3>
                </div>
                <div className="controls-list">
                  <div className="control-row">
                    <div>
                      <div className="control-title">Allow Public Forms</div>
                      <div className="control-desc">Enable form creation that doesn't require MCC credentials.</div>
                    </div>
                    <input type="checkbox" defaultChecked className="admin-toggle" />
                  </div>
                  <div className="control-row">
                    <div>
                      <div className="control-title">Require 2FA for Admins</div>
                      <div className="control-desc">Enforce two-factor authentication for administrative tasks.</div>
                    </div>
                    <input type="checkbox" className="admin-toggle" />
                  </div>
                  <div className="control-row">
                    <div>
                      <div className="control-title">Auto-archive Responses</div>
                      <div className="control-desc">Automatically archive responses that are older than 1 year.</div>
                    </div>
                    <input type="checkbox" defaultChecked className="admin-toggle" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Submission Details Modal ── */}
      {selectedSubmission && (
        <div className="admin-modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Submission from {selectedSubmission.name}</h3>
                <span className="admin-modal-subtitle">{selectedSubmission.form} — {selectedSubmission.date}</span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedSubmission(null)}>✕</button>
            </div>

            <div className="admin-modal-body">
              <div className="sender-meta-box">
                <div><strong>Email:</strong> {selectedSubmission.email}</div>
                <div><strong>Submitted At:</strong> {selectedSubmission.date}</div>
              </div>

              <div className="answers-list-wrapper">
                <h4>Questions & Senders Answers:</h4>
                {selectedSubmission.answers.map((ans, idx) => (
                  <div key={idx} className="answer-card-item">
                    <div className="answer-q-label">{ans.q}</div>
                    <div className="answer-a-val">{ans.a}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn-secondary" onClick={() => setSelectedSubmission(null)}>Close View</button>
              <button className="admin-btn-primary" onClick={() => { alert('Action registered (Approved/Completed)'); setSelectedSubmission(null); }}>
                Mark as Reviewed ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Submission Modal ── */}
      {editingSubmission && (
        <div className="admin-modal-overlay" onClick={() => setEditingSubmission(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="admin-modal-header">
              <div>
                <h3>Edit Submission Record</h3>
                <span className="admin-modal-subtitle">ID: {editingSubmission.id} • {editingSubmission.form}</span>
              </div>
              <button className="admin-modal-close" onClick={() => setEditingSubmission(null)}>✕</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveSubmissionEdit();
            }}>
              <div className="admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Core Submitter Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="settings-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Submitter Name</label>
                    <input 
                      type="text" 
                      className="pf-input"
                      style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                      required
                      value={editingSubmission.name || ''}
                      onChange={e => setEditingSubmission({ ...editingSubmission, name: e.target.value })}
                    />
                  </div>
                  <div className="settings-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Submitter Email</label>
                    <input 
                      type="email" 
                      className="pf-input"
                      style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                      required
                      value={editingSubmission.email || ''}
                      onChange={e => setEditingSubmission({ ...editingSubmission, email: e.target.value })}
                    />
                  </div>
                </div>
                
                {/* Submission Status */}
                <div className="settings-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Review Status</label>
                  <select 
                    className="pf-select"
                    style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', background: 'white' }}
                    value={editingSubmission.status || 'Pending Review'}
                    onChange={e => setEditingSubmission({ ...editingSubmission, status: e.target.value })}
                  >
                    <option value="Pending Review">Pending Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Completed">Completed</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Answers list */}
                <div style={{ marginTop: '12px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>Form Answers</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
                    {(editingSubmission.answers || []).map((ans, idx) => (
                      <div key={idx} className="settings-field" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{ans.q}</label>
                        <input 
                          type="text" 
                          className="pf-input"
                          style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                          value={ans.a || ''}
                          onChange={e => {
                            const nextAns = [...editingSubmission.answers];
                            nextAns[idx] = { ...ans, a: e.target.value };
                            setEditingSubmission({ ...editingSubmission, answers: nextAns });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setEditingSubmission(null)}>Cancel</button>
                <button type="submit" className="admin-btn-primary">Save Changes ✓</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Form Summary Reports Modal ── */}
      {selectedFormSummary && (
        <div className="admin-modal-overlay" onClick={() => setSelectedFormSummary(null)}>
          <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3>Responses Report Summary</h3>
                <span className="admin-modal-subtitle">{selectedFormSummary.title}</span>
              </div>
              <button className="admin-modal-close" onClick={() => setSelectedFormSummary(null)}>✕</button>
            </div>

            <div className="admin-modal-body">
              <div className="summary-total-header">
                <span className="summary-total-val">{selectedFormSummary.total}</span>
                <span className="summary-total-lbl">Total Responses Received</span>
              </div>

              {selectedFormSummary.total > 0 ? (
                <>
                  <div className="summary-breakdown-section">
                    <h4>Responses Breakdown</h4>
                    <div className="summary-bar-chart">
                      {selectedFormSummary.breakdown.map((row, idx) => (
                        <div key={idx} className="summary-chart-row">
                          <div className="chart-row-label">{row.label}</div>
                          <div className="chart-row-track">
                            <div className="chart-row-fill" style={{ width: row.pct }} />
                          </div>
                          <div className="chart-row-value">{row.count} ({row.pct})</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="summary-recent-section" style={{ marginTop: '24px' }}>
                    <h4>Recent Submissions list</h4>
                    <div className="summary-recent-list">
                      {selectedFormSummary.recent.map((rec, idx) => (
                        <div key={idx} className="summary-recent-row">
                          <strong>{rec.name}</strong>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>Submitted {rec.date}</span>
                          <span className="status-badge active" style={{ fontSize: '10px', padding: '2px 6px' }}>{rec.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  No responses have been submitted to this form yet. Share the form link to start collecting answers!
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn-secondary" style={{ width: '100%' }} onClick={() => setSelectedFormSummary(null)}>
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
