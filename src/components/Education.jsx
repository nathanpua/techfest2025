import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Education.css';

const Education = () => {
  return (
    <div className="education-container">
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
      <section className="education-hero">
        <div className="education-hero-content">
          <h1>Understanding <span className="highlight">Misinformation</span></h1>
          <p className="subtitle">Learn to navigate the complex landscape of online information</p>
        </div>
      </section>

      {/* Core Concepts Section */}
      <section className="concepts-section">
        <h2>Core Concepts</h2>
        <div className="education-grid">
          <div className="education-card">
            <div className="education-icon">
              <span style={{ fontSize: '3rem' }}>🔄</span>
            </div>
            <h3>How Misinformation Spreads</h3>
            <div className="education-content">
              <ul>
                <li>Social media algorithms amplify engaging content</li>
                <li>Emotional manipulation triggers quick sharing</li>
                <li>Echo chambers reinforce existing beliefs</li>
                <li>Rapid sharing without fact-checking</li>
                <li>Coordinated disinformation campaigns</li>
                <li>Clickbait and sensationalized headlines</li>
              </ul>
            </div>
          </div>

          <div className="education-card">
            <div className="education-icon">
              <span style={{ fontSize: '3rem' }}>✔️</span>
            </div>
            <h3>Evaluating Sources</h3>
            <div className="education-content">
              <ul>
                <li>Verify author credentials and expertise</li>
                <li>Check publication date and updates</li>
                <li>Look for cited sources and references</li>
                <li>Cross-reference with trusted outlets</li>
                <li>Examine the website's reputation</li>
                <li>Consider potential biases or conflicts</li>
              </ul>
            </div>
          </div>

          <div className="education-card">
            <div className="education-icon">
              <span style={{ fontSize: '3rem' }}>🎯</span>
            </div>
            <h3>Fact vs. Opinion</h3>
            <div className="education-content">
              <ul>
                <li>Facts are verifiable through evidence</li>
                <li>Opinions reflect personal viewpoints</li>
                <li>Look for evidence-based claims</li>
                <li>Identify emotional manipulation</li>
                <li>Recognize loaded language</li>
                <li>Understand context and nuance</li>
              </ul>
            </div>
          </div>

          <div className="education-card">
            <div className="education-icon">
              <span style={{ fontSize: '3rem' }}>🛡️</span>
            </div>
            <h3>Protection Strategies</h3>
            <div className="education-content">
              <ul>
                <li>Use reputable fact-checking websites</li>
                <li>Consult multiple reliable sources</li>
                <li>Be aware of personal biases</li>
                <li>Question extraordinary claims</li>
                <li>Develop critical thinking skills</li>
                <li>Practice digital literacy</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Guide Section */}
      <section className="guide-section">
        <h2>Comprehensive Guide</h2>
        <div className="guide-grid">
          <div className="guide-card">
            <h3>Red Flags to Watch For</h3>
            <ul>
              <li>Excessive pop-ups and advertisements</li>
              <li>Unusual domain names or URLs</li>
              <li>Poor grammar and spelling</li>
              <li>Missing author information</li>
              <li>No publication dates</li>
              <li>Lack of external sources</li>
            </ul>
          </div>

          <div className="guide-card">
            <h3>Verification Tools</h3>
            <ul>
              <li>Google Reverse Image Search</li>
              <li>Snopes.com</li>
              <li>FactCheck.org</li>
              <li>PolitiFact</li>
              <li>Reuters Fact Check</li>
              <li>AFP Fact Check</li>
            </ul>
          </div>

          <div className="guide-card">
            <h3>Best Practices</h3>
            <ul>
              <li>Read beyond headlines</li>
              <li>Check publication dates</li>
              <li>Verify author credentials</li>
              <li>Look for original sources</li>
              <li>Consider multiple viewpoints</li>
              <li>Share responsibly</li>
            </ul>
          </div>

          <div className="guide-card">
            <h3>Common Manipulation Tactics</h3>
            <ul>
              <li>Appeal to emotions</li>
              <li>False equivalence</li>
              <li>Cherry-picked data</li>
              <li>Out-of-context quotes</li>
              <li>Conspiracy theories</li>
              <li>Manufactured outrage</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Quick Tips Section */}
      <section className="quick-tips-section">
        <h2>Quick Reference Guide</h2>
        <div className="tips-grid">
          <div className="tip-item">
            <span className="tip-number">1</span>
            <div>
              <h4>Check the Source</h4>
              <p>Verify the website's legitimacy, author credentials, and publication history</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-number">2</span>
            <div>
              <h4>Verify Claims</h4>
              <p>Cross-reference information with multiple reliable sources</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-number">3</span>
            <div>
              <h4>Check Images</h4>
              <p>Use reverse image search to verify authenticity and context</p>
            </div>
          </div>
          <div className="tip-item">
            <span className="tip-number">4</span>
            <div>
              <h4>Consider Context</h4>
              <p>Look for the full story, including when and where it happened</p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="resources-section">
        <h2>Additional Resources</h2>
        <div className="resources-grid">
          <a href="https://www.snopes.com" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-card">
              <h4>Snopes</h4>
              <p>Leading fact-checking website</p>
            </div>
          </a>
          <a href="https://www.factcheck.org" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-card">
              <h4>FactCheck.org</h4>
              <p>Nonpartisan fact-checking resource</p>
            </div>
          </a>
          <a href="https://www.politifact.com" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-card">
              <h4>PolitiFact</h4>
              <p>Political fact-checking platform</p>
            </div>
          </a>
          <a href="https://www.reuters.com/fact-check" target="_blank" rel="noopener noreferrer" className="resource-link">
            <div className="resource-card">
              <h4>Reuters Fact Check</h4>
              <p>Global news fact-checking</p>
            </div>
          </a>
        </div>
      </section>

    </div>
  );
};

export default Education; 