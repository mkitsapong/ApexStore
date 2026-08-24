import { createClient } from '@supabase/supabase-js'

// Sanitize and trim environment variables
let rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
if (rawUrl) {
  // Remove /rest/v1 or any subpath and trailing slashes
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
}
const supabaseUrl = rawUrl
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

/**
 * Check if valid Supabase credentials have been configured
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
)

/**
 * Supabase client instance (or dummy instance if not configured yet)
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null

if (!isSupabaseConfigured) {
  console.info('⚡ [ApexStore] Supabase is running in local/demo mode. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env to connect to live Supabase.')
} else {
  console.info('⚡ [ApexStore] Supabase client initialized successfully.')
}

export default supabase
