import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';
import logo from '../../images/iconLanding.png';
import AnimatedBackground from '../utils/animatedBackground';

// Import tech logos
const openaiLogo = "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg";
const supabaseLogo = "https://seeklogo.com/images/S/supabase-logo-DCC676FFE2-seeklogo.com.png";
const reactLogo = "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg";
const viteLogo = "https://vitejs.dev/logo-with-shadow.png";

// Define official brand colors
const brandColors = {
  openai: {
    background: 'rgba(241, 231, 231, 0.22)',
    text: '#FFFFFF'
  },
  supabase: {
    background: 'rgba(62, 207, 142, 0.1)',
    text: '#3ECF8E'
  },
  react: {
    background: 'rgba(97, 218, 251, 0.1)',
    text: '#61DAFB'
  },
  vite: {
    background: 'rgba(118, 74, 188, 0.1)',
    text: '#764ABC'
  }
};

const Landing = () => {
  const circleRef = useRef(null);
  const containerRef = useRef(null);
  const animatedBgRef = useRef(null);
  const backgroundRef = useRef(null);
  
  // Initialize animated background
  useEffect(() => {
    if (backgroundRef.current) {
      const animatedBg = new AnimatedBackground(backgroundRef.current);
      animatedBgRef.current = animatedBg;
      
      // Clean up on unmount
      return () => {
        if (animatedBgRef.current) {
          animatedBgRef.current.destroy();
        }
      };
    }
  }, []);

  // Add mouse movement effect to the circle
  useEffect(() => {
    const circle = circleRef.current;
    const container = containerRef.current;
    
    if (!circle || !container) return;
    
    const handleMouseMove = (e) => {
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      // Calculate position relative to the center of the container
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Calculate the movement offset (limited to 30px in any direction)
      const offsetX = (x - centerX) / centerX * 30;
      const offsetY = (y - centerY) / centerY * 30;
      
      // Apply the transform with a slight delay for a smoother effect
      circle.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    };
    
    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="landing-container">
      {/* Animated Background */}
      <div className="animated-background" ref={backgroundRef}></div>
      
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
      <section className="hero-section" ref={containerRef}>
        <div className="glow-overlay"></div>
        <div className="hero-content">
          <h1>
            <span className="welcome-text">WELCOME TO</span>
            <span className="main-title">Exposé</span>
          </h1>
          <p className="hero-description">
            Analyze news articles for misinformation and bias with our powerful AI tools.
            Get instant reliability scores and detailed analysis to make informed decisions.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="primary-button">Get Started</Link>
            <Link to="/about" className="secondary-button">Learn More</Link>
          </div>
        </div>
        <div className="hero-image">
          <div className="image-container">
            <div className="purple-circle" ref={circleRef}>
              <div className="circle-inner">
                <img src="/images/iconLanding.png" alt="Exposé Logo" className="circle-image" />
              </div>
              <div className="circle-pulse"></div>
              <div className="circle-particles">
                <div className="particle particle-1"></div>
                <div className="particle particle-2"></div>
                <div className="particle particle-3"></div>
                <div className="particle particle-4"></div>
                <div className="particle particle-5"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Our Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(124, 77, 255, 0.4) 100%)', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 20px rgba(124, 77, 255, 0.3)'
            }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
            </div>
            <h3>AI Analysis</h3>
            <p>Get instant analysis of news articles and content</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(124, 77, 255, 0.4) 100%)', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 20px rgba(124, 77, 255, 0.3)'
            }}>
              <span style={{ fontSize: '3rem' }}>⚖️</span>
            </div>
            <h3>Bias Detection</h3>
            <p>Identify political bias and emotional manipulation techniques</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(124, 77, 255, 0.4) 100%)', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 20px rgba(124, 77, 255, 0.3)'
            }}>
              <span style={{ fontSize: '3rem' }}>📊</span>
            </div>
            <h3>Scan History</h3>
            <p>Keep track of all your previous scans and analyses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(124, 77, 255, 0.4) 100%)', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 20px rgba(124, 77, 255, 0.3)'
            }}>
              <span style={{ fontSize: '3rem' }}>🔌</span>
            </div>
            <h3>Browser Extension</h3>
            <p>Analyze content directly while browsing with our convenient extension</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(124, 77, 255, 0.4) 100%)', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 20px rgba(124, 77, 255, 0.3)'
            }}>
              <span style={{ fontSize: '3rem' }}>🔍</span>
            </div>
            <h3>Reliability Scoring</h3>
            <p>Get instant reliability scores for any news article based on factual accuracy, source credibility, and bias detection</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" style={{ 
              background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.2) 0%, rgba(124, 77, 255, 0.4) 100%)', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 10px 20px rgba(124, 77, 255, 0.3)'
            }}>
              <span style={{ fontSize: '3rem' }}>📄</span>
            </div>
            
            <h3>Image Analysis</h3>
            <p>Upload images to detect signs of AI generation or manipulation. The application converts the image to base64 format and analyzes it using OpenAI's GPT-4o model, providing a confidence score and detailed evidence of any findings.</p>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="sponsors-section">
        <h2>Powered By</h2>
        <div className="sponsors-grid">
          <div className="sponsor-logo">
            <div style={{ 
              background: brandColors.openai.background, 
              padding: '20px', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100px',
              gap: '15px',
            }}>
              <img 
                src={openaiLogo} 
                alt="OpenAI" 
                style={{ 
                  maxHeight: '40px', 
                  maxWidth: '40%',
                  objectFit: 'contain'
                }} 
              />
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: brandColors.openai.text
              }}>OpenAI</span>
            </div>
          </div>
          <div className="sponsor-logo">
            <div style={{ 
              background: brandColors.supabase.background, 
              padding: '20px', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100px',
              gap: '15px'
            }}>
              <img 
                src={supabaseLogo} 
                alt="Supabase" 
                style={{ 
                  maxHeight: '40px', 
                  maxWidth: '40%',
                  objectFit: 'contain'
                }} 
              />
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: brandColors.supabase.text
              }}>Supabase</span>
            </div>
          </div>
          <div className="sponsor-logo">
            <div style={{ 
              background: brandColors.react.background, 
              padding: '20px', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100px',
              gap: '15px'
            }}>
              <img 
                src={reactLogo} 
                alt="React" 
                style={{ 
                  maxHeight: '40px', 
                  maxWidth: '40%',
                  objectFit: 'contain'
                }} 
              />
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: brandColors.react.text
              }}>React</span>
            </div>
          </div>
          <div className="sponsor-logo">
            <div style={{ 
              background: brandColors.vite.background, 
              padding: '20px', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100px',
              gap: '15px'
            }}>
              <img 
                src={viteLogo} 
                alt="Vite" 
                style={{ 
                  maxHeight: '40px', 
                  maxWidth: '40%',
                  objectFit: 'contain'
                }} 
              />
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: 'bold',
                color: brandColors.vite.text
              }}>Vite</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Join us now.</h2>
          <p>This is your chance to be part of a community that's fighting misinformation. Secure your spot today.</p>
          <Link to="/register" className="primary-button">Register Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <h2 style={{ color: '#b388ff', fontWeight: 'bold' }}>Exposé</h2>
        </div>
        <div className="footer-links">
          <div className="footer-section">
            <h4>Legal</h4>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
          <div className="footer-section">
            <h4>Resources</h4>
            <Link to="/faq">FAQ</Link>
            <Link to="/support">Support</Link>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <a href="mailto:contact@expose.com">Email</a>
            <a href="https://twitter.com/expose" target="_blank" rel="noopener noreferrer">Twitter</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Exposé. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 