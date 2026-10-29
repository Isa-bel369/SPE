import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Dues from './pages/Dues'
import EventDetail from './pages/EventDetail'
import Home from './pages/Home'
import JoinCommittee from './pages/JoinCommittee'
import Login from './pages/Login'
import Media from './pages/Media'
import Membership from './pages/Membership'
import Newsfile from './pages/Newsfile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/join-committee" element={<JoinCommittee />} />
          <Route path="/newsfile" element={<Newsfile />} />
          <Route path="/media" element={<Media />} />
          <Route path="/dues" element={<Dues />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
