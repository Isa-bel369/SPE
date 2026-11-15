import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin
export const CAPTCHA_SITE_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY || ''
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = createClient(
  SUPABASE_URL || 'https://project-not-configured.supabase.co',
  SUPABASE_ANON_KEY || 'public-anon-key-not-configured',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
)
