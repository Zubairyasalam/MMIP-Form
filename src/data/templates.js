// Template definitions — each with its color theme and pre-built questions

export const TEMPLATE_THEMES = {
  'maroon-bg': { banner: 'linear-gradient(90deg, #5a1313, #7B1C1C, #a82828)', accent: '#7B1C1C', label: 'Maroon' },
  'light-bg': { banner: 'linear-gradient(90deg, #c94040, #e05555, #f08080)', accent: '#c94040', label: 'Rose' },
  'orange-bg': { banner: 'linear-gradient(90deg, #ea580c, #f97316, #fdba74)', accent: '#ea580c', label: 'Orange' },
  'green-bg': { banner: 'linear-gradient(90deg, #057a55, #10b981, #34d399)', accent: '#057a55', label: 'Green' },
  'purple-bg': { banner: 'linear-gradient(90deg, #6c2bd9, #8b5cf6, #a78bfa)', accent: '#6c2bd9', label: 'Purple' },
};

export const TEMPLATES = [
  {
    name: 'Innovation Grant Application',
    desc: 'Apply for research and innovation funding at MCC-MRF.',
    tag: 'Grant Application',
    fields: '12 fields',
    bg: 'maroon-bg',
    questions: [
      { type: 'short', question: 'Principal Investigator Name', options: [], required: true },
      { type: 'short', question: 'Department / Institution', options: [], required: true },
      { type: 'short', question: 'Project Title', options: [], required: true },
      { type: 'paragraph', question: 'Project Abstract (max 300 words)', options: [], required: true },
      { type: 'paragraph', question: 'Objectives and Expected Outcomes', options: [], required: true },
      {
        type: 'multiple', question: 'Research Domain',
        options: ['Technology & AI', 'Biomedical', 'Sustainability', 'Social Sciences', 'Other'],
        required: true
      },
      { type: 'short', question: 'Requested Grant Amount (₹)', options: [], required: true },
      { type: 'paragraph', question: 'Budget Justification', options: [], required: false },
      { type: 'date', question: 'Proposed Project Start Date', options: [], required: true },
      { type: 'date', question: 'Proposed Project End Date', options: [], required: true },
      {
        type: 'multiple', question: 'Have you applied for a grant before?',
        options: ['Yes', 'No'],
        required: true
      },
      { type: 'paragraph', question: 'Any additional remarks', options: [], required: false },
    ],
  },
  {
    name: 'Student Registration Form',
    desc: 'Register students for programs, workshops, and courses.',
    tag: 'Registration',
    fields: '8 fields',
    bg: 'light-bg',
    questions: [
      { type: 'short', question: 'Full Name', options: [], required: true },
      { type: 'short', question: 'Roll Number / Student ID', options: [], required: true },
      { type: 'short', question: 'Email Address', options: [], required: true },
      { type: 'short', question: 'Phone Number', options: [], required: false },
      {
        type: 'multiple', question: 'Year of Study',
        options: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'PG'],
        required: true
      },
      {
        type: 'multiple', question: 'Department',
        options: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Other'],
        required: true
      },
      {
        type: 'multiple', question: 'Program you are registering for',
        options: ['Workshop', 'Seminar', 'Internship', 'Hackathon'],
        required: true
      },
      { type: 'paragraph', question: 'Why do you want to join this program?', options: [], required: false },
    ],
  },
  {
    name: 'Research Proposal Form',
    desc: 'Submit research proposals with objectives and methodology.',
    tag: 'Research',
    fields: '15 fields',
    bg: 'orange-bg',
    questions: [
      { type: 'short', question: 'Researcher Full Name', options: [], required: true },
      { type: 'short', question: 'Guide / Supervisor Name', options: [], required: true },
      { type: 'short', question: 'Department', options: [], required: true },
      { type: 'short', question: 'Research Title', options: [], required: true },
      { type: 'paragraph', question: 'Problem Statement', options: [], required: true },
      { type: 'paragraph', question: 'Literature Review Summary', options: [], required: false },
      { type: 'paragraph', question: 'Research Methodology', options: [], required: true },
      {
        type: 'multiple', question: 'Type of Research',
        options: ['Experimental', 'Theoretical', 'Computational', 'Mixed Methods'],
        required: true
      },
      { type: 'paragraph', question: 'Expected Outcomes', options: [], required: true },
      { type: 'short', question: 'Duration (in months)', options: [], required: true },
    ],
  },
  {
    name: 'Faculty Feedback Form',
    desc: 'Collect anonymous feedback on faculty performance.',
    tag: 'Feedback',
    fields: '10 fields',
    bg: 'green-bg',
    questions: [
      {
        type: 'multiple', question: 'Department',
        options: ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Management'],
        required: true
      },
      { type: 'short', question: 'Faculty Name', options: [], required: true },
      { type: 'scale', question: 'Rate the teaching clarity (1–5)', options: [], required: true },
      { type: 'scale', question: 'Rate faculty availability (1–5)', options: [], required: true },
      { type: 'scale', question: 'Rate the course content quality (1–5)', options: [], required: true },
      {
        type: 'multiple', question: 'Was the syllabus completed on time?',
        options: ['Yes', 'Partially', 'No'],
        required: true
      },
      {
        type: 'checkbox', question: 'What teaching methods were used?',
        options: ['Lecture', 'Presentations', 'Lab Work', 'Case Studies', 'Online Resources'],
        required: false
      },
      { type: 'paragraph', question: 'Suggestions for improvement', options: [], required: false },
    ],
  },
  {
    name: 'Event Registration',
    desc: 'Register participants for seminars, hackathons, and events.',
    tag: 'Events',
    fields: '7 fields',
    bg: 'purple-bg',
    questions: [
      { type: 'short', question: 'Participant Name', options: [], required: true },
      { type: 'short', question: 'Email Address', options: [], required: true },
      { type: 'short', question: 'Institution / College Name', options: [], required: true },
      {
        type: 'multiple', question: 'Event you are registering for',
        options: ['Annual Hackathon', 'Innovation Summit', 'Research Symposium', 'Guest Lecture'],
        required: true
      },
      {
        type: 'multiple', question: 'Participation Mode',
        options: ['In-Person', 'Online'],
        required: true
      },
      {
        type: 'checkbox', question: 'Dietary Preference (if applicable)',
        options: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'No Preference'],
        required: false
      },
      { type: 'paragraph', question: 'Any special requirements or questions', options: [], required: false },
    ],
  },
  {
    name: 'Internship Application',
    desc: 'Let students apply for internship positions easily.',
    tag: 'Education',
    fields: '14 fields',
    bg: 'light-bg',
    questions: [
      { type: 'short', question: 'Full Name', options: [], required: true },
      { type: 'short', question: 'Email', options: [], required: true },
      { type: 'short', question: 'Phone Number', options: [], required: true },
      {
        type: 'multiple', question: 'Internship Domain',
        options: ['Software Development', 'Data Science', 'Marketing', 'Design', 'Research'],
        required: true
      },
      { type: 'short', question: 'Current CGPA', options: [], required: true },
      { type: 'paragraph', question: 'Why are you interested in this internship?', options: [], required: true },
      { type: 'paragraph', question: 'Relevant Skills and Experience', options: [], required: false },
      {
        type: 'multiple', question: 'Availability',
        options: ['Full-time (8 hrs/day)', 'Part-time (4 hrs/day)', 'Weekends only'],
        required: true
      },
      { type: 'date', question: 'Available from', options: [], required: true },
    ],
  },
  {
    name: 'Course Feedback Survey',
    desc: 'End-of-semester feedback form for students.',
    tag: 'Survey',
    fields: '9 fields',
    bg: 'orange-bg',
    questions: [
      { type: 'short', question: 'Course Name & Code', options: [], required: true },
      { type: 'scale', question: 'Overall course satisfaction (1–5)', options: [], required: true },
      { type: 'scale', question: 'Relevance of course content (1–5)', options: [], required: true },
      {
        type: 'multiple', question: 'Preferred learning material',
        options: ['Textbooks', 'Slides', 'Videos', 'Practical Sessions'],
        required: false
      },
      {
        type: 'multiple', question: 'Difficulty level of the course',
        options: ['Very Easy', 'Easy', 'Moderate', 'Difficult', 'Very Difficult'],
        required: true
      },
      { type: 'paragraph', question: 'What did you like most about the course?', options: [], required: false },
      { type: 'paragraph', question: 'What should be improved?', options: [], required: false },
    ],
  },
  {
    name: 'Project Submission Form',
    desc: 'Submit final year projects with documentation.',
    tag: 'Education',
    fields: '11 fields',
    bg: 'green-bg',
    questions: [
      { type: 'short', question: 'Project Title', options: [], required: true },
      { type: 'short', question: 'Team Leader Name', options: [], required: true },
      { type: 'short', question: 'Team Members (comma separated)', options: [], required: false },
      { type: 'short', question: 'Guide Name', options: [], required: true },
      {
        type: 'multiple', question: 'Project Category',
        options: ['Web Application', 'Mobile App', 'Hardware', 'AI/ML', 'IoT', 'Other'],
        required: true
      },
      { type: 'paragraph', question: 'Project Description', options: [], required: true },
      { type: 'paragraph', question: 'Technologies / Tools Used', options: [], required: true },
      { type: 'date', question: 'Project Completion Date', options: [], required: true },
    ],
  },
  {
    name: 'Alumni Contact Form',
    desc: 'Reconnect alumni with the institution network.',
    tag: 'Registration',
    fields: '6 fields',
    bg: 'purple-bg',
    questions: [
      { type: 'short', question: 'Full Name', options: [], required: true },
      { type: 'short', question: 'Graduation Year', options: [], required: true },
      { type: 'short', question: 'Current Employer / Institution', options: [], required: false },
      { type: 'short', question: 'Email Address', options: [], required: true },
      { type: 'short', question: 'LinkedIn Profile URL', options: [], required: false },
      { type: 'paragraph', question: 'Message to the institution', options: [], required: false },
    ],
  },
  {
    name: 'Startup Pitch Application',
    desc: 'Apply to pitch your startup at MCC-MRF Innovation Summit.',
    tag: 'Grant Application',
    fields: '13 fields',
    bg: 'maroon-bg',
    questions: [
      { type: 'short', question: 'Startup Name', options: [], required: true },
      { type: 'short', question: 'Founder Name', options: [], required: true },
      { type: 'short', question: 'Email', options: [], required: true },
      {
        type: 'multiple', question: 'Industry Sector',
        options: ['EdTech', 'HealthTech', 'FinTech', 'AgriTech', 'CleanTech', 'Other'],
        required: true
      },
      { type: 'paragraph', question: 'Problem your startup solves', options: [], required: true },
      { type: 'paragraph', question: 'Your proposed solution', options: [], required: true },
      {
        type: 'multiple', question: 'Current stage',
        options: ['Idea Stage', 'MVP', 'Early Revenue', 'Growth Stage'],
        required: true
      },
      { type: 'short', question: 'Funding required (₹)', options: [], required: false },
      { type: 'paragraph', question: 'Team background and experience', options: [], required: false },
    ],
  },
  {
    name: 'Lab Booking Form',
    desc: 'Reserve lab time slots for research activities.',
    tag: 'Research',
    fields: '5 fields',
    bg: 'light-bg',
    questions: [
      { type: 'short', question: 'Researcher / Student Name', options: [], required: true },
      { type: 'short', question: 'Student ID', options: [], required: true },
      {
        type: 'multiple', question: 'Lab Name',
        options: ['Computer Lab A', 'Electronics Lab', 'Biotech Lab', 'Chemistry Lab', 'Physics Lab'],
        required: true
      },
      { type: 'date', question: 'Booking Date', options: [], required: true },
      {
        type: 'multiple', question: 'Time Slot',
        options: ['9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'],
        required: true
      },
    ],
  },
  {
    name: 'Patient Intake Form',
    desc: 'Collect patient details for healthcare programs.',
    tag: 'Healthcare',
    fields: '16 fields',
    bg: 'orange-bg',
    questions: [
      { type: 'short', question: 'Patient Full Name', options: [], required: true },
      { type: 'date', question: 'Date of Birth', options: [], required: true },
      {
        type: 'multiple', question: 'Gender',
        options: ['Male', 'Female', 'Non-Binary', 'Prefer not to say'],
        required: true
      },
      { type: 'short', question: 'Phone Number', options: [], required: true },
      { type: 'short', question: 'Emergency Contact Name', options: [], required: true },
      { type: 'short', question: 'Emergency Contact Phone', options: [], required: true },
      { type: 'paragraph', question: 'Current Symptoms / Reason for Visit', options: [], required: true },
      {
        type: 'checkbox', question: 'Any known allergies?',
        options: ['Penicillin', 'Aspirin', 'Sulfa Drugs', 'Latex', 'None'],
        required: false
      },
      { type: 'paragraph', question: 'Current medications (if any)', options: [], required: false },
      {
        type: 'multiple', question: 'Insurance available?',
        options: ['Yes', 'No'],
        required: true
      },
    ],
  },
  {
    name: 'Startup Growth & Assessment Form',
    desc: 'Track startup metrics, compliance, and support requirements.',
    tag: 'Assessment',
    fields: '24 fields',
    bg: '#06b6d4',
    questions: [
      { cardType: 'title-desc', question: 'Section 1: Basic Information & Classification', description: '' },
      { type: 'short', question: 'Startup Name', options: [], required: true },
      { type: 'short', question: 'Founder / Point of Contact', options: [], required: true },
      { type: 'short', question: 'Type of Product (e.g., Hardware, SaaS, AI Algorithm, Service)', options: [], required: true },
      { type: 'short', question: 'Sector / Industry (e.g. Deeptech, Healthcare, EdTech, FinTech)', options: [], required: true },
      { type: 'short', question: 'Reporting Period (Month/Year)', options: [], required: true },
      {
        type: 'multiple', question: 'Current Lifecycle Stage',
        options: ['Pre-Seed (Finding the Fit)', 'Seed (Proving the Model)', 'Series A (Scaling Operations)'],
        required: true
      },
      { cardType: 'title-desc', question: 'Section 2: Registration & Compliance', description: 'Essential for verifying eligibility for specific ecosystem grants or benefits.' },
      { type: 'short', question: 'DPIIT Registration Number', description: 'Leave blank if not applicable', options: [], required: true },
      { type: 'short', question: 'MSME / Udyam Registration Number', description: 'Leave blank if not applicable', options: [], required: true },
      { cardType: 'title-desc', question: 'Section 3: Monthly Survival Metrics', description: 'Required for all startups to monitor runway and immediate health.' },
      { type: 'number', question: 'Current Cash Reserves', options: [], required: true },
      { type: 'number', question: 'Gross Monthly Burn Rate', options: [], required: true },
      { type: 'number', question: 'Calculated Cash Runway (Months)', options: [], required: true },
      { type: 'number', question: 'Current Active Users / Customers', options: [], required: true },
      { cardType: 'title-desc', question: 'Section 4: Quarterly Growth Metrics (Unit Economics)', description: 'Required quarterly to assess scale and valuation readiness.' },
      { type: 'number', question: 'Monthly Recurring Revenue (MRR)', options: [], required: true },
      { type: 'number', question: 'Customer Acquisition Cost (CAC)', options: [], required: true },
      { type: 'number', question: 'Customer Lifetime Value (LTV)', options: [], required: true },
      { type: 'number', question: 'Net Revenue Retention (NRR %)', options: [], required: true },
      { cardType: 'title-desc', question: 'Section 5: Strategic Updates & Incubation Support', description: 'To align institutional resources with founder needs.' },
      { type: 'paragraph', question: 'Key Product Milestones Achieved This Period', options: [], required: true },
      { type: 'paragraph', question: 'Current Team Size and Key Hiring Needs', options: [], required: true },
      {
        type: 'checkbox', question: 'Support Required from the Incubation Centre',
        options: ['Capacity Building', 'Client References / Introductions', 'Grant Assistance', 'MVP Building & Technical Support', 'Mentorship / Strategic Advisory', 'Other (Please specify)'],
        required: true
      },
      { type: 'paragraph', question: 'Any additional roadblocks or comments?', options: [], required: true },
      { cardType: 'title-desc', question: 'Section 6: Ecosystem Contribution', description: '' },
      {
        type: 'checkbox', question: 'Student Engagement',
        description: 'Are you currently offering internships, live academic projects, or employment opportunities to the student community?',
        options: ['Yes, currently offering internships', 'Yes, currently offering academic/capstone projects', 'Yes, currently offering full-time employment', 'No, but we plan to in the next 6 months', 'Not at this time'],
        required: true
      },
      {
        type: 'paragraph', question: 'Knowledge Sharing',
        description: 'Have you conducted or participated in any mentorship sessions, guest lectures, or workshops for other startups or students this period?',
        options: [], required: true
      },
      {
        type: 'paragraph', question: 'Peer Collaboration',
        description: 'Have you collaborated, partnered, or shared technical resources with any other startups within the incubator? (If yes, describe the collaboration)',
        options: [], required: true
      },
      {
        type: 'paragraph', question: 'Future Contributions',
        description: 'How do you plan to contribute to the growth and collaborative culture of this innovation ecosystem in the upcoming quarter?',
        options: [], required: true
      }
    ],
  },
];
