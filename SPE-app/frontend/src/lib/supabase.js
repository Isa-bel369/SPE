import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const SITE_URL = typeof window !== 'undefined' ? window.location.origin : import.meta.env.VITE_SITE_URL || ''
export const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY || ''

export function getSupabaseConfigError() {
  if (!SUPABASE_URL || /<project-ref>|project-not-configured/i.test(SUPABASE_URL)) {
    return 'Supabase is not configured. Set VITE_SUPABASE_URL in frontend/.env.local.'
  }
  if (!SUPABASE_ANON_KEY || /<public-anon-key>|public-anon-key-not-configured/i.test(SUPABASE_ANON_KEY)) {
    return 'Supabase is not configured. Set VITE_SUPABASE_ANON_KEY in frontend/.env.local.'
  }
  return ''
}

export const isSupabaseConfigured = !getSupabaseConfigError()

export const supabase = createClient(
  SUPABASE_URL || 'https://project-not-configured.supabase.co',
  SUPABASE_ANON_KEY || 'public-anon-key-not-configured',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)
