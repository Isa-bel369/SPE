import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'

export default function AdminLogin() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (session) return <Navigate to="/admin" replace />
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true)
    const fields = new FormData(event.currentTarget)
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: fields.get('email'), password: fields.get('password') })
    if (authError || !data.session) {
      setError(authError?.code === 'email_provider_disabled'
        ? 'Email sign-in is disabled in Supabase. Enable the Email provider in Authentication settings.'
        : 'Email or password is incorrect.')
      setBusy(false)
      return
    }
    let roles = []
    try { roles = JSON.parse(atob(data.session.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).app_roles || [] } catch {}
    if (!roles.length) { await supabase.auth.signOut(); setError('This account has no access.'); setBusy(false); return }
    navigate('/admin', { replace: true })
  }
  return <section className="section admin-login"><h1>Admin sign in</h1><form className="form" onSubmit={submit}><label>Email<input type="email" name="email" autoComplete="username" required /></label><label>Password<input type="password" name="password" autoComplete="current-password" required /></label><button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form>{error && <p className="alert" role="alert">{error}</p>}<Link to="/admin/reset-password">Forgot password?</Link></section>
}
