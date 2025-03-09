import React, { useState, useEffect, useRef } from 'react'   
import { supabase } from '../supabase'
import toast from 'react-hot-toast'
import AnimatedBackground from '../utils/animatedBackground'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/Settings.css'
// import { useState, useEffect } from 'react'

const Settings = ({ user, theme }) => {
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    website: '',
    avatar_url: ''
  })
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [apiKey, setApiKey] = useState('')
  // const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true
  })
  const [activeTab, setActiveTab] = useState('profile')
  
  // Refs for animated background
  const backgroundRef = useRef(null)
  const animatedBgRef = useRef(null)
  const navigate = useNavigate()
  
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

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchSettings()
    }
  }, [user])

  const fetchProfile = async () => {
    try {
      console.log("Fetching profile for user ID:", user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error("Error fetching profile:", error);
        console.error("Error details:", error.message, error.code, error.details);
        
        // If the error is not a "not found" error, show a toast message
        if (error.code !== 'PGRST116') {
          toast.error(`Failed to load profile: ${error.message}`);
        } else {
          console.log("Profile not found, will create one when user updates profile");
        }
        return;
      }

      if (data) {
        console.log("Profile data loaded successfully:", data);
        setProfile({
          full_name: data.full_name || '',
          website: data.website || '',
          avatar_url: data.avatar_url || ''
        })
      } else {
        console.log("No profile data found for user");
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      toast.error('Failed to load profile information');
    }
  }

  const fetchSettings = async () => {
    try {
      console.log("Fetching settings for user ID:", user.id);
      
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);
      
      if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
        console.log("user_settings table does not exist");
        return;
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching settings:", error);
        console.error("Error details:", error.message, error.code, error.details);
        
        // Show error toast for all errors except "not found"
        if (error.code !== 'PGRST116') {
          toast.error(`Failed to load settings: ${error.message}`);
        } else {
          console.log("Settings not found, will create when user updates settings");
        }
        return;
      }

      if (data) {
        console.log("Settings data loaded successfully:", data);
        setApiKey(data.openai_api_key || '')
       // setTheme(data.theme || 'light')
        setNotifications({
          email: data.email_notifications ?? true,
          browser: data.browser_notifications ?? true
        })
      } else {
        console.log("No settings data found for user");
      }
    } catch (error) {
      console.error('Error in fetchSettings:', error);
      toast.error('Failed to load settings information');
    }
  }

  const updateProfile = async () => {
    setLoading(true)
    try {
      console.log("Updating profile for user ID:", user.id);
      
      // Check if profile exists first
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error("Error checking if profile exists:", checkError);
        throw checkError;
      }
      
      // Prepare the profile data
      const profileData = {
        id: user.id,
        full_name: profile.full_name,
        website: profile.website,
        avatar_url: profile.avatar_url,
        updated_at: new Date()
      };
      
      // If profile doesn't exist, add created_at
      if (!existingProfile) {
        console.log("Profile doesn't exist, creating new profile");
        profileData.created_at = new Date();
      } else {
        console.log("Profile exists, updating existing profile");
      }
      
      // Upsert the profile
      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) {
        console.error("Error upserting profile:", error);
        console.error("Error details:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log("Profile updated successfully");
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    if (password.new !== password.confirm) {
      toast.error('New passwords do not match')
      return
    }

    if (password.new.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: password.new
      })

      if (error) throw error
      
      toast.success('Password updated successfully')
      setPassword({ current: '', new: '', confirm: '' })
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error(error.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const updateApiKey = async () => {
    setLoading(true)
    try {
      console.log("Updating API key for user ID:", user.id);
      
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);
      
      if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
        console.log("user_settings table does not exist, attempting to create it");
        toast.error('Settings table does not exist. Please contact support.');
        return;
      }
      
      // Check if settings exist first
      const { data: existingSettings, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking if settings exist:", checkError);
        throw checkError;
      }
      
      // Prepare the settings data
      const settingsData = {
        user_id: user.id,
        openai_api_key: apiKey,
        updated_at: new Date()
      };
      
      // If settings don't exist, add created_at and default values
      if (!existingSettings) {
        console.log("Settings don't exist, creating new settings");
        settingsData.created_at = new Date();
        settingsData.theme = theme;
        settingsData.email_notifications = notifications.email;
        settingsData.browser_notifications = notifications.browser;
      } else {
        console.log("Settings exist, updating existing settings");
      }
      
      // Upsert the settings
      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData);

      if (error) {
        console.error("Error upserting settings:", error);
        console.error("Error details:", error.message, error.code, error.details);
        throw error;
      }
      
      console.log("API key updated successfully");
      toast.success('API key updated successfully')
    } catch (error) {
      console.error('Error updating API key:', error)
      toast.error('Failed to update API key')
    } finally {
      setLoading(false)
    }
  }

  const updateNotifications = async () => {
    setLoading(true)
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('user_settings')
        .select('count')
        .limit(1);
      
      if (tableCheckError && (tableCheckError.code === '42P01' || tableCheckError.message.includes('does not exist'))) {
        console.log("user_settings table does not exist, attempting to create it");
        toast.error('Settings table does not exist. Please contact support.');
        return;
      }
      
      // Check if the user already has settings
      const { data: existingSettings } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const settingsData = {
        user_id: user.id,
        email_notifications: notifications.email,
        browser_notifications: notifications.browser,
        updated_at: new Date()
      };
      
      // If no existing settings, add created_at
      if (!existingSettings) {
        settingsData.created_at = new Date();
      }
      
      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData);

      if (error) {
        console.error("Error updating notifications:", error);
        throw error;
      }

      toast.success('Notification settings updated successfully')
    } catch (error) {
      console.error('Error updating notifications:', error)
      toast.error('Failed to update notification settings')
    } finally {
      setLoading(false)
    }
  }

  // Function to handle sign out
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="settings-container">
      {/* Animated Background */}
      <div className="animated-background" ref={backgroundRef}></div>
      
      {/* Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-logo">
          <h1>Exposé</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/history" className="nav-link">History</Link>
          <Link to="/settings" className="nav-link active">Settings</Link>
          <button onClick={handleSignOut} className="sign-out-button">Sign Out</button>
        </div>
      </nav>
      
      {/* Keep the existing content, just wrap it in a container for z-index */}
      <div className="settings-content">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>
          
          {/* User ID Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Browser Extension Setup</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your User ID
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  readOnly
                  value={user?.id || ''}
                  className="flex-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 sm:text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(user?.id || '');
                    toast.success('User ID copied to clipboard!');
                  }}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Copy this ID and paste it in the browser extension settings to link your scanned articles to your account.
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="sm:flex sm:divide-x dark:divide-gray-700">
              {/* Sidebar */}
              <nav className="sm:w-64 p-6 space-y-1 sm:pr-8">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'profile'
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'security'
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Security
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'api'
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  API Keys
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === 'notifications'
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  Notifications
                </button>
              </nav>
              
              {/* Content */}
              <div className="p-6 sm:w-full sm:flex-1">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Profile Information</h2>
                    <div className="space-y-6">
                      <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            id="email"
                            value={user.email}
                            disabled
                            className="bg-gray-100 dark:bg-gray-700 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md text-gray-500 dark:text-gray-300"
                          />
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Your email cannot be changed
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Full Name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            id="full_name"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Website
                        </label>
                        <div className="mt-1">
                          <input
                            type="url"
                            id="website"
                            value={profile.website}
                            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      {/*
                      <div className="pt-5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={updateProfile}
                            disabled={loading}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Change Password</h2>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Password
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            id="current_password"
                            value={password.current}
                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          New Password
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            id="new_password"
                            value={password.new}
                            onChange={(e) => setPassword({ ...password, new: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm New Password
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            id="confirm_password"
                            value={password.confirm}
                            onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                      {/*
                      <div className="pt-5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={updatePassword}
                            disabled={loading || !password.current || !password.new || !password.confirm}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {loading ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </div> */}
                    </div>
                  </div>
                )}
                
                {activeTab === 'api' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">API Keys</h2>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="openai_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          OpenAI API Key
                        </label>
                        <div className="mt-1">
                          <input
                            type="password"
                            id="openai_api_key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="sk-..."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Your OpenAI API key is stored securely and used for article analysis
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={updateApiKey}
                            disabled={loading}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save API Key'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Notification Settings</h2>
                    <div className="space-y-6">
                      <div>
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="email_notifications"
                                type="checkbox"
                                checked={notifications.email}
                                onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="email_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                                Email Notifications
                              </label>
                              <p className="text-gray-500">Receive email notifications about your scans and account activity</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="browser_notifications"
                                type="checkbox"
                                checked={notifications.browser}
                                onChange={(e) => setNotifications({ ...notifications, browser: e.target.checked })}
                                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="browser_notifications" className="font-medium text-gray-700 dark:text-gray-300">
                                Browser Notifications
                              </label>
                              <p className="text-gray-500">Receive browser notifications when scans are completed</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={updateNotifications}
                            disabled={loading}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                          >
                            {loading ? 'Saving...' : 'Save Preferences'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 