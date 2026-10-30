import { useEffect, useState } from 'react'
import { adminCall } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'

export default function MeritTracker() {
  const [members, setMembers] = useState([])
  const [search, setSearch] = useState('')
  const [member, setMember] = useState(null)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function loadMembers() {
    const { data, error: requestError } = await supabase.from('admin_registrations')
      .select('id,member_code,first_name,last_name,total_points').order('total_points', { ascending: false })
    if (requestError) setError(requestError.message)
    else setMembers(data || [])
  }
  useEffect(() => { loadMembers() }, [])

  async function select(row) {
    setMember(row)
    const { data, error: requestError } = await supabase.from('admin_merit').select('*')
      .eq('member_id', row.id).order('created_at', { ascending: false })
    if (requestError) setError(requestError.message)
    else setHistory(data || [])
  }

  async function adjust(event) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    setError(''); setNotice('')
    try {
      const result = await adminCall('adjust_merit', {
        member_code: member.member_code,
        points: Number(fields.get('points')),
        reason: fields.get('reason'),
      })
      setNotice(`Merit updated. New total: ${result.total_points}.`)
      form.reset()
      await loadMembers()
      await select(member)
    } catch (requestError) { setError(requestError.message) }
  }

  const filtered = members.filter((row) => `${row.first_name} ${row.last_name} ${row.member_code}`.toLowerCase().includes(search.toLowerCase()))
  return <section>
    <h1>Merit tracker</h1>
    <input placeholder="Search member" value={search} onChange={(event) => setSearch(event.target.value)} />
    <div className="admin-split">
      <div><ul className="member-list">{filtered.map((row) => <li key={row.id}><button className="linkish" onClick={() => select(row)}>{row.first_name} {row.last_name} · {row.total_points} pts</button></li>)}</ul></div>
      <div>{member ? <>
        <h2>{member.first_name} {member.last_name}</h2><p>Total: {member.total_points} points</p>
        <h3>History</h3>
        {history.length ? history.map((row) => <article className="card" key={row.id}><strong>{row.event_title || 'Adjustment'} · {row.points} points</strong><p>{formatDate(row.created_at)}</p>{row.reason && <p>{row.reason}</p>}</article>) : <p className="muted">No merit records yet.</p>}
        <h3>Adjust points</h3><p>The reason is visible to the member.</p>
        <form className="form" onSubmit={adjust}><label>Points<input name="points" type="number" min="-100" max="100" required /></label><label>Reason<textarea name="reason" minLength="3" maxLength="200" required /></label><button className="btn">Save adjustment</button></form>
      </> : <p>Select a member to view their merit history.</p>}</div>
    </div>
    {error && <p className="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
  </section>
}
