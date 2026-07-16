import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import AdminFormManagement from './AdminFormManagement';
import './AdminDashboard.css';

const hashPassword = (password) => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash = hash & hash;
  }
  return 'hash_' + Math.abs(hash).toString(16);
};

const DEFAULT_PERMISSIONS = [
  {
    role: 'Admin',
    color: '#7B1C1C',
    manageUsers: 'Allowed',
    manageForms: 'Allowed',
    moderateSubmissions: 'Allowed',
    submitSubmissions: 'Allowed',
    settingsAccess: 'Allowed'
  },
  {
    role: 'Department Head',
    manageUsers: 'Denied',
    manageForms: 'Allowed (Dept Only)',
    moderateSubmissions: 'Allowed',
    submitSubmissions: 'Allowed',
    settingsAccess: 'Denied'
  },
  {
    role: 'Faculty',
    manageUsers: 'Denied',
    manageForms: 'Allowed (Dept Only)',
    moderateSubmissions: 'Allowed (Own Forms)',
    submitSubmissions: 'Allowed',
    settingsAccess: 'Denied'
  },
  {
    role: 'Student',
    manageUsers: 'Denied',
    manageForms: 'Denied',
    moderateSubmissions: 'Denied',
    submitSubmissions: 'Allowed',
    settingsAccess: 'Denied'
  }
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const formatName = (str) => {
    if (!str) return '—';
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatLastActive = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(',', ' •');
    } catch (e) {
      return dateStr;
    }
  };

  // Navigation Tabs
  const [activeMenu, setActiveMenu] = useState('overview'); // overview, users, roles, departments, forms, submissions, reports, announcements, notifications, logs, settings, profile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(true); // Collapsible sub-menu for User Management
  const [searchQuery, setSearchQuery] = useState('');

  // Permissions Matrix State
  const [permissions, setPermissions] = useState(() => {
    const saved = localStorage.getItem('portalPermissions');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });

  const handlePermissionChange = (roleIndex, field, value) => {
    const updated = [...permissions];
    updated[roleIndex] = { ...updated[roleIndex], [field]: value };
    setPermissions(updated);
    localStorage.setItem('portalPermissions', JSON.stringify(updated));
    logAction('System', `Updated ${field} permission for ${updated[roleIndex].role} to: ${value}`);
  };

  // Data States (loaded from localStorage or initialized with defaults)
  const [admins, setAdmins] = useState([]); // Dynamic list of admins/users
  const [users, setUsers] = useState([]); // Dynamic list of all users
  const [departments, setDepartments] = useState([]);
  const [forms, setForms] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loginActivity, setLoginActivity] = useState([]);

  const handleDownloadSubCSV = (sub) => {
    const headers = ['Question', 'Answer'];
    const rows = (sub.answers || []).map(ans => {
      const qText = ans.q ? ans.q.toString() : '';
      const aText = ans.a ? ans.a.toString() : '';
      return `"${qText.replace(/"/g, '""')}","${aText.replace(/"/g, '""')}"`;
    });

    const metadata = [
      `"Submission ID","${sub.id || ''}"`,
      `"Submitter Name","${sub.name || ''}"`,
      `"Email Address","${sub.email || ''}"`,
      `"Form Name","${sub.form || ''}"`,
      `"Date Submitted","${sub.date || ''}"`,
      `""`,
      `""`
    ];

    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent([metadata.join('\n'), headers.join(','), ...rows].join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", csvContent);
    downloadAnchor.setAttribute("download", `submission-${sub.id || 'export'}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadSubPDF = (sub) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is enabled! Please allow pop-ups for this site to generate the PDF report.');
      return;
    }

    const answersHtml = (sub.answers || []).map(ans => {
      const q = ans.q || '';
      const a = ans.a || '—';
      return '<div class="answer-card"><strong>' + q + '</strong><p>' + a + '</p></div>';
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Submission Details - ${sub.id}</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              color: #1e293b;
            }
            .header {
              border-bottom: 2px solid #800000;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #800000;
              font-size: 24px;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .meta-item strong {
              color: #475569;
              display: block;
              font-size: 13px;
              margin-bottom: 4px;
            }
            .meta-item p {
              margin: 0;
              font-weight: 600;
              font-size: 15px;
            }
            .answers-section h2 {
              font-size: 18px;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            .answer-card {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .answer-card strong {
              display: block;
              color: #334155;
              font-size: 14px;
              margin-bottom: 6px;
            }
            .answer-card p {
              margin: 0;
              background: #f8fafc;
              padding: 12px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
              font-size: 14px;
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MCC-MRF Innovation Park - Submission Report</h1>
            <p style="margin: 5px 0 0 0; color: #64748b;">ID: ${sub.id} | Form: ${sub.form}</p>
          </div>
          
          <div class="meta-grid">
            <div class="meta-item">
              <strong>Submitter Name</strong>
              <p>${sub.name}</p>
            </div>
            <div class="meta-item">
              <strong>Email Address</strong>
              <p>${sub.email}</p>
            </div>
            <div class="meta-item">
              <strong>Form Name</strong>
              <p>${sub.form}</p>
            </div>
            <div class="meta-item">
              <strong>Date Submitted</strong>
              <p>${sub.date || new Date().toISOString()}</p>
            </div>
          </div>
          
          <div class="answers-section">
            <h2>Field Answers</h2>
            ${answersHtml}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    emailNotifications: true,
    requireApproval: false,
    analyticsInterval: 'Daily',
  });

  // Profile State
  const [profileData, setProfileData] = useState({
    name: 'MCC Administrator',
    email: 'admin@mcc.edu.in',
    role: 'Admin',
    avatar: '👤',
    joined: '2025-01-10'
  });
  const [originalEmail, setOriginalEmail] = useState('');

  // Modal States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingDept, setEditingDept] = useState(null);

  // Submission Modal States
  const [editingSub, setEditingSub] = useState(null);
  const [subEditData, setSubEditData] = useState({ name: '', email: '', status: '' });
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    role: 'Student',
    dept: 'Computer Science',
    status: 'Active'
  });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    hod: '',
    formsCount: 0,
    membersCount: 0
  });

  const [pwdData, setPwdData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    target: 'All'
  });

  // Theme state: dark/light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('adminTheme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('adminTheme', theme);
  }, [theme]);

  // Submission Detail View
  const [selectedSub, setSelectedSub] = useState(null);

  // Toast and Custom Confirm States
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToastMessage = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const triggerConfirm = (message, onConfirm) => {
    setConfirmModal({ message, onConfirm });
  };

  // Stats
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    totalForms: 0,
    activeAdminsCount: 0,
    totalUsersCount: 0,
    activeAnnouncements: 0
  });

  // Profile details loader from session
  useEffect(() => {
    const email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || 'admin@mcc.edu.in';
    const role = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'admin';
    const name = sessionStorage.getItem('userName') || localStorage.getItem('userName') || 'MCC Administrator';
    const joined = sessionStorage.getItem('userJoined') || localStorage.getItem('userJoined') || '2025-01-10';

    setOriginalEmail(email);
    setProfileData(prev => ({
      ...prev,
      email: email,
      name: name,
      joined: joined,
      role: 'Admin'
    }));
  }, []);

  // Initial Data Setup
  useEffect(() => {
    // 1. Load All Users (students, faculty, admins)
    const savedUsers = localStorage.getItem('appUsers');
    let userList = [];
    if (savedUsers) {
      userList = JSON.parse(savedUsers);
      let needsSave = false;
      userList = userList.map(u => {
        if (u.name === 'Department Admin') {
          needsSave = true;
          return { ...u, name: 'Admin' };
        }
        return u;
      });
      if (needsSave) {
        localStorage.setItem('appUsers', JSON.stringify(userList));
      }
    } else {
      userList = [
        { id: 1, name: 'Dr. Jane Cooper', email: 'cooper.jane@mcc.edu.in', role: 'admin', dept: 'Computer Science', status: 'Active' },
        { id: 2, name: 'Prof. John Smith', email: 'smith.john@mcc.edu.in', role: 'admin', dept: 'Chemistry', status: 'Active' },
        { id: 3, name: 'Dr. Sarah Connor', email: 'connor.sarah@mcc.edu.in', role: 'admin', dept: 'Biotechnology', status: 'Active' },
        { id: 4, name: 'Arun Kumar', email: 'arun.k@mcc.edu.in', role: 'user', dept: 'Computer Science', status: 'Active' },
        { id: 5, name: 'Priya Sharma', email: 'priya.s@mcc.edu.in', role: 'user', dept: 'Computer Science', status: 'Active' },
        { id: 6, name: 'Devadas K.', email: 'devadas.k@mcc.edu.in', role: 'admin', dept: 'Physics', status: 'Active' },
        { id: 7, name: 'Mercy George', email: 'mercy.g@mcc.edu.in', role: 'admin', dept: 'Biotechnology', status: 'Active' },
        { id: 8, name: 'Sanjay Dutt', email: 'sanjay.d@mcc.edu.in', role: 'user', dept: 'Chemistry', status: 'Suspended' }
      ];
      localStorage.setItem('appUsers', JSON.stringify(userList));
    }
    setUsers(userList);

    // Sync appAdmins for Auth.jsx fallback checks
    const adminList = userList.filter(u => u.role === 'admin');
    localStorage.setItem('appAdmins', JSON.stringify(adminList));
    setAdmins(adminList);

    // 2. Load Departments
    const savedDepts = localStorage.getItem('appDepartments');
    let deptList = [];
    if (savedDepts) {
      deptList = JSON.parse(savedDepts);
    } else {
      deptList = [
        { id: 1, name: 'Computer Science', hod: 'Dr. Jane Cooper', formsCount: 4, membersCount: 154 },
        { id: 2, name: 'Chemistry', hod: 'Prof. John Smith', formsCount: 2, membersCount: 98 },
        { id: 3, name: 'Biotechnology', hod: 'Dr. Sarah Connor', formsCount: 3, membersCount: 82 },
        { id: 4, name: 'Physics', hod: 'Dr. Devadas K.', formsCount: 2, membersCount: 110 }
      ];
      localStorage.setItem('appDepartments', JSON.stringify(deptList));
    }
    setDepartments(deptList);

    // 3. Load Forms
    let customForms = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('customForms_')) {
        try {
          const parsed = JSON.parse(localStorage.getItem(key));
          if (Array.isArray(parsed)) {
            customForms = [...customForms, ...parsed];
          }
        } catch (e) { }
      }
    }

    const mappedCustom = customForms.map(cf => ({
      id: cf.id,
      title: cf.name || cf.title || 'Untitled Form',
      status: 'Active',
      created: cf.created || new Date().toLocaleDateString(),
      creator: cf.creator || 'Admin'
    }));

    const defaultForms = [
      { id: '1', title: 'Innovation Grant Application', status: 'Active', created: '2026-06-12', creator: 'Dr. Jane Cooper' },
      { id: '2', title: 'Student Course Feedback', status: 'Active', created: '2026-06-18', creator: 'Prof. John Smith' },
      { id: '3', title: 'MCC Alumni Survey 2026', status: 'Draft', created: '2026-07-01', creator: 'Admin Team' },
      { id: '4', title: 'Workshop Registration Form', status: 'Inactive', created: '2026-05-24', creator: 'Dept of Chemistry' },
      { id: '5', title: 'Faculty Research Proposal', status: 'Active', created: '2026-06-29', creator: 'Dr. Sarah Connor' }
    ];

    const uniqueCustom = mappedCustom.filter(cf => !defaultForms.some(df => df.id === cf.id));
    const combinedForms = [...defaultForms, ...uniqueCustom];
    setForms(combinedForms);

    // 4. Load Submissions
    const localSubs = JSON.parse(localStorage.getItem('formSubmissions') || '[]');
    let sanitized = false;
    const sortedSubs = [...localSubs].reverse();
    let nextSeq = 6;
    const sanitizedLocalSubs = sortedSubs.map(s => {
      const expectedId = `MMIP-${nextSeq < 10 ? '0' + nextSeq : nextSeq}`;
      let updatedItem = s;
      if (s.id !== expectedId) {
        sanitized = true;
        updatedItem = { ...s, id: expectedId };
      }
      nextSeq++;
      return updatedItem;
    }).reverse();
    if (sanitized) {
      localStorage.setItem('formSubmissions', JSON.stringify(sanitizedLocalSubs));
    }

    const defaultSubs = [
      { id: 'MMIP-05', name: 'Arun Kumar', form: 'Innovation Grant Application', date: '2026-07-08 15:42', status: 'Pending Review', email: 'arun.k@mcc.edu.in', answers: [{ q: 'Project Title', a: 'AI Agricultural Drone' }, { q: 'Amount', a: '₹4,50,000' }] },
      { id: 'MMIP-04', name: 'Priya Sharma', form: 'Student Course Feedback', date: '2026-07-08 15:28', status: 'Completed', email: 'priya.s@mcc.edu.in', answers: [{ q: 'Course', a: 'Data Structures' }, { q: 'Rating', a: '5/5' }] },
      { id: 'MMIP-03', name: 'Devadas K.', form: 'Faculty Research Proposal', date: '2026-07-08 14:15', status: 'Pending Review', email: 'devadas.k@mcc.edu.in', answers: [{ q: 'Title', a: 'Quantum Cells solar' }] },
      { id: 'MMIP-02', name: 'Mercy George', form: 'Innovation Grant Application', date: '2026-07-08 12:30', status: 'Approved', email: 'mercy.g@mcc.edu.in', answers: [{ q: 'Project', a: 'Biodegradable seaweed plastic' }] },
      { id: 'MMIP-01', name: 'Sanjay Dutt', form: 'Student Course Feedback', date: '2026-07-08 10:45', status: 'Completed', email: 'sanjay.d@mcc.edu.in', answers: [{ q: 'Course', a: 'Chemistry II' }] }
    ];
    const combinedSubmissions = [...sanitizedLocalSubs, ...defaultSubs];
    setSubmissions(combinedSubmissions);

    // 5. Load Announcements
    const savedAnnouncements = localStorage.getItem('appAnnouncements');
    let announcementList = [];
    if (savedAnnouncements) {
      announcementList = JSON.parse(savedAnnouncements);
    } else {
      announcementList = [
        { id: 1, title: 'Innovation Grants 2026 Extended', content: 'The final submission window for innovation research grants is extended until July 25th, 2026. Submit through the Portal.', target: 'All', date: '2026-07-08' },
        { id: 2, title: 'Annual Course Assessment Feedbacks', content: 'Faculty members are requested to publish their respective course feedback forms for current semester students.', target: 'Faculty', date: '2026-07-05' }
      ];
      localStorage.setItem('appAnnouncements', JSON.stringify(announcementList));
    }
    setAnnouncements(announcementList);

    // 6. Load Notifications
    const savedNotifications = localStorage.getItem('appNotifications');
    let notificationList = [];
    if (savedNotifications) {
      notificationList = JSON.parse(savedNotifications);
    } else {
      notificationList = [
        { id: 1, text: 'New student registration: Arun Kumar', time: '10 mins ago', type: 'Registration' },
        { id: 2, text: 'Submission flagged: MMIP-05 has incomplete fields', time: '1 hour ago', type: 'System' },
        { id: 3, text: 'New custom template submitted for moderation: Alumni Survey', time: '1 day ago', type: 'Form' }
      ];
      localStorage.setItem('appNotifications', JSON.stringify(notificationList));
    }
    setNotifications(notificationList);

    // 7. Load Audit Logs
    const savedLogs = localStorage.getItem('systemLogs');
    let logList = [];
    if (savedLogs) {
      logList = JSON.parse(savedLogs);
    } else {
      logList = [
        { time: '2026-07-09 15:42:15', type: 'System', text: 'Admin session initiated.' },
        { time: '2026-07-09 14:15:22', type: 'Form', text: 'Form Submission received for Innovation Grant Application.' },
        { time: '2026-07-09 10:45:00', type: 'Admin', text: 'Admin account Dr. Jane Cooper verified.' },
        { time: '2026-07-09 09:30:10', type: 'Setting', text: 'System settings synced with cloud storage.' }
      ];
      localStorage.setItem('systemLogs', JSON.stringify(logList));
    }

    const savedLoginActivity = JSON.parse(localStorage.getItem('loginActivity') || '[]');
    setLoginActivity(savedLoginActivity);
    const loginLogs = savedLoginActivity.map(act => ({
      time: act.login_time,
      type: 'Auth',
      text: `${act.name} (${act.email}) signed in successfully.`
    }));

    const combinedLogs = [...logList, ...loginLogs].sort((a, b) => new Date(b.time) - new Date(a.time));
    setLogs(combinedLogs);

    // Compute Stats
    setStats({
      totalSubmissions: combinedSubmissions.length,
      totalForms: combinedForms.length,
      activeAdminsCount: userList.filter(u => (u.status === 'Active' || u.account_status === 'Active') && u.role === 'admin').length,
      totalUsersCount: userList.length,
      activeAnnouncements: announcementList.length
    });

    // Load Settings
    const savedSettings = localStorage.getItem('globalSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Helper to log actions
  const logAction = (type, text) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newLog = { time: timestamp, type, text };
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);
    localStorage.setItem('systemLogs', JSON.stringify(updatedLogs));
  };

  // CRUD User Management
  const openAddUserModal = () => {
    setEditingUser(null);
    setUserFormData({ name: '', email: '', role: 'Student', dept: 'Computer Science', status: 'Active' });
    setShowUserModal(true);
  };

  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserFormData({ name: user.name, email: user.email, role: user.role, dept: user.dept, status: user.status });
    setShowUserModal(true);
  };

  const handleUserFormSubmit = (e) => {
    e.preventDefault();
    let updatedUsers = [];
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? { ...u, ...userFormData } : u);
      logAction('Admin', `Updated user profile for ${userFormData.name} (${userFormData.email}).`);
      showToastMessage(`User profile for "${userFormData.name}" updated.`);
    } else {
      const newUser = { id: Date.now(), ...userFormData };
      updatedUsers = [...users, newUser];
      logAction('Admin', `Registered new user: ${userFormData.name} (${userFormData.role}) under ${userFormData.dept}.`);
      showToastMessage(`Registered new user "${userFormData.name}".`);
    }
    setUsers(updatedUsers);
    localStorage.setItem('appUsers', JSON.stringify(updatedUsers));

    // Sync admins list
    const adminList = updatedUsers.filter(u => u.role === 'admin');
    localStorage.setItem('appAdmins', JSON.stringify(adminList));
    setAdmins(adminList);

    setStats(prev => ({
      ...prev,
      totalUsersCount: updatedUsers.length,
      activeAdminsCount: adminList.filter(a => a.status === 'Active' || a.account_status === 'Active').length
    }));
    setShowUserModal(false);
  };

  const handleDeleteUser = (id, name) => {
    triggerConfirm(`Are you sure you want to permanently delete user: ${name}?`, () => {
      const updatedUsers = users.filter(u => u.id !== id);
      setUsers(updatedUsers);
      localStorage.setItem('appUsers', JSON.stringify(updatedUsers));

      const adminList = updatedUsers.filter(u => u.role === 'admin');
      localStorage.setItem('appAdmins', JSON.stringify(adminList));
      setAdmins(adminList);

      setStats(prev => ({
        ...prev,
        totalUsersCount: updatedUsers.length,
        activeAdminsCount: adminList.filter(a => a.status === 'Active' || a.account_status === 'Active').length
      }));
      logAction('Admin', `Deleted user account: ${name}.`);
      showToastMessage(`User account "${name}" deleted.`);
    });
  };

  // CRUD Submission Management
  const handleDeleteSubmission = (id, name) => {
    triggerConfirm(`Are you sure you want to delete submission ${id} from ${name}?`, () => {
      const updated = submissions.filter(s => s.id !== id);
      setSubmissions(updated);
      localStorage.setItem('formSubmissions', JSON.stringify(updated));
      logAction('Form', `Deleted form submission: ${id} by ${name}.`);
      showToastMessage(`Deleted submission ${id} by ${name}.`);
    });
  };

  const openEditSubModal = (sub) => {
    setEditingSub(sub);
    setSubEditData({ name: sub.name, email: sub.email, status: sub.status });
  };

  const handleSubEditSubmit = (e) => {
    e.preventDefault();
    const updated = submissions.map(s => s.id === editingSub.id ? { ...s, ...subEditData } : s);
    setSubmissions(updated);
    localStorage.setItem('formSubmissions', JSON.stringify(updated));
    logAction('Form', `Updated details & status for submission ${editingSub.id}.`);
    showToastMessage(`Updated submission ${editingSub.id}.`);
    setEditingSub(null);
  };

  // CRUD Department Management
  const openAddDeptModal = () => {
    setEditingDept(null);
    setDeptFormData({ name: '', hod: '', formsCount: 0, membersCount: 0 });
    setShowDeptModal(true);
  };

  const openEditDeptModal = (dept) => {
    setEditingDept(dept);
    setDeptFormData({
      name: dept.name,
      hod: dept.hod,
      formsCount: dept.formsCount,
      membersCount: dept.membersCount
    });
    setShowDeptModal(true);
  };

  const handleDeptFormSubmit = (e) => {
    e.preventDefault();
    let updatedDepts;
    if (editingDept) {
      updatedDepts = departments.map(d => d.id === editingDept.id ? { ...d, ...deptFormData } : d);
      logAction('System', `Updated department registry: ${deptFormData.name} (HOD: ${deptFormData.hod}).`);
      showToastMessage(`Updated department "${deptFormData.name}".`);
    } else {
      const newDept = { id: Date.now(), ...deptFormData };
      updatedDepts = [...departments, newDept];
      logAction('System', `Added new department registry: ${deptFormData.name} (HOD: ${deptFormData.hod}).`);
      showToastMessage(`Added department "${deptFormData.name}".`);
    }
    setDepartments(updatedDepts);
    localStorage.setItem('appDepartments', JSON.stringify(updatedDepts));
    setShowDeptModal(false);
    setEditingDept(null);
  };

  const handleDeleteDept = (id, name) => {
    triggerConfirm(`Are you sure you want to permanently delete department: ${name}?`, () => {
      const updatedDepts = departments.filter(d => d.id !== id);
      setDepartments(updatedDepts);
      localStorage.setItem('appDepartments', JSON.stringify(updatedDepts));
      logAction('System', `Deleted department registry: "${name}".`);
      showToastMessage(`Deleted department "${name}".`);
    });
  };

  // Announcements CRUD
  const openAddAnnouncementModal = () => {
    setAnnouncementFormData({ title: '', content: '', target: 'All' });
    setShowAnnouncementModal(true);
  };

  const handleAnnouncementSubmit = (e) => {
    e.preventDefault();
    const newAnn = { id: Date.now(), ...announcementFormData, date: new Date().toLocaleDateString() };
    const updatedAnn = [newAnn, ...announcements];
    setAnnouncements(updatedAnn);
    localStorage.setItem('appAnnouncements', JSON.stringify(updatedAnn));
    logAction('System', `Published announcement: "${announcementFormData.title}".`);
    setStats(prev => ({ ...prev, activeAnnouncements: updatedAnn.length }));
    showToastMessage('Announcement published successfully!');
    setShowAnnouncementModal(false);
  };

  const handleDeleteAnnouncement = (id, title) => {
    triggerConfirm(`Delete announcement: "${title}"?`, () => {
      const updatedAnn = announcements.filter(a => a.id !== id);
      setAnnouncements(updatedAnn);
      localStorage.setItem('appAnnouncements', JSON.stringify(updatedAnn));
      logAction('System', `Deleted announcement: "${title}".`);
      setStats(prev => ({ ...prev, activeAnnouncements: updatedAnn.length }));
      showToastMessage('Announcement deleted.');
    });
  };

  // System Settings updates
  const handleSettingChange = (key, value) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);
    localStorage.setItem('globalSettings', JSON.stringify(updatedSettings));
    logAction('Setting', `Changed configuration '${key}' to: ${value.toString()}`);
    showToastMessage(`Setting '${key}' updated to ${value.toString()}`);
  };

  const handleSaveProfile = () => {
    if (!profileData.name.trim()) {
      showToastMessage('Profile name cannot be empty!', 'error');
      return;
    }
    if (!profileData.email.trim()) {
      showToastMessage('Email address cannot be empty!', 'error');
      return;
    }
    localStorage.setItem('userName', profileData.name);
    localStorage.setItem('userEmail', profileData.email);
    localStorage.setItem('userJoined', profileData.joined);

    // Propagate change to appUsers
    const savedUsers = localStorage.getItem('appUsers');
    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      const updated = users.map(u => u.email === originalEmail ? { ...u, name: profileData.name, email: profileData.email, created_at: profileData.joined } : u);
      localStorage.setItem('appUsers', JSON.stringify(updated));
    }

    setOriginalEmail(profileData.email);
    logAction('System', `Administrator profile updated. Name: ${profileData.name}, Email: ${profileData.email}, Joined: ${profileData.joined}`);
    showToastMessage('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = pwdData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToastMessage('All password fields are required!', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToastMessage('New password must be at least 6 characters long!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastMessage('New passwords do not match!', 'error');
      return;
    }

    // Load current admin account from local storage users database
    const savedUsers = localStorage.getItem('appUsers');
    if (!savedUsers) {
      showToastMessage('No users found in database!', 'error');
      return;
    }

    const usersList = JSON.parse(savedUsers);
    const currentEmail = localStorage.getItem('userEmail') || 'admin@mcc.edu.in';
    const targetIndex = usersList.findIndex(u => u.email.toLowerCase() === currentEmail.toLowerCase());

    if (targetIndex === -1) {
      showToastMessage('Logged-in user not found in database!', 'error');
      return;
    }

    const targetUser = usersList[targetIndex];

    // Validate current password
    const storedHash = targetUser.password.startsWith('hash_') ? targetUser.password : hashPassword(targetUser.password);
    const currentHash = hashPassword(currentPassword);

    if (storedHash !== currentHash) {
      showToastMessage('Incorrect current password!', 'error');
      return;
    }

    // Success: Hash and update new password
    const newHash = hashPassword(newPassword);
    usersList[targetIndex] = { ...targetUser, password: newHash };
    localStorage.setItem('appUsers', JSON.stringify(usersList));

    // Log action
    logAction('System', `Administrator changed account password successfully.`);
    showToastMessage('Password changed successfully!');

    // Reset fields
    setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getTemplatesRanking = () => {
    const formUsage = JSON.parse(localStorage.getItem('formUsage') || '[]');
    const rankingMap = {};
    formUsage.forEach(u => {
      const name = u.template_name || 'Unnamed Template';
      rankingMap[name] = (rankingMap[name] || 0) + 1;
    });
    return Object.entries(rankingMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getTemplatesUsageLogs = () => {
    return JSON.parse(localStorage.getItem('formUsage') || '[]');
  };

  // Notifications management
  const handleClearNotifications = () => {
    setNotifications([]);
    localStorage.setItem('appNotifications', JSON.stringify([]));
    logAction('System', 'Notifications list cleared.');
  };

  // Custom logo state to trigger re-renders
  const [logoVersion, setLogoVersion] = useState(0);

  const handleLogoUpload = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      localStorage.setItem(key, uploadEvent.target.result);
      setLogoVersion(prev => prev + 1);
      // Dispatch a storage event so other open pages (like Templates.jsx) automatically sync
      window.dispatchEvent(new Event('storage'));
      logAction('System', `Replaced platform logo: "${key === 'customLogo' ? 'Light Theme Logo' : 'Dark Theme Logo'}"`);
      showToastMessage('Logo uploaded and replaced successfully!');
    };
    reader.readAsDataURL(file);
  };

  const handleLogoDelete = (key) => {
    if (window.confirm(`Are you sure you want to delete the custom logo? It will fall back to the default logo.`)) {
      localStorage.removeItem(key);
      setLogoVersion(prev => prev + 1);
      window.dispatchEvent(new Event('storage'));
      logAction('System', `Deleted custom platform logo: "${key === 'customLogo' ? 'Light Theme Logo' : 'Dark Theme Logo'}"`);
      showToastMessage('Logo deleted. Reverted to default.');
    }
  };

  return (
    <div className={`admin-layout ${theme === 'dark' ? 'dark-mode' : 'light-mode'}${sidebarOpen ? ' sidebar-active' : ''}`}>
      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar Panel */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <img 
            src={theme === 'dark' 
              ? (localStorage.getItem('customLogoWhite') || "/mcc-mrf-logo-white.png?v=2") 
              : (localStorage.getItem('customLogo') || "/mcc-mrf-logo.png?v=2")} 
            alt="MCC Logo" 
            className="admin-logo" 
            style={{ transition: 'all 0.3s ease' }}
          />
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Menu"
          >
            ✕
          </button>
        </div>

        <nav className="admin-nav-links">
          {/* Dashboard Overview */}
          <button
            className={`admin-nav-item${activeMenu === 'overview' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('overview'); setSidebarOpen(false); }}
          >
            Dashboard
          </button>

          {/* User Management Collapsible Dropdown */}
          <div className="admin-menu-dropdown-wrapper">
            <button
              className="admin-nav-item dropdown-toggle"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            >
              User Management <span className="dropdown-arrow">{userDropdownOpen ? '▼' : '▶'}</span>
            </button>
            {userDropdownOpen && (
              <div className="admin-dropdown-submenu">
                <button
                  className={`submenu-item${activeMenu === 'users' ? ' active' : ''}`}
                  onClick={() => { setActiveMenu('users'); setSidebarOpen(false); }}
                >
                  • All Users
                </button>
                <button
                  className={`submenu-item${activeMenu === 'roles' ? ' active' : ''}`}
                  onClick={() => { setActiveMenu('roles'); setSidebarOpen(false); }}
                >
                  • Roles & Permissions
                </button>
              </div>
            )}
          </div>

          {/* All Submissions */}
          <button
            className={`admin-nav-item${activeMenu === 'submissions' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('submissions'); setSidebarOpen(false); }}
          >
            All Submissions
          </button>

          {/* Form Management */}
          <button
            className={`admin-nav-item${activeMenu === 'forms' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('forms'); setSidebarOpen(false); }}
          >
            Form Management
          </button>

          {/* Reports & Analytics */}
          <button
            className={`admin-nav-item${activeMenu === 'reports' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('reports'); setSidebarOpen(false); }}
          >
            Reports & Analytics
          </button>

          {/* Department Management */}
          <button
            className={`admin-nav-item${activeMenu === 'departments' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('departments'); setSidebarOpen(false); }}
          >
            Department Management
          </button>

          {/* Announcements */}
          <button
            className={`admin-nav-item${activeMenu === 'announcements' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('announcements'); setSidebarOpen(false); }}
          >
            Announcements
          </button>

          {/* Notifications */}
          <button
            className={`admin-nav-item${activeMenu === 'notifications' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('notifications'); setSidebarOpen(false); }}
          >
            Notifications
          </button>

          {/* Audit Logs */}
          <button
            className={`admin-nav-item${activeMenu === 'logs' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('logs'); setSidebarOpen(false); }}
          >
            Audit Logs
          </button>

          {/* Sign Datas */}
          <button
            className={`admin-nav-item${activeMenu === 'signdatas' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('signdatas'); setSidebarOpen(false); }}
          >
            Sign Datas
          </button>

          {/* System Settings */}
          <button
            className={`admin-nav-item${activeMenu === 'settings' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('settings'); setSidebarOpen(false); }}
          >
            System Settings
          </button>

          {/* Profile */}
          <button
            className={`admin-nav-item${activeMenu === 'profile' ? ' active' : ''}`}
            onClick={() => { setActiveMenu('profile'); setSidebarOpen(false); }}
          >
            Profile
          </button>
        </nav>

        <div className="admin-sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Link to="/" className="admin-back-btn" onClick={() => setSidebarOpen(false)}>
            Exit to Landing Page
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('isLoggedIn');
              localStorage.removeItem('userRole');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userName');
              localStorage.removeItem('userId');
              navigate('/auth');
              window.location.reload();
            }}
            className="admin-back-btn"
            style={{ background: '#fdf2f2', color: '#dc2626', border: '1.5px solid #fca5a5', cursor: 'pointer', fontFamily: 'inherit', fontWeight: '700' }}
          >
            Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="admin-main">
        {/* Top Header */}
        <header className="admin-header" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="admin-menu-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Menu"
            >
              ☰
            </button>
            <div className="admin-header-title-wrap">
              <h2>MCC-MRF Portal Admin</h2>
              <p>Madras Christian College Innovation Park System Center</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div className="admin-profile-badge">
              <span className="profile-avatar">{profileData.avatar}</span>
              <div>
                <div className="profile-name">{profileData.name}</div>
                <div className="profile-role">{profileData.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* ── 1. DASHBOARD OVERVIEW ── */}
        {activeMenu === 'overview' && (
          <div className="admin-tab-content anim-fade-in">
            {/* KPI Stats */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper submissions">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Submissions</span>
                  <span className="stat-value">{stats.totalSubmissions}</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper forms">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Total Forms</span>
                  <span className="stat-value">{stats.totalForms}</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper admins">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Registered Users</span>
                  <span className="stat-value">{stats.totalUsersCount}</span>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon-wrapper state">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="heartbeat-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                </div>
                <div className="stat-info">
                  <span className="stat-label">Health & Tunnels</span>
                  <span className="stat-value">Online (HMR)</span>
                </div>
              </div>
            </div>

            {/* Quick Status Info & Latest Logs */}
            <div className="admin-overview-panels">
              <div className="overview-panel quick-controls">
                <h3>Quick Controls</h3>
                <div className="controls-grid">
                  <div className="control-item">
                    <label>Maintenance Mode</label>
                    <button
                      className={`toggle-btn ${settings.maintenanceMode ? 'on' : 'off'}`}
                      onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                    >
                      {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="control-item">
                    <label>New Account Creation</label>
                    <button className="control-action-btn" onClick={openAddUserModal}>
                      + Add New User
                    </button>
                  </div>
                  <div className="control-item">
                    <label>Data Backup Simulation</label>
                    <button
                      className="control-action-btn secondary"
                      onClick={() => {
                        logAction('System', 'Database snapshot backup successfully triggered.');
                        alert('System database backup simulated successfully!');
                      }}
                    >
                      Backup Database
                    </button>
                  </div>
                </div>
              </div>

              <div className="overview-panel recent-logs">
                <div className="panel-header">
                  <h3>Recent Audit Trail</h3>
                  <button className="text-btn" onClick={() => setActiveMenu('logs')}>View All Logs</button>
                </div>
                <div className="logs-feed-compact">
                  {logs.slice(0, 5).map((log, index) => (
                    <div key={index} className="log-row-compact">
                      <span className="log-time">{log.time.split(' ')[1]}</span>
                      <span className={`log-tag tag-${log.type.toLowerCase()}`}>{log.type}</span>
                      <span className="log-text">{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. ALL USERS ── */}
        {activeMenu === 'users' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>Registered Portal Users Directory</h3>
              <button className="admin-btn-primary" onClick={openAddUserModal}>
                + Register User
              </button>
            </div>

            <div className="super-table-container">
              <table className="super-data-table">
                <thead>
                  <tr>
                    <th>Name / Role</th>
                    <th>Email Address</th>
                    <th>Department</th>
                    <th>Created</th>
                    <th>Last Active</th>
                    <th>Session Status</th>
                    <th>Forms Count</th>
                    <th>Templates Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isOnline = sessionStorage.getItem('isLoggedIn') === 'true' && (sessionStorage.getItem('userEmail') || '').trim().toLowerCase() === (user.email || '').trim().toLowerCase();
                    const customForms = JSON.parse(localStorage.getItem('customForms') || '[]');
                    const userForms = customForms.filter(f => f.creator_id === user.id || f.creator === user.email || f.creator === user.name).length;
                    const formUsage = JSON.parse(localStorage.getItem('formUsage') || '[]');
                    const userTemplates = formUsage.filter(u => u.user_id === user.id || u.user_email === user.email).length;

                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#1e293b' }}>{formatName(user.name)}</strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{user.role}</span>
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>{user.dept || 'Administration'}</td>
                        <td>{user.created_at || '2026-06-12'}</td>
                        <td>{formatLastActive(user.last_login_at)}</td>
                        <td>
                          <span className={`status-badge-modern ${isOnline ? 'online' : 'offline'}`}>
                            <span className="status-dot"></span>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="font-semibold" style={{ textAlign: 'center' }}>{userForms}</td>
                        <td className="font-semibold" style={{ textAlign: 'center' }}>{userTemplates}</td>
                        <td>
                          <div className="table-actions">
                            <button className="action-btn edit" onClick={() => openEditUserModal(user)}>
                              Edit
                            </button>
                            <button className="action-btn delete" onClick={() => handleDeleteUser(user.id, user.name)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 3. ROLES & PERMISSIONS ── */}
        {activeMenu === 'roles' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>Portal Roles & Permissions Matrix</h3>
            </div>

            <div className="super-table-container">
              <table className="super-data-table">
                <thead>
                  <tr>
                    <th>User Role</th>
                    <th>Manage Users</th>
                    <th>Manage Forms</th>
                    <th>Moderate Submissions</th>
                    <th>Submit Submissions</th>
                    <th>System Settings Access</th>
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((p, pIdx) => (
                    <tr key={pIdx}>
                      <td className="font-semibold" style={p.color ? { color: p.color } : {}}>{p.role}</td>
                      <td>
                        <select
                          value={p.manageUsers}
                          onChange={(e) => handlePermissionChange(pIdx, 'manageUsers', e.target.value)}
                          className="fb-question-type-select"
                          style={{ minWidth: 'auto', padding: '4px 8px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <option value="Allowed">✅ Allowed</option>
                          <option value="Denied">❌ Denied</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={p.manageForms}
                          onChange={(e) => handlePermissionChange(pIdx, 'manageForms', e.target.value)}
                          className="fb-question-type-select"
                          style={{ minWidth: 'auto', padding: '4px 8px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <option value="Allowed">✅ Allowed</option>
                          <option value="Allowed (Dept Only)">✅ Allowed (Dept Only)</option>
                          <option value="Denied">❌ Denied</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={p.moderateSubmissions}
                          onChange={(e) => handlePermissionChange(pIdx, 'moderateSubmissions', e.target.value)}
                          className="fb-question-type-select"
                          style={{ minWidth: 'auto', padding: '4px 8px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <option value="Allowed">✅ Allowed</option>
                          <option value="Allowed (Own Forms)">✅ Allowed (Own Forms)</option>
                          <option value="Denied">❌ Denied</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={p.submitSubmissions}
                          onChange={(e) => handlePermissionChange(pIdx, 'submitSubmissions', e.target.value)}
                          className="fb-question-type-select"
                          style={{ minWidth: 'auto', padding: '4px 8px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <option value="Allowed">✅ Allowed</option>
                          <option value="Denied">❌ Denied</option>
                        </select>
                      </td>
                      <td>
                        <select
                          value={p.settingsAccess}
                          onChange={(e) => handlePermissionChange(pIdx, 'settingsAccess', e.target.value)}
                          className="fb-question-type-select"
                          style={{ minWidth: 'auto', padding: '4px 8px', fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }}
                        >
                          <option value="Allowed">✅ Allowed</option>
                          <option value="Denied">❌ Denied</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 4. DEPARTMENT MANAGEMENT ── */}
        {activeMenu === 'departments' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>Madras Christian College Departments</h3>
              <button className="admin-btn-primary" onClick={openAddDeptModal}>
                + Add Department
              </button>
            </div>

            <div className="super-table-container">
              <table className="super-data-table">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Department Head (HOD)</th>
                    <th>Forms Registered</th>
                    <th>Members Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(dept => (
                    <tr key={dept.id}>
                      <td className="font-semibold">{dept.name}</td>
                      <td>{dept.hod}</td>
                      <td>{dept.formsCount} Forms</td>
                      <td>{dept.membersCount} Members</td>
                      <td>
                        <div className="table-actions">
                          <button className="action-btn edit" onClick={() => openEditDeptModal(dept)}>
                            Edit
                          </button>
                          <button className="action-btn delete" onClick={() => handleDeleteDept(dept.id, dept.name)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. FORM MANAGEMENT ── */}
        {activeMenu === 'forms' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>Institutional Form Templates Manager</h3>
            </div>
            <AdminFormManagement onLogAction={logAction} />
          </div>
        )}

        {/* ── 6. ALL SUBMISSIONS ── */}
        {activeMenu === 'submissions' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Global Submissions Feed</h3>
              <div className="admin-search-box" style={{ width: '300px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  placeholder="Filter submissions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="super-table-container">
              <table className="super-data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Form Title</th>
                    <th>Submitter</th>
                    <th>Submitted Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions
                    .filter(sub =>
                      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      sub.form.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      sub.id.toString().toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(sub => (
                      <tr key={sub.id}>
                        <td className="font-semibold">{sub.id}</td>
                        <td>{sub.form}</td>
                        <td>{sub.name}</td>
                        <td>{sub.date || '2026-07-09'}</td>
                        <td>
                          <span className={`status-badge ${sub.status.replace(' ', '-').toLowerCase()}`}>
                            {sub.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn view"
                              onClick={() => setSelectedSub(sub)}
                            >
                              View Details
                            </button>
                            <button
                              className="action-btn edit"
                              style={{ background: '#ecfdf5', color: '#065f46', borderColor: '#a7f3d0' }}
                              onClick={() => handleDownloadSubCSV(sub)}
                              title="Download as Excel/CSV"
                            >
                              📥 Excel
                            </button>
                            <button
                              className="action-btn edit"
                              style={{ background: '#fff5f5', color: '#991b1b', borderColor: '#fca5a5' }}
                              onClick={() => handleDownloadSubPDF(sub)}
                              title="Download as PDF"
                            >
                              📄 PDF
                            </button>
                            <button
                              className="action-btn edit"
                              onClick={() => openEditSubModal(sub)}
                            >
                              Edit
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteSubmission(sub.id, sub.name)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {selectedSub && createPortal(
              <div className="admin-modal-overlay">
                <div className="admin-modal" style={{ maxWidth: '1100px', width: '95%' }}>
                  <div className="modal-header">
                    <h4>Submission Details - {selectedSub.id}</h4>
                    <button className="modal-close" onClick={() => setSelectedSub(null)}>×</button>
                  </div>
                  <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <strong>Submitter Name:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{selectedSub.name}</p>
                      </div>
                      <div>
                        <strong>Email Address:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{selectedSub.email}</p>
                      </div>
                      <div>
                        <strong>Form Name:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{selectedSub.form}</p>
                      </div>
                      <div>
                        <strong>Date Submitted:</strong>
                        <p style={{ margin: '4px 0 0 0' }}>{selectedSub.date || '2026-07-09'}</p>
                      </div>
                    </div>
                    <hr style={{ borderColor: '#e2e8f0', margin: '16px 0' }} />
                    <h5>Field Answers</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      {(selectedSub.answers || []).map((ans, idx) => (
                        <div key={idx}>
                          <strong style={{ color: '#475569', fontSize: '13px' }}>{ans.q}</strong>
                          <p style={{ margin: '4px 0 0 0', background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>{ans.a || '—'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      className="admin-btn-primary"
                      style={{ background: '#16a34a', borderColor: '#16a34a' }}
                      onClick={() => handleDownloadSubCSV(selectedSub)}
                    >
                      📥 Download Excel (CSV)
                    </button>
                    <button
                      className="admin-btn-primary"
                      style={{ background: '#991b1b', borderColor: '#991b1b' }}
                      onClick={() => handleDownloadSubPDF(selectedSub)}
                    >
                      📄 Download PDF Report
                    </button>
                    <button type="button" className="admin-btn-secondary" style={{ background: '#64748b', borderColor: '#64748b', color: 'white' }} onClick={() => setSelectedSub(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {editingSub && createPortal(
              <div className="admin-modal-overlay">
                <form onSubmit={handleSubEditSubmit} className="admin-modal" style={{ maxWidth: '500px' }}>
                  <div className="modal-header">
                    <h4>Edit Submission - {editingSub.id}</h4>
                    <button type="button" className="modal-close" onClick={() => setEditingSub(null)}>×</button>
                  </div>
                  <div className="modal-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Submitter Name</label>
                        <input
                          type="text"
                          required
                          value={subEditData.name}
                          onChange={e => setSubEditData(prev => ({ ...prev, name: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Email Address</label>
                        <input
                          type="email"
                          required
                          value={subEditData.email}
                          onChange={e => setSubEditData(prev => ({ ...prev, email: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: '700', fontSize: '13px', color: '#475569', marginBottom: '6px' }}>Status</label>
                        <select
                          value={subEditData.status}
                          onChange={e => setSubEditData(prev => ({ ...prev, status: e.target.value }))}
                          style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13.5px', outline: 'none', cursor: 'pointer', background: 'white' }}
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Completed">Completed</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="admin-btn-secondary" onClick={() => setEditingSub(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="admin-btn-primary">
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>,
              document.body
            )}
          </div>
        )}

        {/* ── 7. REPORTS & ANALYTICS ── */}
        {activeMenu === 'reports' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>Portal Reports & Analytics</h3>
              <button
                className="admin-btn-primary"
                onClick={() => showToastMessage('Simulating PDF/CSV Export of system analytics...', 'info')}
              >
                📥 Export Analytics Report
              </button>
            </div>

            <div className="admin-overview-panels" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="overview-panel">
                <h3>Submissions by Department</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <span>Computer Science</span>
                      <span>154 (53%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '53%', height: '100%', background: '#7B1C1C' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <span>Chemistry</span>
                      <span>98 (34%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '34%', height: '100%', background: '#475569' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <span>Biotechnology</span>
                      <span>82 (28%)</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '28%', height: '100%', background: '#166534' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-panel">
                <h3>Monthly Response Rate</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <span>July 2026 (Active)</span>
                      <span>282 Submissions</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '90%', height: '100%', background: '#b45309' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                      <span>June 2026</span>
                      <span>194 Submissions</span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: '70%', height: '100%', background: '#0f172a' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-overview-panels" style={{ gridTemplateColumns: '1fr', marginTop: '24px' }}>
              <div className="overview-panel">
                <h3>Form Templates Usage Analytics</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginTop: '16px' }}>
                  {/* Left Column: Usage Frequency List */}
                  <div>
                    <h4 style={{ fontSize: '13.5px', marginBottom: '12px', color: '#475569', fontWeight: '700' }}>Popular Templates Ranking</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {getTemplatesRanking().map((item, idx) => (
                        <div key={idx} style={{ padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '13px', color: '#1e293b' }}>{item.name}</strong>
                          </div>
                          <span style={{ background: '#7B1C1C', color: 'white', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px', fontSize: '11px' }}>
                            {item.count} uses
                          </span>
                        </div>
                      ))}
                      {getTemplatesRanking().length === 0 && (
                        <p style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '12.5px' }}>No template activity logged yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Detailed Usage Log Map */}
                  <div>
                    <h4 style={{ fontSize: '13.5px', marginBottom: '12px', color: '#475569', fontWeight: '700' }}>User Template Selections Audit Map</h4>
                    <div className="super-table-container" style={{ margin: 0, maxHeight: '250px', overflowY: 'auto' }}>
                      <table className="super-data-table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            <th>User Email</th>
                            <th>Template Used</th>
                            <th>Used Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getTemplatesUsageLogs().map((log, idx) => (
                            <tr key={idx}>
                              <td><strong>{log.user_email}</strong></td>
                              <td>{log.template_name}</td>
                              <td>{log.used_at}</td>
                            </tr>
                          ))}
                          {getTemplatesUsageLogs().length === 0 && (
                            <tr>
                              <td colSpan="3" style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontStyle: 'italic' }}>
                                No selections logged.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ── 8. ANNOUNCEMENTS ── */}
        {activeMenu === 'announcements' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>System Announcements Feed</h3>
              <button className="admin-btn-primary" onClick={openAddAnnouncementModal}>
                + Publish Announcement
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {announcements.map(ann => (
                <div key={ann.id} className="overview-panel" style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                    className="ann-del-btn"
                    title="Delete Announcement"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="log-tag tag-system" style={{ background: '#fdf2f2', color: '#7B1C1C' }}>
                      Target: {ann.target}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      Published on {ann.date}
                    </span>
                  </div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                    {ann.title}
                  </h4>
                  <p style={{ margin: 0, color: '#475569', fontSize: '14px', lineHeight: '1.6' }}>
                    {ann.content}
                  </p>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center" style={{ padding: '64px', color: '#94a3b8' }}>
                  No active announcements published.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 9. NOTIFICATIONS ── */}
        {activeMenu === 'notifications' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>System Alerts & Notifications</h3>
              <button className="admin-btn-secondary" onClick={handleClearNotifications}>
                Clear All Notifications
              </button>
            </div>

            <div className="overview-panel" style={{ padding: '0 28px' }}>
              {notifications.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 0',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>🔔</span>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{n.text}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        Type: {n.type} • {n.time}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center" style={{ padding: '64px', color: '#94a3b8' }}>
                  No active notifications/alerts.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 10. AUDIT LOGS ── */}
        {activeMenu === 'logs' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>System Event Log Feed</h3>
              <button
                className="admin-btn-danger"
                onClick={() => {
                  if (window.confirm('Clear all audit logs?')) {
                    setLogs([]);
                    localStorage.setItem('systemLogs', JSON.stringify([]));
                  }
                }}
              >
                Clear System Logs
              </button>
            </div>

            <div className="logs-panel-full">
              <div className="logs-table-header">
                <span>Timestamp</span>
                <span>Category</span>
                <span>Details / Event Log Description</span>
              </div>
              <div className="logs-list-scrollable">
                {logs.map((log, index) => (
                  <div key={index} className="log-row-full">
                    <span className="log-full-time">{log.time}</span>
                    <span className={`log-tag tag-${log.type.toLowerCase()}`}>{log.type}</span>
                    <span className="log-full-desc">{log.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 10.5. SIGN DATAS ── */}
        {activeMenu === 'signdatas' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="tab-section-header">
              <h3>User Sign Datas / Logins Log</h3>
              <button
                className="admin-btn-danger"
                onClick={() => {
                  if (window.confirm('Clear all user sign-in data logs?')) {
                    setLoginActivity([]);
                    localStorage.setItem('loginActivity', JSON.stringify([]));
                  }
                }}
              >
                Clear Sign Datas
              </button>
            </div>

            <div className="logs-panel-full">
              <div className="signdatas-table-header" style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontWeight: '700', color: '#475569' }}>
                <span>Login Time</span>
                <span>Name</span>
                <span className="signdatas-email-col">Email</span>
                <span className="signdatas-password-col">Password</span>
                <span>Role</span>
                <span className="signdatas-ip-col">IP Address</span>
                <span className="signdatas-browser-col">Browser</span>
              </div>
              <div className="logs-list-scrollable" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {(() => {
                  const hashPasswordLocal = (password) => {
                    let hash = 0;
                    for (let i = 0; i < password.length; i++) {
                      hash = (hash << 5) - hash + password.charCodeAt(i);
                      hash = hash & hash;
                    }
                    return 'hash_' + Math.abs(hash).toString(16);
                  };

                  const getDisplayPassword = (act) => {
                    if (act.password && act.password !== '—') return act.password;
                    const targetUser = users.find(u => (u.email || '').trim().toLowerCase() === (act.email || '').trim().toLowerCase());
                    if (!targetUser) return '—';
                    if (targetUser.plain_password) return targetUser.plain_password;
                    const pw = targetUser.password;
                    if (!pw) return '—';
                    if (!pw.startsWith('hash_')) return pw;

                    const username = act.email.split('@')[0].toLowerCase();
                    const candidates = [
                      'admin123', 'password', '123456', '12345678', 'mcc123', 'mcc-mrf',
                      username, username + '123', username + '1234', username + '@123',
                      'raghul123', 'zain123', 'zubi123', 'zubairya123', 'raghul', 'zain', 'zubairya', 'zubi9043', 'zubi'
                    ];
                    for (const c of candidates) {
                      if (hashPasswordLocal(c) === pw) {
                        return c;
                      }
                    }
                    return '—';
                  };

                  return loginActivity.map((act, index) => (
                    <div key={index} className="signdatas-row-full" style={{ alignItems: 'center' }}>
                      <span className="log-full-time" style={{ color: '#64748b', fontSize: '13px' }}>{act.login_time || '—'}</span>
                      <strong style={{ color: '#1e293b' }}>{act.name || '—'}</strong>
                      <span className="signdatas-email-col" style={{ color: '#475569' }}>{act.email || '—'}</span>
                      <span className="signdatas-password-col" style={{ color: '#475569', fontFamily: 'monospace' }}>—</span>
                      <span className={`log-tag tag-${(act.role || 'user').toLowerCase()}`}>{act.role || 'user'}</span>
                      <span className="signdatas-ip-col" style={{ fontFamily: 'monospace', color: '#64748b' }}>{act.ip_address || '—'}</span>
                      <span className="signdatas-browser-col" style={{ color: '#475569', fontSize: '13px' }}>{act.browser || '—'}</span>
                    </div>
                  ));
                })()}
                {loginActivity.length === 0 && (
                  <div className="text-center" style={{ padding: '64px', color: '#94a3b8', textAlign: 'center' }}>
                    No sign-in data logs available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 11. SYSTEM SETTINGS ── */}
        {activeMenu === 'settings' && (
          <div className="admin-tab-content anim-fade-in">
            <div className="admin-settings-card">
              <h3>Global Portal Settings</h3>

              <div className="setting-card-row">
                <div className="setting-info-block">
                  <div className="setting-title font-semibold">Maintenance Mode</div>
                  <div className="setting-desc">Direct all student / faculty users to a temporary maintenance page.</div>
                </div>
                <div className="setting-input-block">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    className="checkbox-toggle"
                  />
                </div>
              </div>

              <div className="setting-card-row">
                <div className="setting-info-block">
                  <div className="setting-title font-semibold">Admin Email Notifications</div>
                  <div className="setting-desc">Send automated email summaries of submissions to department heads.</div>
                </div>
                <div className="setting-input-block">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                    className="checkbox-toggle"
                  />
                </div>
              </div>

              <div className="setting-card-row">
                <div className="setting-info-block">
                  <div className="setting-title font-semibold">Form Creation Moderation</div>
                  <div className="setting-desc">Require explicit approval before newly built templates are set Active.</div>
                </div>
                <div className="setting-input-block">
                  <input
                    type="checkbox"
                    checked={settings.requireApproval}
                    onChange={(e) => handleSettingChange('requireApproval', e.target.checked)}
                    className="checkbox-toggle"
                  />
                </div>
              </div>

              <div className="setting-card-row">
                <div className="setting-info-block">
                  <div className="setting-title font-semibold">Analytics Interval</div>
                  <div className="setting-desc">Refresh rate for background statistical updates on the dashboard.</div>
                </div>
                <div className="setting-input-block">
                  <select
                    value={settings.analyticsInterval}
                    onChange={(e) => handleSettingChange('analyticsInterval', e.target.value)}
                    className="admin-select"
                  >
                    <option value="Realtime">Realtime (5s)</option>
                    <option value="Hourly">Hourly</option>
                    <option value="Daily">Daily (24h)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 12. PROFILE ── */}
        {activeMenu === 'profile' && (
          <div className="admin-tab-content anim-fade-in" style={{ maxWidth: '600px' }}>
            <div className="admin-settings-card">
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <span style={{ fontSize: '64px', display: 'block', marginBottom: '12px' }}>
                  {profileData.avatar}
                </span>
                <h3 style={{ margin: '0 0 6px 0' }}>{profileData.name}</h3>
                <span className="status-badge active">{profileData.role}</span>
              </div>

              <div style={{ marginTop: '20px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Administrator Profile Name (Username)</h5>
                <input
                  type="text"
                  className="pf-input"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '20px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Email Address</h5>
                <input
                  type="email"
                  className="pf-input"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                />
              </div>

              <div style={{ marginTop: '20px' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Joined System</h5>
                <input
                  type="text"
                  className="pf-input"
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  value={profileData.joined}
                  onChange={(e) => setProfileData({ ...profileData, joined: e.target.value })}
                />
              </div>

              {/* Logo Management Section */}
              <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1.5px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
                  Platform Logo Management
                </h4>
                <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
                  Upload, delete, or replace the primary logo and the dark mode logo used across the platform.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  {/* Primary Logo */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1.5px dashed #cbd5e1', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#475569' }}>
                      Primary Logo (Light Theme)
                    </span>
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', background: '#ffffff', borderRadius: '6px', padding: '6px', border: '1px solid #e2e8f0' }}>
                      <img 
                        src={localStorage.getItem('customLogo') || "/mcc-mrf-logo.png?v=2"} 
                        alt="Primary Logo" 
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <label className="action-btn view" style={{ fontSize: '11px', padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', margin: '0' }}>
                        Replace
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleLogoUpload(e, 'customLogo')} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      {localStorage.getItem('customLogo') && (
                        <button 
                          type="button" 
                          className="action-btn delete" 
                          style={{ fontSize: '11px', padding: '4px 8px' }} 
                          onClick={() => handleLogoDelete('customLogo')}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dark Theme Logo */}
                  <div style={{ background: '#0f172a', padding: '16px', borderRadius: '12px', border: '1.5px dashed #334155', textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: '#94a3b8' }}>
                      Primary Logo (Dark Theme)
                    </span>
                    <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', background: '#1e293b', borderRadius: '6px', padding: '6px', border: '1px solid #334155' }}>
                      <img 
                        src={localStorage.getItem('customLogoWhite') || "/mcc-mrf-logo-white.png?v=2"} 
                        alt="Dark Theme Logo" 
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <label className="action-btn clone" style={{ fontSize: '11px', padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', color: 'white', background: '#3b82f6', border: 'none', margin: '0' }}>
                        Replace
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleLogoUpload(e, 'customLogoWhite')} 
                          style={{ display: 'none' }} 
                        />
                      </label>
                      {localStorage.getItem('customLogoWhite') && (
                        <button 
                          type="button" 
                          className="action-btn delete" 
                          style={{ fontSize: '11px', padding: '4px 8px' }} 
                          onClick={() => handleLogoDelete('customLogoWhite')}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  className="admin-btn-primary"
                  onClick={handleSaveProfile}
                  style={{ padding: '10px 20px', fontSize: '13.5px', borderRadius: '8px' }}
                >
                  Update Profile
                </button>
                <button
                  className="action-btn view"
                  onClick={() => {
                    const originalName = localStorage.getItem('userName') || 'MCC Administrator';
                    const origEmail = localStorage.getItem('userEmail') || 'admin@mcc.edu.in';
                    const origJoined = localStorage.getItem('userJoined') || '2025-01-10';
                    setProfileData(prev => ({ ...prev, name: originalName, email: origEmail, joined: origJoined }));
                  }}
                  style={{ padding: '10px 20px', fontSize: '13.5px', borderRadius: '8px', border: '1px solid #cbd5e1', height: 'auto', background: '#f8fafc' }}
                >
                  Reset Changes
                </button>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="admin-settings-card" style={{ marginTop: '28px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '850', color: '#0f172a' }}>
                Change Password
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '700', color: '#475569' }}>Current Password</h5>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      style={{ width: '100%', padding: '10px 42px 10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                      value={pwdData.currentPassword}
                      onChange={(e) => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        outline: 'none'
                      }}
                      title={showCurrentPwd ? "Hide password" : "Show password"}
                    >
                      {showCurrentPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '700', color: '#475569' }}>New Password</h5>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPwd ? "text" : "password"}
                      style={{ width: '100%', padding: '10px 42px 10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                      value={pwdData.newPassword}
                      onChange={(e) => setPwdData({ ...pwdData, newPassword: e.target.value })}
                      placeholder="Enter new password (min. 6 chars)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        outline: 'none'
                      }}
                      title={showNewPwd ? "Hide password" : "Show password"}
                    >
                      {showNewPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <h5 style={{ margin: '0 0 8px 0', fontSize: '13.5px', fontWeight: '700', color: '#475569' }}>Confirm New Password</h5>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      style={{ width: '100%', padding: '10px 42px 10px 14px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                      value={pwdData.confirmPassword}
                      onChange={(e) => setPwdData({ ...pwdData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        outline: 'none'
                      }}
                      title={showConfirmPwd ? "Hide password" : "Show password"}
                    >
                      {showConfirmPwd ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      )}
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <button
                    className="admin-btn-primary"
                    onClick={handleChangePassword}
                    style={{ padding: '10px 20px', fontSize: '13.5px', borderRadius: '8px' }}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Admin/User Add/Edit Modal */}
      {showUserModal && createPortal(
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h4>{editingUser ? 'Edit User Details' : 'Register Portal User'}</h4>
              <button className="modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <form onSubmit={handleUserFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="e.g. Dr. Robert"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    placeholder="e.g. robert@mcc.edu.in"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  >
                    <option value="user">Normal User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department / Institution role</label>
                  <select
                    value={userFormData.dept}
                    onChange={(e) => setUserFormData({ ...userFormData, dept: e.target.value })}
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biotechnology">Biotechnology</option>
                    <option value="Physics">Physics</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Account Status</label>
                  <select
                    value={userFormData.status}
                    onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setShowUserModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingUser ? 'Save Changes' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Department Add/Edit Modal */}
      {showDeptModal && createPortal(
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h4>{editingDept ? 'Edit Department Registry' : 'Add Department Registry'}</h4>
              <button className="modal-close" onClick={() => setShowDeptModal(false)}>×</button>
            </div>
            <form onSubmit={handleDeptFormSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Department Name</label>
                  <input
                    type="text"
                    required
                    value={deptFormData.name}
                    onChange={(e) => setDeptFormData({ ...deptFormData, name: e.target.value })}
                    placeholder="e.g. Mathematics"
                  />
                </div>
                <div className="form-group">
                  <label>Department Head (HOD) Name</label>
                  <input
                    type="text"
                    required
                    value={deptFormData.hod}
                    onChange={(e) => setDeptFormData({ ...deptFormData, hod: e.target.value })}
                    placeholder="e.g. Dr. Robert"
                  />
                </div>
                <div className="form-group">
                  <label>Members Count</label>
                  <input
                    type="number"
                    required
                    value={deptFormData.membersCount}
                    onChange={(e) => setDeptFormData({ ...deptFormData, membersCount: parseInt(e.target.value) })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setShowDeptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  {editingDept ? 'Save Changes' : 'Add Department'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Announcement Add Modal */}
      {showAnnouncementModal && createPortal(
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h4>Publish New Announcement</h4>
              <button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>×</button>
            </div>
            <form onSubmit={handleAnnouncementSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Announcement Title</label>
                  <input
                    type="text"
                    required
                    value={announcementFormData.title}
                    onChange={(e) => setAnnouncementFormData({ ...announcementFormData, title: e.target.value })}
                    placeholder="e.g. System Maintenance Window"
                  />
                </div>
                <div className="form-group">
                  <label>Announcement Content</label>
                  <textarea
                    required
                    style={{ padding: '10px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', height: '100px', fontFamily: 'inherit', outline: 'none' }}
                    value={announcementFormData.content}
                    onChange={(e) => setAnnouncementFormData({ ...announcementFormData, content: e.target.value })}
                    placeholder="Enter the detailed announcement content..."
                  />
                </div>
                <div className="form-group">
                  <label>Target Audience</label>
                  <select
                    value={announcementFormData.target}
                    onChange={(e) => setAnnouncementFormData({ ...announcementFormData, target: e.target.value })}
                  >
                    <option value="All">All Users (Students & Faculty)</option>
                    <option value="Faculty">Faculty & Admins Only</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="admin-btn-secondary" onClick={() => setShowAnnouncementModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      {/* Custom Confirmation Modal */}
      {confirmModal && createPortal(
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h4>Confirm Action</h4>
              <button className="modal-close" onClick={() => setConfirmModal(null)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>⚠️</span>
              <p style={{ margin: 0, color: '#334155', fontSize: '14.5px', fontWeight: '600', lineHeight: '1.5' }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center', gap: '12px' }}>
              <button className="admin-btn-secondary" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button
                className="admin-btn-danger"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Toast Messages */}
      {toast && (
        <div
          className={`admin-toast anim-fade-in ${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toast.type === 'success' ? '#ecfdf5' : toast.type === 'error' ? '#fdf2f2' : '#eff6ff',
            border: `1.5px solid ${toast.type === 'success' ? '#a7f3d0' : toast.type === 'error' ? '#fca5a5' : '#bfdbfe'}`,
            color: toast.type === 'success' ? '#065f46' : toast.type === 'error' ? '#991b1b' : '#1e3a8a',
            padding: '16px 24px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: '700',
            fontSize: '14px'
          }}
        >
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
