import { useEffect, useState } from 'react'
import { adminCall, friendlyError } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'

const ROLES = ['communications_head', 'organization_head', 'technical_head']
const LABELS = { communications_head: 'Communications Head', organization_head: 'Organization Head', technical_head: 'Technical Head' }

export default function Admins() {
  const { session } = useAuth()
  const [admins, setAdmins] = useState([]); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { try { const result = await adminCall('list_admins'); setAdmins(result.admins || []) } catch (err) { setError(friendlyError(err, 'Could not load admin accounts. Try again.')) } }
  useEffect(() => { load() }, [])
  async function invite(event) { event.preventDefault(); setBusy(true); setError(''); setMessage(''); const fields = new FormData(event.currentTarget); try { await adminCall('invite_admin', { email: fields.get('email'), role: fields.get('role') }); setMessage('Invitation sent.'); event.currentTarget.reset(); await load() } catch (err) { setError(friendlyError(err, 'Could not send the invitation. Check the email and try again.')) } finally { setBusy(false) } }
  async function changeRole(user_id, role, action) { try { await adminCall('set_user_role', { user_id, role, action }); if (user_id === session.user.id) await supabase.auth.refreshSession(); await load() } catch (err) { setError(friendlyError(err, 'Could not update the admin role. Try again.')) } }
  return <section><h1>Admins</h1><form className="form card" onSubmit={invite}><h2>Invite admin</h2><label>Email<input name="email" type="email" required /></label><label>Role<select name="role">{ROLES.map((role) => <option key={role} value={role}>{LABELS[role]}</option>)}</select></label><button className="btn" disabled={busy}>{busy ? 'Sending…' : 'Invite admin'}</button></form>{admins.map((admin) => <article className="card" key={admin.user_id}><h2>{admin.email}</h2><p>Last sign in: {admin.last_sign_in_at || 'Never'}</p>{ROLES.map((role) => <div className="role-row" key={role}><span>{LABELS[role]}</span><span>{admin.roles.includes(role) ? <button className="btn danger" onClick={() => changeRole(admin.user_id, role, 'remove')}>Remove role</button> : <button className="btn secondary" onClick={() => changeRole(admin.user_id, role, 'add')}>Add role</button>}</span></div>)}</article>)}{error && <p className="alert" role="alert">{error}</p>}{message && <p role="status">{message}</p>}</section>
}
