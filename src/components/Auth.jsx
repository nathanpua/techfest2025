import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import '../styles/Auth.css'

const Auth = ({ onAuthSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [authError, setAuthError] = useState(null)
  const navigate = useNavigate()
  
  // Clear any auth errors when switching between sign-in/sign-up
  useEffect(() => {
    setAuthError(null)
  }, [isSignUp])

  const handleAuth = async (e) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please enter both email and password')
      return
    }
    
    setLoading(true)
    setAuthError(null)
    
    try {
      let result
      
      if (isSignUp) {
        // Sign up
        console.log('Attempting to sign up with email:', email)
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              email: email
            }
          }
        })
      } else {
        // Sign in - using signInWithPassword which is more reliable for Vercel deployments
        console.log('Attempting to sign in with email:', email)
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }
      
      const { error, data } = result
      
      if (error) {
        console.error('Auth error details:', error)
        setAuthError(error.message)
        throw error
      }
      
      console.log('Auth successful, data:', data)
      
      if (isSignUp && data?.user) {
        toast.success('Registration successful! Please check your email for verification.')
      } else if (data?.user) {
        toast.success('Signed in successfully!')
        onAuthSuccess(data.user)
        // Add a small delay before redirecting to ensure state is updated
        setTimeout(() => {
          navigate('/dashboard')
        }, 500)
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
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
        </div>
      </nav>

      <div className="auth-content">
        <div className="circle-container">
          <div className="purple-circle">
            <div className="auth-card">
              <div className="auth-header">
                <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                <p>{isSignUp ? 'Join our community fighting misinformation' : 'Sign in to continue your journey'}</p>
              </div>
              
              <form onSubmit={handleAuth} className="auth-form">
                {authError && (
                  <div className="auth-error" style={{ 
                    padding: '10px', 
                    marginBottom: '15px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                    borderRadius: '6px', 
                    color: '#ef4444', 
                    fontSize: '14px' 
                  }}>
                    <strong>Error:</strong> {authError}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-button"
                >
                  {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>
              
              <div className="auth-toggle">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="toggle-button"
                >
                  {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="floating-elements">
            <div className="floating-element" style={{ top: '15%', left: '15%', animationDelay: '0s' }}></div>
            <div className="floating-element" style={{ top: '75%', left: '20%', animationDelay: '1s' }}></div>
            <div className="floating-element" style={{ top: '25%', right: '15%', animationDelay: '2s' }}></div>
            <div className="floating-element" style={{ top: '65%', right: '20%', animationDelay: '3s' }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Auth 