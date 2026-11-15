import { createClient } from 'npm:@supabase/supabase-js@2'

const url = Deno.env.get('SUPABASE_URL')
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
if (!url || !serviceKey) throw new Error('Supabase function environment is incomplete')

export const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
