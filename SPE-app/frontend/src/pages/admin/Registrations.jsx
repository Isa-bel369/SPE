import { useCallback, useEffect, useState } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { adminCall } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'
import { dateOnly } from '../../lib/format'

const PAGE_SIZE = 25
const columns = ['member_code', 'first_name', 'last_name', 'email', 'phone', 'programme', 'year_of_study', 'created_at', 'total_points']
const headers = ['Member ID', 'First name', 'Last name', 'Email', 'Phone', 'Programme', 'Year', 'Registered on', 'Total points']

function queryRows(filters, ranged = true) {
  let query = supabase.from('admin_registrations').select('*', { count: 'exact' })
  if (filters.programme) query = query.eq('programme', filters.programme)
  if (filters.year) query = query.eq('year_of_study', filters.year)
  const term = filters.search.trim()
  if (term) {
    const safe = term.replace(/[,.()]/g, ' ').replace(/[%]/g, '\\%')
    query = query.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%${/^[1-9]\d{5}$/.test(term) ? `,member_code.eq.${term}` : ''}`)
  }
  query = query.order(filters.sort, { ascending: filters.ascending })
  if (ranged) query = query.range(filters.page * PAGE_SIZE, filters.page * PAGE_SIZE + PAGE_SIZE - 1)
  return query
}

export default function Registrations() {
  const { roles } = useAuth()
  const canDelete = roles.includes('technical_head')
  const [filters, setFilters] = useState({ search: '', programme: '', year: '', sort: 'created_at', ascending: false, page: 0 })
  const [rows, setRows] = useState([]); const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const load = useCallback(async () => {
    setLoading(true); setError('')
    const { data, count: total, error: requestError } = await queryRows(filters)
    if (requestError) setError('Could not load registrations. Check access and retry.')
    else { setRows(data || []); setCount(total || 0) }
    setLoading(false)
  }, [filters])
  useEffect(() => { load() }, [load])
  function setFilter(key, value) { setFilters((state) => ({ ...state, [key]: value, page: 0 })) }
  async function exportFile(format) {
    setNotice(''); setError('')
    try {
      await adminCall('log_export', { format, row_count: count })
      const all = []
      for (let from = 0; from < count; from += 1000) {
        const filtersOnly = { ...filters, page: 0 }
        let query = queryRows(filtersOnly, false).range(from, from + 999)
        const { data, error: fetchError } = await query
        if (fetchError) throw fetchError
        all.push(...(data || []))
      }
      const values = all.map((row) => columns.map((column) => column === 'created_at' ? dateOnly(row[column]) : row[column] ?? ''))
      const day = new Date().toISOString().slice(0, 10)
      if (format === 'csv') {
        const csv = '\uFEFF' + Papa.unparse({ fields: headers, data: values })
        const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = `spe-umat-registrations-${day}.csv`; link.click(); URL.revokeObjectURL(link.href)
      } else {
        const sheet = XLSX.utils.aoa_to_sheet([headers, ...values]); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, sheet, 'Registrations'); XLSX.writeFile(book, `spe-umat-registrations-${day}.xlsx`)
      }
    } catch (err) { setError(err.message || 'Export failed. No file was created.') }
  }
  async function deleteMember(row) {
    if (!window.confirm(`Permanently delete ${row.first_name} ${row.last_name} (${row.member_code}) and their attendance and points?`)) return
    try { await adminCall('delete_member', { member_id: row.id }); setNotice('Member deleted.'); load() }
    catch (err) { setError(err.message) }
  }
  const programmes = ['Petroleum Engineering', 'Natural Gas Engineering', 'Mining Engineering', 'Geological Engineering', 'Geomatics Engineering', 'Mechanical Engineering', 'Electrical and Electronic Engineering', 'Computer Science and Engineering', 'Other']
  return <section><h1>Registrations</h1><div className="admin-filters"><input aria-label="Search registrations" placeholder="Search name, email or exact member ID" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} /><select value={filters.programme} onChange={(event) => setFilter('programme', event.target.value)}><option value="">All programmes</option>{programmes.map((value) => <option key={value}>{value}</option>)}</select><select value={filters.year} onChange={(event) => setFilter('year', event.target.value)}><option value="">All years</option>{['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'].map((value) => <option key={value}>{value}</option>)}</select><button className="btn secondary" onClick={() => exportFile('csv')}>CSV</button><button className="btn secondary" onClick={() => exportFile('xlsx')}>Excel</button></div>{error && <p className="alert" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}<p>{count} matching registrations</p>{loading ? <p role="status">Loading registrations…</p> : rows.length ? <div className="table-scroll"><table className="table"><thead><tr>{['Member ID', 'Name', 'Email', 'Phone', 'Programme', 'Year', 'Registered', 'Points', ...(canDelete ? ['Actions'] : [])].map((label, index) => <th key={label}><button className="sort-button" onClick={() => setFilters((state) => ({ ...state, sort: ['member_code', 'first_name', 'email', 'phone', 'programme', 'year_of_study', 'created_at', 'total_points'][index] || state.sort, ascending: !state.ascending }))}>{label}</button></th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.member_code}</td><td>{row.first_name} {row.last_name}</td><td>{row.email}</td><td>{row.phone}</td><td>{row.programme}</td><td>{row.year_of_study}</td><td>{dateOnly(row.created_at)}</td><td>{row.total_points}</td>{canDelete && <td><button className="btn danger" onClick={() => deleteMember(row)}>Delete</button></td>}</tr>)}</tbody></table></div> : <p>No registrations match these filters.</p>}<div className="pagination"><button className="btn secondary" disabled={!filters.page} onClick={() => setFilters((state) => ({ ...state, page: state.page - 1 }))}>Previous</button><span>Page {filters.page + 1} of {Math.max(1, Math.ceil(count / PAGE_SIZE))}</span><button className="btn secondary" disabled={(filters.page + 1) * PAGE_SIZE >= count} onClick={() => setFilters((state) => ({ ...state, page: state.page + 1 }))}>Next</button></div></section>
}
