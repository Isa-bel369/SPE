import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../../state/contexts'
import AdminLayout from './AdminLayout'
import AdminLogin from './AdminLogin'
import AdminPassword from './AdminPassword'
import Overview from './Overview'
import Registrations from './Registrations'
import EventsAdmin from './EventsAdmin'
import EventQr from './EventQr'
import Attendance from './Attendance'
import MeritTracker from './MeritTracker'
import ContentAdmin from './ContentAdmin'
import Messages from './Messages'
import AuditLog from './AuditLog'
import Admins from './Admins'

function Guard() {
  const { session, roles, authLoading } = useAuth()
  if (authLoading) return <main className="section">Loading admin session…</main>
  if (!session) return <Navigate to="/admin/login" replace />
  if (!roles.length) return <div className="section"><p>This account has no access.</p></div>
  return <Outlet />
}

function Screen({ roles = [], children }) {
  const { roles: current } = useAuth()
  if (roles.length && !roles.some((role) => current.includes(role))) return <section className="section"><h1>Access denied</h1><p>You do not have permission to open this screen.</p></section>
  return children
}

export default function AdminApp() {
  return <Routes>
    <Route path="login" element={<AdminLogin />} />
    <Route path="accept-invite" element={<AdminPassword invite />} />
    <Route path="reset-password" element={<AdminPassword />} />
    <Route element={<Guard />}><Route element={<AdminLayout />}>
      <Route index element={<Overview />} />
      <Route path="overview" element={<Overview />} />
      <Route path="registrations" element={<Screen roles={['organization_head', 'technical_head']}><Registrations /></Screen>} />
      <Route path="events" element={<EventsAdmin />} />
      <Route path="events/:id/qr" element={<Screen roles={['organization_head', 'technical_head']}><EventQr /></Screen>} />
      <Route path="attendance" element={<Screen roles={['organization_head', 'technical_head']}><Attendance /></Screen>} />
      <Route path="merit" element={<Screen roles={['organization_head', 'technical_head']}><MeritTracker /></Screen>} />
      <Route path="news" element={<Screen roles={['communications_head', 'technical_head']}><ContentAdmin initialTab="news" /></Screen>} />
      <Route path="media" element={<Screen roles={['communications_head', 'technical_head']}><ContentAdmin initialTab="media" /></Screen>} />
      <Route path="messages" element={<Screen roles={['communications_head', 'technical_head']}><Messages /></Screen>} />
      <Route path="audit" element={<Screen roles={['technical_head']}><AuditLog /></Screen>} />
      <Route path="admins" element={<Screen roles={['technical_head']}><Admins /></Screen>} />
    </Route></Route>
    <Route path="*" element={<Navigate to="/admin" replace />} />
  </Routes>
}
