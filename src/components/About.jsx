import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/About.css';
import logo from '../../images/iconLanding.png';
import ourMissionImg from '../../images/ourmission.png';
import ourStoryImg from '../../images/ourstory.png';
import kejunImg from '../../images/kejun.png';
import nathanImg from '../../images/nathan.png';
import stephImg from '../../images/steph.png';
import kaiwenImg from '../../images/kaiwen.png';

const About = () => {
  return (
    <div className="about-container">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="logo">
          <h1 style={{ 
            color: '#b388ff', 
            fontWeight: 'bold', 
            fontFamily: 'Copperplate, serif',
            fontStyle: 'italic',
            fontSize: '2.5rem'
          }}>Exposé</h1>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/education">Education</Link>
          <Link to="/features">Features</Link>
          <Link to="/login" className="cta-button">Sign In</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content">
          <h1>About <span className="highlight">Exposé</span></h1>
          <p className="subtitle">Uncovering the truth in a world of misinformation</p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="about-section">
        <div className="about-grid">
          <div className="about-content">
            <h2>Our Mission</h2>
            <p>
              In today's digital landscape, misinformation spreads faster than ever before. At Exposé, we believe that 
              everyone deserves access to reliable information. Our mission is to empower readers with the tools they 
              need to identify bias, detect misinformation, and make informed decisions about the content they consume.
            </p>
            <p>
              We've built a powerful AI-driven platform that analyzes news articles and content in real-time, providing 
              you with comprehensive reliability scores and detailed breakdowns of potential biases or misleading information.
            </p>
          </div>
          <div className="about-image">
            <img 
              src={ourMissionImg} 
              alt="Our Mission" 
              className="mission-image"
              style={{
                borderRadius: '16px',
                width: '100%',
                height: 'auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            />
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="about-section alt-bg">
        <div className="about-grid reverse">
          <div className="about-content">
            <h2>Our Story</h2>
            <p>
              Exposé was founded in 2025 by a team of students from Nanyang Technological University who were concerned 
              about the growing spread of misinformation online. We recognized that traditional fact-checking methods 
              couldn't keep pace with the volume of content being published every day.
            </p>
            <p>
              By leveraging cutting-edge AI technology, we've created a solution that can analyze articles in seconds, 
              identifying patterns of bias, emotional manipulation, factual inconsistencies, and other indicators of 
              potentially misleading content.
            </p>
          </div>
          <div className="about-image">
            <img 
              src={ourStoryImg} 
              alt="Our Story" 
              className="story-image"
              style={{
                borderRadius: '16px',
                width: '100%',
                height: 'auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-section">
        <h2 className="section-title">Our Team</h2>
        <div className="team-grid">
          <div className="team-member">
          <img 
              src={kejunImg} 
              alt="kejun" 
              className="kejun-image"
              style={{
                borderRadius: '16px',
                width: '100%',
                height: 'auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            />
            <h3>Yeo Ke Jun</h3>
            <p className="member-title">Contributor</p>
            <p className="member-bio">Year 2 Computer Science Undergraduate at Nanyang Technological University, Singapore</p>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/ke-jun-yeo-16a4a9208/" target="_blank" rel="noopener noreferrer" className="social-button linkedin">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/yeokjunn" target="_blank" rel="noopener noreferrer" className="social-button github">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
          <div className="team-member">
          <img 
              src={nathanImg} 
              alt="nathan" 
              className="nathan-image"
              style={{
                borderRadius: '16px',
                width: '100%',
                height: 'auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            />
            <h3>Nathan Pua</h3>
            <p className="member-title">Contributor</p>
            <p className="member-bio">Year 2 Data Science & Artificial Intelligence Undergraduate at Nanyang Technological University, Singapore</p>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/nathan-pua-7063562ab" target="_blank" rel="noopener noreferrer" className="social-button linkedin">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/nathanpua" target="_blank" rel="noopener noreferrer" className="social-button github">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
          <div className="team-member">
          <img 
              src={stephImg} 
              alt="steph" 
              className="steph-image"
              style={{
                borderRadius: '16px',
                width: '100%',
                height: 'auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            />
            <h3>Stephanie Heather Zaw</h3>
            <p className="member-title">Contributor</p>
            <p className="member-bio">Year 2 Computer Science Undergraduate at Nanyang Technological University, Singapore</p>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/stephanie-heather-zaw" target="_blank" rel="noopener noreferrer" className="social-button linkedin">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/stephan0b" target="_blank" rel="noopener noreferrer" className="social-button github">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
          <div className="team-member">
          <img 
              src={kaiwenImg} 
              alt="kaiwen" 
              className="kaiwen-image"
              style={{
                borderRadius: '16px',
                width: '100%',
                height: 'auto',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
              }}
            />
            <h3>Tay Kai Wen</h3>
            <p className="member-title">Contributor</p>
            <p className="member-bio">Year 2 Data Science & Artificial Intelligence Undergraduate at Nanyang Technological University, Singapore</p>
            <div className="social-links">
              <a href="https://www.linkedin.com/in/tay-kai-wen/" target="_blank" rel="noopener noreferrer" className="social-button linkedin">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
              <a href="https://github.com/newiakyat" target="_blank" rel="noopener noreferrer" className="social-button github">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-section alt-bg">
        <h2 className="section-title">Our Values</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">
              <span style={{ fontSize: '3rem' }}>⚖️</span>
            </div>
            <h3>Transparency</h3>
            <p>We believe in complete transparency in our methodology and analysis process.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <span style={{ fontSize: '3rem' }}>🔍</span>
            </div>
            <h3>Accuracy</h3>
            <p>We're committed to providing the most accurate and reliable analysis possible.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <span style={{ fontSize: '3rem' }}>🛡️</span>
            </div>
            <h3>Independence</h3>
            <p>We remain politically neutral and independent from external influences.</p>
          </div>
          <div className="value-card">
            <div className="value-icon">
              <span style={{ fontSize: '3rem' }}>🌐</span>
            </div>
            <h3>Accessibility</h3>
            <p>We believe reliable information should be accessible to everyone.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Join our mission</h2>
          <p>Help us fight misinformation and promote media literacy. Start using Exposé today.</p>
          <Link to="/register" className="primary-button">Get Started</Link>
        </div>
      </section>
    </div>
  );
};

export default About; 