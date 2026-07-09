import './About.css';

export default function About() {
  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about-inner">
          {/* Visual */}
          <div className="about-visual">
            <div className="about-image-card">
              <img src="/mcc-mrf-logo.png?v=2" alt="MCC-MRF" className="about-logo-display" />
              <div className="about-card-text">
                <h3>Madras Christian College</h3>
                <p>MCC-MRF Innovation Park — Empowering student and faculty innovation since 2018</p>
              </div>
            </div>

            <div className="about-stat-float top-right">
              <div className="float-stat-num">150+</div>
              <div className="float-stat-label">Projects Supported</div>
            </div>
            <div className="about-stat-float bottom-left">
              <div className="float-stat-num">18+</div>
              <div className="float-stat-label">Years of Excellence</div>
            </div>
          </div>

          {/* Content */}
          <div className="about-content">
            <div className="section-badge">🏛️ About Us</div>
            <h2 className="about-title">
              Powering Innovation at <span className="gradient-text">MCC-MRF</span>
            </h2>
            <p className="about-desc">
              MCC-MRF Innovation Park at Madras Christian College is a premier hub for entrepreneurship,
              research, and technological innovation. Our form management platform was built to
              streamline data collection across all innovation programs.
            </p>
            <p className="about-desc">
              From grant applications to feedback surveys, we help faculty and students focus on
              what matters — creating meaningful impact through research and innovation.
            </p>

            <div className="about-pillars">
              <div className="about-pillar">
                <div className="about-pillar-icon">🚀</div>
                <div>
                  <div className="about-pillar-title">Innovation First</div>
                  <div className="about-pillar-desc">Supporting cutting-edge research and startup ideas from conception to launch.</div>
                </div>
              </div>
              <div className="about-pillar">
                <div className="about-pillar-icon">🤝</div>
                <div>
                  <div className="about-pillar-title">Community Driven</div>
                  <div className="about-pillar-desc">Building a collaborative ecosystem for students, faculty, and industry partners.</div>
                </div>
              </div>
              <div className="about-pillar">
                <div className="about-pillar-icon">📚</div>
                <div>
                  <div className="about-pillar-title">Research Excellence</div>
                  <div className="about-pillar-desc">Fostering academic research with industry-standard tools and infrastructure.</div>
                </div>
              </div>
            </div>

            <div className="about-actions">
              <a href="#learn-more" className="btn-primary" id="about-learn-more-btn">
                <span>Learn More</span>
              </a>
              <a href="#contact" className="btn-secondary" id="about-contact-btn">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
