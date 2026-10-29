import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CONTACT } from '../data/seed'
import { getSession, logout } from '../lib/auth'

const links = [
  ['/', 'Home'],
  ['/about', 'About Us'],
  ['/membership', 'Membership'],
  ['/join-committee', 'Join a Committee'],
  ['/newsfile', 'Newsfile'],
  ['/media', 'Media'],
  ['/dues', 'Pay Dues'],
]

export default function Layout() {
  const session = getSession()
  const navigate = useNavigate()

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <NavLink to="/" className="brand">
            <img src="/spe-logo.svg" alt="SPE UMaT Chapter" />
          </NavLink>
          <nav className="nav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
            {session ? (
              <>
                <NavLink to="/dashboard">Dashboard</NavLink>
                {['communications', 'organization', 'technical'].includes(session.role) && (
                  <NavLink to="/admin">Admin</NavLink>
                )}
                <button
                  className="linkish"
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                    window.location.reload()
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <NavLink to="/login">Member login</NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="page">
        <Outlet />
      </main>

      <aside className="channels" aria-label="Join our channels">
        <div className="label">Join our channels!</div>
        <a className="wa" href={CONTACT.whatsapp} target="_blank" rel="noreferrer" aria-label="WhatsApp">
          WA
        </a>
        <a className="tg" href={CONTACT.telegram} target="_blank" rel="noreferrer" aria-label="Telegram">
          TG
        </a>
        <a className="in" href={CONTACT.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
          in
        </a>
      </aside>

      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            Society of Petroleum Engineers · UMaT Student Chapter
            <div className="muted">Placeholder contacts until official chapter details are confirmed.</div>
          </div>
          <div>
            {CONTACT.email}
            <br />
            {CONTACT.phone}
          </div>
        </div>
      </footer>
    </>
  )
}
