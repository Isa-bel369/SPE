import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE_URL, supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'

export default function AdminPassword({ invite = false }) {
  const { session } = useAuth()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const recovery = Boolean(session)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const fields = new FormData(event.currentTarget)
    if (recovery) {
      const password = String(fields.get('password'))
      if (password.length < 12) { setError('Use a password with at least 12 characters.'); setBusy(false); return }
      if (password !== fields.get('confirm')) { setError('The passwords do not match.'); setBusy(false); return }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) setError('Password could not be updated. Request a new link and try again.')
      else { setMessage('Password set. You can sign in now.'); await supabase.auth.signOut() }
    } else {
      const email = String(fields.get('email')).trim()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/admin/reset-password` })
      if (resetError) setError('Password reset email could not be sent.')
      else setMessage('If the account exists, a password reset email has been sent.')
    }
    setBusy(false)
  }
  return <section className="section admin-login"><h1>{recovery ? 'Set your password' : invite ? 'Accept admin invitation' : 'Reset password'}</h1>{recovery ? <form className="form" onSubmit={submit}><label>New password<input name="password" type="password" minLength="12" required autoComplete="new-password" /></label><label>Confirm password<input name="confirm" type="password" minLength="12" required autoComplete="new-password" /></label><button className="btn" disabled={busy}>Set password</button></form> : <form className="form" onSubmit={submit}><label>Email<input name="email" type="email" required autoComplete="email" /></label><button className="btn" disabled={busy}>Send reset link</button></form>}{error && <p className="alert" role="alert">{error}</p>}{message && <p role="status">{message}</p>}<Link to="/admin/login">Back to sign in</Link></section>
}
