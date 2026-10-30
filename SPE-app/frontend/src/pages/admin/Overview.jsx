import { useQuery } from '../../hooks/useQuery'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'
import { formatDate } from '../../lib/format'
import DataState from '../../components/DataState'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

async function loadOverview(roles) {
  const output = {}
  const registrationRoles = ['organization_head', 'technical_head'].some((role) => roles.includes(role))
  const contentRoles = ['communications_head', 'technical_head'].some((role) => roles.includes(role))
  if (registrationRoles) {
    const eightWeeksAgo = new Date(Date.now() - 56 * 86400000).toISOString()
    const [count, week, attendance, signups] = await Promise.all([
      supabase.from('admin_registrations').select('id', { count: 'exact', head: true }),
      supabase.from('admin_registrations').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('admin_attendance').select('attendance_id,event_id,first_name,last_name,checked_in_at').order('checked_in_at', { ascending: false }).limit(10),
      supabase.from('admin_registrations').select('created_at').gte('created_at', eightWeeksAgo).order('created_at'),
    ])
    if (count.error || week.error || attendance.error || signups.error) throw count.error || week.error || attendance.error || signups.error
    const start = new Date(); start.setDate(start.getDate() - 7 * 7); start.setHours(0, 0, 0, 0)
    output.weekly = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(start.getTime() + index * 7 * 86400000)
      return { week: date.toLocaleDateString('en-GH', { day: 'numeric', month: 'short' }), total: (signups.data || []).filter((row) => { const value = new Date(row.created_at); return value >= date && value < new Date(date.getTime() + 7 * 86400000) }).length }
    })
    output.memberCount = count.count || 0; output.weekCount = week.count || 0; output.attendance = attendance.data || []
  }
  const events = await supabase.from('events').select('id,title,starts_at,is_published').gte('starts_at', new Date().toISOString()).order('starts_at').limit(5)
  if (events.error) throw events.error
  output.events = events.data || []
  if (contentRoles) {
    const [news, messages] = await Promise.all([
      supabase.from('news_posts').select('id,is_published'), supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
    ])
    if (news.error || messages.error) throw news.error || messages.error
    output.news = news.data || []; output.unread = messages.count || 0
  }
  return output
}

export default function Overview() {
  const { roles } = useAuth()
  const query = useQuery(() => loadOverview(roles), [roles.join(',')])
  return <section><h1>Overview</h1><DataState loading={query.loading} error={query.error} onRetry={query.retry}><div className="stat-row">{query.data?.memberCount != null && <div className="stat"><span>Registered members</span><strong>{query.data.memberCount}</strong></div>}{query.data?.weekCount != null && <div className="stat"><span>New this week</span><strong>{query.data.weekCount}</strong></div>}{query.data?.news && <div className="stat"><span>Published news</span><strong>{query.data.news.filter((item) => item.is_published).length}</strong></div>}{query.data?.unread != null && <div className="stat"><span>Unread messages</span><strong>{query.data.unread}</strong></div>}</div>{query.data?.weekly && <><h2>Registrations per week</h2><div style={{ width: '100%', height: 260 }}><ResponsiveContainer><BarChart data={query.data.weekly}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="week" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="total" fill="#0b3c6f" /></BarChart></ResponsiveContainer></div></>}<h2>Upcoming events</h2>{query.data?.events.length ? <ul>{query.data.events.map((event) => <li key={event.id}>{formatDate(event.starts_at)} · {event.title} ({event.is_published ? 'Published' : 'Draft'})</li>)}</ul> : <p className="muted">No upcoming events.</p>}{query.data?.attendance && <><h2>Latest check-ins</h2>{query.data.attendance.length ? <ul>{query.data.attendance.map((item) => <li key={item.attendance_id}>{formatDate(item.checked_in_at)} · {item.first_name} {item.last_name}</li>)}</ul> : <p className="muted">No check-ins yet.</p>}</>}</DataState></section>
}
