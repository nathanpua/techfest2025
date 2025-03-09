import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Determine current URL for redirect
const getURL = () => {
  // Define a hardcoded production URL - this ensures consistency
  const isProd = window.location.hostname !== 'localhost' && 
                window.location.hostname !== '127.0.0.1'
  
  // In production, use the exact URL without any dynamic parts
  if (isProd) {
    return 'https://techfest2025-delta.vercel.app/dashboard'
  }
  
  // In development, use localhost
  return 'http://localhost:5173/dashboard'
}

// Log important environment information
console.log('Environment info:')
console.log('- URL:', window.location.href)
console.log('- Origin:', window.location.origin)
console.log('- Hostname:', window.location.hostname)
console.log('- Redirect URL:', getURL())

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Changed to false to simplify auth flow
    flowType: 'pkce', // Using PKCE flow which is more secure
    redirectTo: getURL(),
    // Use lenient cookie options to avoid cross-site issues
    cookieOptions: {
      sameSite: 'lax',
      secure: true
    }
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Prefer': 'return=minimal'
    }
  }
})