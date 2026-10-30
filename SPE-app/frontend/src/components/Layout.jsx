import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../state/contexts'

const links = [
  ['/', 'Home'], ['/about', 'About'], ['/events', 'Events'], ['/news', 'News'],
  ['/media', 'Media'], ['/leaderboard', 'Leaderboard'], ['/register', 'Join SPE'], ['/merit', 'Check merit'],
]

export default function Layout() {
  const { pathname } = useLocation()
  const { session } = useAuth()
  useEffect(() => {
    const titles = { '/': 'SPE UMaT Chapter', '/about': 'About', '/events': 'Events', '/news': 'News', '/media': 'Media', '/leaderboard': 'Leaderboard', '/register': 'Register', '/merit': 'Merit lookup' }
    const name = titles[pathname] || (pathname.startsWith('/events/') ? 'Event' : pathname.startsWith('/news/') ? 'News' : pathname.startsWith('/checkin') ? 'Event check-in' : pathname.startsWith('/admin') ? 'Admin portal' : 'SPE UMaT Chapter')
    document.title = `${name} | SPE UMaT Chapter`
    const description = document.querySelector('meta[name="description"]')
    if (description) description.content = `${name} for the Society of Petroleum Engineers University of Mines and Technology Student Chapter.`
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = pathname.startsWith('/admin') || pathname.startsWith('/checkin') || pathname.startsWith('/register') || pathname.startsWith('/merit') ? 'noindex,nofollow' : 'index,follow'
    const og = document.querySelector('meta[property="og:title"]')
    if (og) og.content = document.title
  }, [pathname])
  if (pathname.startsWith('/admin')) return <Outlet />
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="brand"><img src="/spe-logo.svg" alt="SPE UMaT Chapter" width="180" height="60" /></Link>
          <nav className="nav" aria-label="Main navigation">
            {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
            {session ? <NavLink to="/admin">Admin portal</NavLink> : <NavLink to="/admin/login">Admin sign in</NavLink>}
          </nav>
        </div>
      </header>
      <main className="page"><Outlet /></main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div>Society of Petroleum Engineers · UMaT Student Chapter</div>
          <nav aria-label="Footer navigation"><Link to="/leaderboard">Leaderboard</Link> · <Link to="/events">Events</Link> · <Link to="/admin/login">Admin</Link></nav>
        </div>
      </footer>
    </>
  )
}
