import './Features.css';

const features = [
  {
    icon: '🎨',
    title: 'Drag & Drop Builder',
    desc: 'Intuitive visual builder that lets you design beautiful forms in minutes. No coding knowledge needed.',
    tag: 'No Code',
  },
  {
    icon: '📊',
    title: 'Real-time Analytics',
    desc: 'Track submissions, completion rates, and user behavior with powerful dashboards and reports.',
    tag: 'Insights',
  },
  {
    icon: '🔐',
    title: 'Secure & Compliant',
    desc: 'Enterprise-grade encryption and data security. Fully compliant with institutional data policies.',
    tag: 'Security',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    desc: 'Forms load instantly with optimized delivery. Zero lag even with thousands of concurrent users.',
    tag: 'Performance',
  },
  {
    icon: '🔗',
    title: 'Easy Integrations',
    desc: 'Connect with Google Sheets, email platforms, payment gateways, and 100+ tools seamlessly.',
    tag: 'Integrations',
  },
  {
    icon: '📱',
    title: 'Mobile Responsive',
    desc: 'Every form looks perfect on any device — phone, tablet, or desktop. Fully adaptive layouts.',
    tag: 'Cross-device',
  },
];

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="features-header">
          <div className="section-badge">✦ Features</div>
          <h2 className="features-title">
            Everything you need to build <span className="gradient-text">great forms</span>
          </h2>
          <p className="features-subtitle">
            Powerful tools designed for researchers, educators, and innovators at MCC-MRF Innovation Park.
          </p>
        </div>

        <div className="features-grid">
          {features.map((f, i) => (
            <div className="feature-card" key={i} id={`feature-card-${i}`}>
              <div className="feature-icon-wrap">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
