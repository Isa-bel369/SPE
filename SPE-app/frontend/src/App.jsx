import { lazy, Suspense, useEffect, useRef } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import { AppStateProvider } from './state/AppState'
import { useCheckin, useRegistration } from './state/contexts'
import Home from './pages/Home'
import About from './pages/About'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'
import News from './pages/News'
import NewsDetail from './pages/NewsDetail'
import Media from './pages/Media'
import Leaderboard from './pages/Leaderboard'
import Register from './pages/Register'
import Verify from './pages/Verify'
import RegisterSuccess from './pages/RegisterSuccess'
import Merit from './pages/Merit'
import Checkin from './pages/Checkin'
import NotFound from './pages/NotFound'

const AdminApp = lazy(() => import('./pages/admin/AdminApp'))

function Loading() { return <main className="section" aria-live="polite">Loading…</main> }

function FlowCleanup() {
  const { pathname } = useLocation()
  const previous = useRef(pathname)
  const { setRegistration } = useRegistration()
  const { setCheckin } = useCheckin()
  useEffect(() => {
    if (previous.current.startsWith('/register') && (!pathname.startsWith('/register') || previous.current === '/register/success' && pathname !== previous.current)) setRegistration({})
    if (previous.current.startsWith('/checkin') && !pathname.startsWith('/checkin')) setCheckin(null)
    previous.current = pathname
  }, [pathname, setCheckin, setRegistration])
  return null
}

function RoutedApp() {
  return <><FlowCleanup /><Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/events" element={<Events />} />
      <Route path="/events/:slug" element={<EventDetail />} />
      <Route path="/news" element={<News />} />
      <Route path="/news/:slug" element={<NewsDetail />} />
      <Route path="/media" element={<Media />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/verify" element={<Verify />} />
      <Route path="/register/success" element={<RegisterSuccess />} />
      <Route path="/merit" element={<Merit />} />
      <Route path="/checkin/:eventToken" element={<Checkin />} />
      <Route path="/checkin" element={<Checkin />} />
      <Route path="/admin/*" element={<Suspense fallback={<Loading />}><AdminApp /></Suspense>} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes></>
}

export default function App() {
  return <ErrorBoundary><AppStateProvider><BrowserRouter><RoutedApp /></BrowserRouter></AppStateProvider></ErrorBoundary>
}
