import { useEffect, useState } from 'react'
import { adminCall, friendlyError } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'

const PAGE_SIZE = 50
export default function AuditLog() {
  const [rows, setRows] = useState([]); const [admins, setAdmins] = useState({}); const [page, setPage] = useState(0)
  const [action, setAction] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [error, setError] = useState('')
  useEffect(() => { adminCall('list_admins').then((result) => setAdmins(Object.fromEntries(result.admins.map((row) => [row.user_id, row.email])))).catch((err) => setError(friendlyError(err, 'Could not load admin names. Refresh the page and try again.'))) }, [])
  useEffect(() => {
    let query = supabase.from('audit_logs').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
    if (action) query = query.eq('action', action)
    if (from) query = query.gte('created_at', new Date(`${from}T00:00:00Z`).toISOString())
    if (to) query = query.lte('created_at', new Date(`${to}T23:59:59Z`).toISOString())
    query.then(({ data, error: err }) => { if (err) setError(friendlyError(err, 'Could not load the audit log. Refresh the page and try again.')); else { setRows(data || []); setError('') } })
  }, [page, action, from, to])
  return <section><h1>Audit log</h1><div className="admin-filters"><input aria-label="Filter by action" placeholder="Action" value={action} onChange={(event) => { setAction(event.target.value); setPage(0) }} /><label>From<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(0) }} /></label><label>To<input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(0) }} /></label></div>{error && <p className="alert" role="alert">{error}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>When</th><th>Admin</th><th>Action</th><th>Details</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.created_at)}</td><td>{admins[row.user_id] || row.user_id}</td><td>{row.action}</td><td><details><summary>View</summary><pre>{JSON.stringify(row.details, null, 2)}</pre></details></td></tr>)}</tbody></table></div><div className="pagination"><button className="btn secondary" disabled={!page} onClick={() => setPage((value) => value - 1)}>Previous</button><span>Page {page + 1}</span><button className="btn secondary" disabled={rows.length < PAGE_SIZE} onClick={() => setPage((value) => value + 1)}>Next</button></div></section>
}
