import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Link } from 'react-router-dom'

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState({
    location: '',
    supabaseURL: '',
    authStorageKey: '',
    localStorageKeys: [],
    cookies: [],
    currentUser: null,
    session: null,
    error: null
  })

  const [testEmail, setTestEmail] = useState('')
  const [testPassword, setTestPassword] = useState('test123456') // Default simple password
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    gatherDebugInfo()
  }, [])

  const gatherDebugInfo = async () => {
    try {
      // Get location info
      const locationInfo = {
        href: window.location.href,
        origin: window.location.origin,
        hostname: window.location.hostname,
        pathname: window.location.pathname
      }

      // Get localStorage keys
      const localStorageKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        localStorageKeys.push(localStorage.key(i))
      }

      // Get cookie info
      const cookieInfo = document.cookie.split(';').map(c => c.trim())

      // Get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      // Get user
      let userData = null
      let userError = null
      try {
        const userResponse = await supabase.auth.getUser()
        userData = userResponse.data?.user || null
        userError = userResponse.error || null
      } catch (e) {
        userError = e.message
      }

      setDebugInfo({
        location: locationInfo,
        supabaseURL: import.meta.env.VITE_SUPABASE_URL || 'Not available',
        authStorageKey: 'supabase.auth.token',
        localStorageKeys,
        cookies: cookieInfo,
        currentUser: userData,
        session: sessionData?.session || null,
        sessionError: sessionError?.message || null,
        userError: userError
      })
    } catch (error) {
      console.error('Error gathering debug info:', error)
      setDebugInfo(prev => ({
        ...prev,
        error: error.message
      }))
    }
  }

  const testAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setTestResult(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })

      setTestResult({
        success: !error,
        data: JSON.stringify(data, null, 2),
        error: error ? JSON.stringify(error, null, 2) : null
      })

      if (!error) {
        // Wait a moment and refresh debug info to show updated session
        setTimeout(() => {
          gatherDebugInfo()
        }, 1000)
      }
    } catch (error) {
      setTestResult({
        success: false,
        data: null,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>Authentication Debugging</h1>
      <p>This page helps diagnose Supabase authentication issues.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#b388ff', fontWeight: 'bold' }}>
          &larr; Back to Home
        </Link>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Test Authentication</h2>
        <form onSubmit={testAuth} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
          <div>
            <label htmlFor="testEmail" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div>
            <label htmlFor="testPassword" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input
              id="testPassword"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '10px', 
              backgroundColor: '#b388ff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Testing...' : 'Test Sign In'}
          </button>
        </form>

        {testResult && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: testResult.success ? 'rgba(72, 187, 120, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '4px',
            border: `1px solid ${testResult.success ? 'rgb(72, 187, 120)' : 'rgb(239, 68, 68)'}`
          }}>
            <h3 style={{ margin: '0 0 10px', color: testResult.success ? 'rgb(72, 187, 120)' : 'rgb(239, 68, 68)' }}>
              Test Result: {testResult.success ? 'Success' : 'Failed'}
            </h3>
            {testResult.data && (
              <div>
                <h4>Data:</h4>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#f7f7f7', padding: '10px' }}>
                  {testResult.data}
                </pre>
              </div>
            )}
            {testResult.error && (
              <div>
                <h4>Error:</h4>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', backgroundColor: '#f7f7f7', padding: '10px' }}>
                  {testResult.error}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <button 
        onClick={gatherDebugInfo}
        style={{ 
          padding: '8px 15px', 
          backgroundColor: '#4b5563', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Refresh Debug Info
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        <InfoSection title="Location Info" data={debugInfo.location} />
        <InfoSection title="Supabase Config" data={{
          supabaseURL: debugInfo.supabaseURL,
          authStorageKey: debugInfo.authStorageKey
        }} />
        <InfoSection title="Current User" data={debugInfo.currentUser} error={debugInfo.userError} />
        <InfoSection title="Current Session" data={debugInfo.session} error={debugInfo.sessionError} />
        <InfoSection title="Local Storage Keys" data={debugInfo.localStorageKeys} isList />
        <InfoSection title="Cookies" data={debugInfo.cookies} isList />
      </div>

      {debugInfo.error && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '4px',
          color: 'rgb(239, 68, 68)'
        }}>
          <strong>Error gathering debug info:</strong> {debugInfo.error}
        </div>
      )}
    </div>
  )
}

const InfoSection = ({ title, data, error, isList = false }) => {
  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: 'rgba(37, 99, 235, 0.05)', 
      borderRadius: '4px',
      border: '1px solid rgba(37, 99, 235, 0.2)'
    }}>
      <h3 style={{ margin: '0 0 10px', color: '#2563eb' }}>{title}</h3>
      
      {error && (
        <div style={{ 
          marginBottom: '10px', 
          padding: '8px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '4px',
          color: 'rgb(239, 68, 68)'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {isList ? (
        <ul style={{ margin: '0', paddingInlineStart: '20px' }}>
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <li key={index}>{item}</li>
            ))
          ) : (
            <li style={{ color: '#888' }}>No items</li>
          )}
        </ul>
      ) : (
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word', 
          backgroundColor: '#f7f7f7', 
          padding: '10px', 
          margin: '0',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {data ? JSON.stringify(data, null, 2) : 'No data'}
        </pre>
      )}
    </div>
  )
}

export default AuthDebug 