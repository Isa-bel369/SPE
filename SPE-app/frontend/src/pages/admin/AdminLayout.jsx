import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../state/contexts'

const ITEMS = [
  ['/', 'Overview', []], ['/registrations', 'Registrations', ['organization_head', 'technical_head']],
  ['/events', 'Events', ['communications_head', 'organization_head', 'technical_head']],
  ['/attendance', 'Attendance', ['organization_head', 'technical_head']], ['/merit', 'Merit tracker', ['organization_head', 'technical_head']],
  ['/news', 'News', ['communications_head', 'technical_head']], ['/media', 'Media and content', ['communications_head', 'technical_head']],
  ['/messages', 'Messages', ['communications_head', 'technical_head']], ['/audit', 'Audit log', ['technical_head']], ['/admins', 'Admins', ['technical_head']],
]
const TITLES = { communications_head: 'Communications Head', organization_head: 'Organization Head', technical_head: 'Technical Head' }

export default function AdminLayout() {
  const { session, roles, signOut } = useAuth()
  const navigate = useNavigate()
  const visible = ITEMS.filter(([, , needed]) => !needed.length || needed.some((role) => roles.includes(role)))
  return <div className="admin-layout"><header className="admin-top"><Link to="/admin">SPE UMaT Admin</Link><span>{session?.user?.email} · {roles.map((role) => TITLES[role]).join(', ')}</span><button className="linkish" onClick={async () => { await signOut(); navigate('/admin/login') }}>Sign out</button></header><div className="admin-body"><aside className="admin-side"><nav>{visible.map(([to, label]) => <NavLink key={to} to={to === '/' ? '/admin' : `/admin${to}`} end={to === '/'}>{label}</NavLink>)}</nav><Link to="/">View public site</Link></aside><main className="admin-main"><Outlet /></main></div></div>
}
