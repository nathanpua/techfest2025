import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Determine current URL for redirect
const getURL = () => {
  let url =
    import.meta.env.VITE_SITE_URL ??  // Set this environment variable in Vercel
    import.meta.env.VITE_VERCEL_URL ?? // Automatically set by Vercel
    'http://localhost:5173/'
  
  // Make sure to include `https://` when not localhost
  url = url.includes('http') ? url : `https://${url}`
  
  // Make sure to include trailing slash
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
  
  return url
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo: getURL()
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