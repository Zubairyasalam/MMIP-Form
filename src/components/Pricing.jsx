import './Pricing.css';

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    priceNum: null,
    desc: 'Perfect for individuals and small teams getting started.',
    features: [
      '5 Forms',
      '100 submissions/month',
      'Basic analytics',
      'Email notifications',
      'Standard templates',
    ],
  },
  {
    name: 'Professional',
    price: '₹999',
    priceNum: '999',
    period: '/month',
    desc: 'For departments and research groups needing more power.',
    features: [
      'Unlimited forms',
      '10,000 submissions/month',
      'Advanced analytics dashboard',
      'File uploads & payments',
      'Custom branding',
      'Priority support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    priceNum: null,
    desc: 'Full institutional deployment with SLA and dedicated support.',
    features: [
      'Unlimited everything',
      'SSO & LDAP integration',
      'On-premise deployment',
      'API access',
      'Dedicated account manager',
      '24/7 enterprise support',
    ],
  },
];

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="pricing-header">
          <div className="section-badge">💳 Pricing</div>
          <h2 className="pricing-title">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="pricing-subtitle">
            Choose the plan that fits your needs. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, i) => (
            <div className={`pricing-card${plan.popular ? ' popular' : ''}`} key={i} id={`pricing-card-${i}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}

              <div className="pricing-plan-name">{plan.name}</div>

              <div className="pricing-price">
                {plan.priceNum ? (
                  <>
                    <span className="pricing-currency">₹</span>
                    <span className="pricing-amount">{plan.priceNum}</span>
                    <span className="pricing-period">{plan.period}</span>
                  </>
                ) : (
                  <span className="pricing-amount" style={{ fontSize: '2rem' }}>{plan.price}</span>
                )}
              </div>

              <p className="pricing-desc">{plan.desc}</p>
              <div className="pricing-divider" />

              <ul className="pricing-features-list">
                {plan.features.map((f, j) => (
                  <li className="pricing-feature-item" key={j}>
                    <div className="pricing-check">✓</div>
                    {f}
                  </li>
                ))}
              </ul>

              <button className="pricing-cta" id={`pricing-cta-${i}`}>
                {plan.priceNum ? 'Get Started' : plan.priceNum === null && plan.name === 'Starter' ? 'Start Free' : 'Contact Us'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
