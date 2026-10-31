import { useState } from 'react'
import { callFn, friendlyError } from '../lib/api'
import { dateOnly } from '../lib/format'
import { memberCodeSchema } from '../schemas/forms'

export default function Merit() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null)
    const member_code = String(new FormData(event.currentTarget).get('member_code')).trim()
    const parsed = memberCodeSchema.safeParse(member_code)
    if (!parsed.success) { setError(parsed.error.issues[0].message); setBusy(false); return }
    try { setResult(await callFn('merit_lookup', { member_code })) }
    catch (err) { setError(friendlyError(err, 'Could not look up your merit points. Check your member ID and try again.')) }
    finally { setBusy(false) }
  }
  return <section className="section"><h1>Check my merit</h1><form className="form" onSubmit={submit}><label>6-digit membership ID<input name="member_code" inputMode="numeric" pattern="[0-9]*" maxLength="6" autoComplete="off" required onBlur={(event) => { const parsed = memberCodeSchema.safeParse(event.target.value); if (!parsed.success) setError(parsed.error.issues[0].message) }} /></label><button className="btn" disabled={busy}>{busy ? 'Looking up…' : 'Show my points'}</button></form>{error && <p role="alert" className="alert">{error}</p>}{result && <div className="merit-result"><h2>Hello, {result.first_name}</h2><p className="stat">Total points: <strong>{result.total_points}</strong></p><h3>Events attended</h3>{result.attendance.length ? <ul>{result.attendance.map((row, index) => <li key={`${row.event_title}-${index}`}>{row.event_title} · {dateOnly(row.event_date)} · {row.points} points</li>)}</ul> : <p className="muted">No event attendance yet.</p>}<h3>Adjustments</h3>{result.adjustments.length ? <ul>{result.adjustments.map((row, index) => <li key={`${row.created_at}-${index}`}>{dateOnly(row.created_at)} · {row.points} points · {row.reason}</li>)}</ul> : <p className="muted">No merit adjustments yet.</p>}</div>}</section>
}
