import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Features.css';
import logo from '../../images/iconLanding.png';
import ourAnalysisImg from '../../images/instantanalysis.png';
import reliabilityScoreImg from '../../images/reliabilityscore.png';
import biasDetectionImg from '../../images/biasdetection.png';
import scanHistoryImg from '../../images/scanhistory.png';
import logoImg from '../../images/iconLanding.png';

const Features = () => {
  return (
    <div className="features-container">
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
      <section className="features-hero">
        <div className="features-hero-content">
          <h1>Powerful <span className="highlight">Features</span></h1>
          <p className="subtitle">Discover how our AI-powered tools can help you navigate the information landscape</p>
        </div>
      </section>

      {/* Analysis Feature */}
      <section id="analysis" className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <span className="feature-badge">01</span>
            <h2>Instant Analysis</h2>
            <p>
              Our advanced AI algorithms can analyze any news article or content in seconds, providing you with 
              comprehensive insights that would take hours to research manually.
            </p>
            <ul className="feature-list">
              <li>
                <span className="list-icon">✓</span>
                <span>Analyze full articles or specific paragraphs</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Process content from any news source or website</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Get results in seconds, not minutes or hours</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Save and compare analyses over time</span>
              </li>
            </ul>
          </div>
          <div className="feature-image">
          <img 
              src={ourAnalysisImg} 
              alt="Instant Analysis" 
              className="analysis-image"
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

      {/* Reliability Score Feature */}
      <section id="reliability" className="feature-section alt-bg">
        <div className="feature-grid reverse">
          <div className="feature-content">
            <span className="feature-badge">02</span>
            <h2>Reliability Score</h2>
            <p>
              Our proprietary reliability scoring system evaluates content across multiple dimensions to provide 
              a comprehensive assessment of its trustworthiness and accuracy.
            </p>
            <ul className="feature-list">
              <li>
                <span className="list-icon">✓</span>
                <span>Source credibility evaluation</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Fact verification against trusted databases</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Citation and reference analysis</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Historical accuracy tracking of sources</span>
              </li>
            </ul>
          </div>
          <div className="feature-image">
          <img 
              src={reliabilityScoreImg} 
              alt="Reliability Score" 
              className="reliability-image"
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

      {/* Bias Detection Feature */}
      <section id="bias" className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <span className="feature-badge">03</span>
            <h2>Bias Detection</h2>
            <p>
              Our sophisticated bias detection algorithms identify political leanings, emotional manipulation techniques, 
              and other forms of bias that might influence how information is presented.
            </p>
            <ul className="feature-list">
              <li>
                <span className="list-icon">✓</span>
                <span>Political bias spectrum analysis</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Emotional language detection</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Loaded terminology identification</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Narrative framing assessment</span>
              </li>
            </ul>
          </div>
          <div className="feature-image">
          <img 
              src={biasDetectionImg} 
              alt="Bias Detection" 
              className="detection-image"
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

      {/* History Feature */}
      <section id="history" className="feature-section alt-bg">
        <div className="feature-grid reverse">
          <div className="feature-content">
            <span className="feature-badge">04</span>
            <h2>Scan History</h2>
            <p>
              Keep track of all your previous analyses and build a personal database of evaluated content that 
              you can reference and compare over time.
            </p>
            <ul className="feature-list">
              <li>
                <span className="list-icon">✓</span>
                <span>Unlimited scan history storage</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Organize scans by topic, source, or date</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Compare multiple analyses side by side</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Export and share your findings</span>
              </li>
            </ul>
          </div>
          <div className="feature-image">
          <img 
              src={scanHistoryImg} 
              alt="Scan History" 
              className="history-image"
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

      {/* Browser Extension Feature */}
      <section id="extension" className="feature-section">
        <div className="feature-grid">
          <div className="feature-content">
            <span className="feature-badge">05</span>
            <h2>Browser Extension</h2>
            <p>
              Our browser extension brings the power of Exposé directly to your browsing experience, allowing you to 
              analyze content without leaving the page you're reading.
            </p>
            <ul className="feature-list">
              <li>
                <span className="list-icon">✓</span>
                <span>One-click analysis of any article</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Real-time reliability indicators</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Available for Chrome, Firefox, and Edge</span>
              </li>
              <li>
                <span className="list-icon">✓</span>
                <span>Seamless integration with your Exposé account</span>
              </li>
            </ul>
          </div>
          <div className="feature-image">
          <img 
              src={logoImg} 
              alt="Logo" 
              className="logo-image"
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

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to get started?</h2>
          <p>Join thousands of users who are already using Exposé to navigate the information landscape.</p>
          <Link to="/register" className="primary-button">Register Now</Link>
        </div>
      </section>
    </div>
  );
};

export default Features; 