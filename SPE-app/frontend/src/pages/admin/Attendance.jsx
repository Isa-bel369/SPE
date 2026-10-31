import { useEffect, useMemo, useState } from 'react'
import { adminCall, friendlyError } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'

function burstIds(rows) {
  const groups = new Map()
  for (const row of rows.filter((item) => item.method === 'qr' && item.ip_hash && item.ua_family)) {
    const key = `${row.ip_hash}|${row.ua_family}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  const flagged = new Set()
  for (const group of groups.values()) {
    group.sort((a, b) => new Date(a.checked_in_at) - new Date(b.checked_in_at))
    let end = 0
    for (let start = 0; start < group.length; start++) {
      end = Math.max(end, start)
      while (end < group.length && new Date(group[end].checked_in_at) - new Date(group[start].checked_in_at) <= 120000) end++
      if (end - start >= 5) for (let index = start; index < end; index++) flagged.add(group[index].attendance_id)
    }
  }
  return flagged
}

export default function Attendance() {
  const [events, setEvents] = useState([]); const [eventId, setEventId] = useState('')
  const [rows, setRows] = useState([]); const [code, setCode] = useState(''); const [removeRow, setRemoveRow] = useState(null)
  const [reason, setReason] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState('')
  async function loadEvents() { const { data, error: err } = await supabase.from('events').select('id,title,starts_at').order('starts_at', { ascending: false }); if (err) setError(friendlyError(err, 'Could not load events. Refresh the page and try again.')); else { setEvents(data || []); if (!eventId && data?.length) setEventId(data[0].id) } }
  async function loadRows() { if (!eventId) return; const { data, error: err } = await supabase.from('admin_attendance').select('*').eq('event_id', eventId).order('checked_in_at', { ascending: false }); if (err) setError(friendlyError(err, 'Could not load attendance. Refresh the page and try again.')); else setRows(data || []) }
  useEffect(() => { loadEvents() }, [])
  useEffect(() => { loadRows() }, [eventId])
  const flagged = useMemo(() => burstIds(rows), [rows])
  async function manual(event) { event.preventDefault(); setError(''); setNotice(''); try { const value = await adminCall('manual_check_in', { event_id: eventId, member_code: code.trim() }); setNotice(`${value.first_name} checked in. New total: ${value.total_points} points.`); setCode(''); await loadRows() } catch (err) { setError(friendlyError(err, 'Could not record the check-in. Check the member ID and try again.')) } }
  async function remove() { try { const value = await adminCall('remove_check_in', { attendance_id: removeRow.attendance_id, reason }); setNotice(`Check-in removed. New total: ${value.total_points} points.`); setRemoveRow(null); setReason(''); await loadRows() } catch (err) { setError(friendlyError(err, 'Could not remove the check-in. Try again.')) } }
  return <section><h1>Attendance</h1><label>Event<select value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="">Select event</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>{eventId && <><p>{rows.length} check-ins</p><form className="form inline-form" onSubmit={manual}><label>Member ID<input value={code} onChange={(event) => setCode(event.target.value)} maxLength="6" inputMode="numeric" pattern="[1-9][0-9]{5}" required /></label><button className="btn">Manual check-in</button></form><div className="table-scroll"><table className="table"><thead><tr><th>Time</th><th>Member ID</th><th>Name</th><th>Method</th><th>Distance</th><th>Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.attendance_id} className={flagged.has(row.attendance_id) ? 'review-row' : ''} title={flagged.has(row.attendance_id) ? 'Possible shared device or network. Review.' : ''}><td>{formatDate(row.checked_in_at)}</td><td>{row.member_code}</td><td>{row.first_name} {row.last_name}</td><td>{row.method === 'qr' ? 'QR' : 'Manual'}</td><td>{row.distance_m == null ? '—' : `${row.distance_m} m`}</td><td><button className="btn danger" onClick={() => { setRemoveRow(row); setReason('') }}>Remove</button></td></tr>)}</tbody></table></div></>}{error && <p className="alert" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}{removeRow && <div className="modal-backdrop"><section className="card admin-modal"><h2>Remove this check-in?</h2><p>This writes a reversing merit entry. Give a reason.</p>{error && <p className="alert" role="alert">{error}</p>}<label>Reason<textarea minLength="3" maxLength="200" value={reason} onChange={(event) => setReason(event.target.value)} /></label><button className="btn danger" disabled={reason.trim().length < 3} onClick={remove}>Confirm removal</button><button className="btn secondary" onClick={() => { setRemoveRow(null); setError('') }}>Cancel</button></section></div>}</section>
}
