import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import toast from 'react-hot-toast'
import { analyzeArticle, checkOpenAIApiKey } from './openai'
import { setupDatabase, testDatabaseConnection } from './setupDatabase'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Auth from './components/Auth'
import Dashboard from './components/Dashboard'
import History from './components/History'
import Settings from './components/Settings'
import Navigation from './components/Navigation'
import Landing from './components/Landing'
import About from './components/About'
import Features from './components/Features'
import Education from './components/Education'

function App() {
  const [user, setUser] = useState(null)
  const [scans, setScans] = useState([])
  const [dbReady, setDbReady] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('dark')

  // Function to apply theme - always dark mode
  const applyTheme = () => {
    // Always set to dark theme
    setTheme('dark')
    document.documentElement.classList.add('dark')
  }

  useEffect(() => {
    // Apply dark theme immediately when the app loads
    applyTheme();
    
    // Function to fetch user's settings (but not theme, as we always use dark)
    const fetchTheme = async () => {
      if (user) {
        try {
          // First, check if the user_settings table exists
          const { error: tableCheckError } = await supabase
            .from('user_settings')
            .select('count(*)', { count: 'exact', head: true })
            .limit(1);
          
          // If the table doesn't exist, create it
          if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
            console.log('user_settings table does not exist, using default settings');
            return;
          }
          
          // Now try to get the user's settings (but ignore theme setting)
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (error) {
            console.error('Error fetching user settings:', error);
            return;
          }
          
          if (data) {
            console.log('User settings loaded:', data);
            
            // If the user has a theme setting that's not dark, update it to dark
            if (data.theme !== 'dark') {
              try {
                await supabase
                  .from('user_settings')
                  .update({ theme: 'dark' })
                  .eq('user_id', user.id);
                console.log('Updated user theme to dark');
              } catch (updateError) {
                console.error('Error updating theme to dark:', updateError);
              }
            }
          } else {
            console.log('No settings found for user, creating default settings');
            // Create default settings for the user with dark theme
            try {
              await supabase
                .from('user_settings')
                .upsert([
                  { user_id: user.id, theme: 'dark', created_at: new Date() }
                ]);
              console.log('Created default settings with dark theme');
            } catch (insertError) {
              console.error('Error creating default settings:', insertError);
            }
          }
        } catch (error) {
          console.error('Unexpected error in fetchTheme:', error);
        }
      }
    };

    // Call the function to fetch user settings
    fetchTheme();
  }, [user])

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        setUser(data.session.user)
      }
      setLoading(false)
    }
    
    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )
    
    // Check database and API key
    const checkSetup = async () => {
      // Check OpenAI API key
      const openAIKeyValid = await checkOpenAIApiKey();
      setApiKeyValid(openAIKeyValid);
      
      if (!openAIKeyValid) {
        console.warn('OpenAI API key is invalid or not set. Check your .env file.');
      }
      
      // Check database connection
      const connectionOk = await testDatabaseConnection()
      if (!connectionOk) {
        console.error('Database connection failed. Check your Supabase credentials.')
        return
      }
      
      const schemaOk = await setupDatabase()
      if (!schemaOk) {
        console.error('Database schema issue. Check console for details.')
        return
      }
      
      setDbReady(true)
    }
    
    checkUser()
    checkSetup()
    
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe()
      }
    }
  }, [])

  useEffect(() => {
    // Fetch scans when user changes
    if (user && dbReady) {
      fetchScans()
      
      // Set up real-time subscription to scans table
      const scansSubscription = supabase
        .channel('scans-channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('New scan inserted:', payload)
          // Add the new scan to the scans state without refetching everything
          if (payload.new) {
            setScans(currentScans => {
              // Check if the scan is already in the list
              const exists = currentScans.some(scan => scan.id === payload.new.id)
              if (!exists) {
                // Add the new scan at the beginning of the array (newest first)
                return [payload.new, ...currentScans]
              }
              return currentScans
            })
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Scan deleted:', payload)
          // Remove the deleted scan from the scans state without refetching everything
          if (payload.old) {
            setScans(currentScans => 
              currentScans.filter(scan => scan.id !== payload.old.id)
            )
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'scans',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          console.log('Scan updated:', payload)
          // Update the scan in the scans state without refetching everything
          if (payload.new) {
            setScans(currentScans => 
              currentScans.map(scan => 
                scan.id === payload.new.id ? payload.new : scan
              )
            )
          }
        })
        .subscribe()
      
      // Clean up subscription when component unmounts
      return () => {
        scansSubscription.unsubscribe()
      }
    }
  }, [user, dbReady])

  const fetchScans = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Failed to fetch scans:', error)
        toast.error('Failed to fetch scans')
        return
      }
      
      setScans(data || [])
    } catch (error) {
      console.error('Error fetching scans:', error)
      toast.error('Failed to fetch scans')
    }
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard'
  }

  const handleSignOut = () => {
    setUser(null)
    setScans([])
    // Redirect to home page after sign out
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<Features />} />
          <Route path="/education" element={<Education />} />
          <Route path="/auth" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/login" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
          <Route path="/register" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
          
          {/* Protected routes */}
          <Route
            path="/dashboard/*"
            element={
              user ? (
                <>
                  <Navigation user={user} onSignOut={handleSignOut} />
                  <main>
                    <Dashboard 
                      user={user} 
                      scans={scans} 
                      fetchScans={fetchScans}
                      dbReady={dbReady}
                      apiKeyValid={apiKeyValid}
                    />
                  </main>
                </>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/analyze"
            element={
              user ? (
                <>
                  <Navigation user={user} onSignOut={handleSignOut} />
                  <main>
                    <Dashboard user={user} scans={scans} fetchScans={fetchScans} />
                  </main>
                </>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/history"
            element={
              user ? (
                <>
                  <Navigation user={user} onSignOut={handleSignOut} />
                  <main>
                    <History user={user} scans={scans} fetchScans={fetchScans} />
                  </main>
                </>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route
            path="/settings"
            element={
              user ? (
                <>
                  <Navigation user={user} onSignOut={handleSignOut} />
                  <main>
                    <Settings user={user} theme={theme} />
                  </main>
                </>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App