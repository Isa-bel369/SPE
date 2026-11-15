import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../components/DataState'
import { useQuery } from '../hooks/useQuery'
import { getMedia, getPublicEvents } from '../lib/publicData'

const categories = [['all', 'All'], ['event', 'Event'], ['activity', 'Activity'], ['member', 'Member'], ['executive', 'Executive']]
function youtubeId(raw) {
  try {
    const url = new URL(raw)
    if (url.hostname === 'youtu.be' || url.hostname.endsWith('.youtu.be')) return url.pathname.slice(1).split('/')[0]
    if (url.hostname.endsWith('youtube.com')) return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1)
  } catch {}
  return null
}

function Calendar({ events }) {
  const [month, setMonth] = useState(() => { const now = new Date(); return { year: now.getUTCFullYear(), month: now.getUTCMonth() } })
  const first = new Date(Date.UTC(month.year, month.month, 1))
  const days = new Date(Date.UTC(month.year, month.month + 1, 0)).getUTCDate()
  const parts = (date) => Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Africa/Accra', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(date).map((part) => [part.type, Number(part.value)]))
  const visible = events.filter((event) => { const date = parts(new Date(event.starts_at)); return date.year === month.year && date.month === month.month + 1 })
  const monthLabel = new Date(Date.UTC(month.year, month.month, 1)).toLocaleDateString('en-GH', { month: 'long', year: 'numeric', timeZone: 'Africa/Accra' })
  const changeMonth = (amount) => { const date = new Date(Date.UTC(month.year, month.month + amount, 1)); setMonth({ year: date.getUTCFullYear(), month: date.getUTCMonth() }) }
  return <section><div className="section-heading"><h2>{monthLabel}</h2><div><button className="btn secondary" aria-label="Previous month" onClick={() => changeMonth(-1)}>←</button><button className="btn secondary" aria-label="Next month" onClick={() => changeMonth(1)}>→</button></div></div><div className="calendar-grid">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <strong key={day}>{day}</strong>)}{Array.from({ length: (first.getUTCDay() + 6) % 7 }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = index + 1; const todays = visible.filter((event) => parts(new Date(event.starts_at)).day === day); return <div className="calendar-day" key={day}><strong>{day}</strong>{todays.map((event) => <Link key={event.id} to={`/events/${event.slug}`}>{event.title}</Link>)}</div>})}</div></section>
}

export default function Media() {
  const [category, setCategory] = useState('all')
  const [lightbox, setLightbox] = useState(null)
  const mediaQuery = useQuery(() => getMedia())
  const eventsQuery = useQuery(getPublicEvents)
  const items = mediaQuery.data || []
  const videos = items.filter((item) => item.type === 'youtube')
  const recordings = items.filter((item) => item.type === 'recording')
  const photos = items.filter((item) => item.type === 'photo' && (category === 'all' || item.category === category))
  return <section className="section"><h1>Media</h1><DataState loading={mediaQuery.loading || eventsQuery.loading} error={mediaQuery.error || eventsQuery.error} onRetry={() => { mediaQuery.retry(); eventsQuery.retry() }}><h2>Videos</h2>{videos.length ? <div className="grid cards">{videos.map((item) => { const id = youtubeId(item.url); return <article className="card" key={item.id}><h3>{item.title}</h3>{id ? <iframe title={item.title} src={`https://www.youtube-nocookie.com/embed/${id}`} loading="lazy" width="640" height="360" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <p>Video link is not valid.</p>}</article>})}</div> : <p className="muted">No videos have been published.</p>}<h2>Recordings</h2>{recordings.length ? <ul>{recordings.map((item) => <li key={item.id}>{item.title} · <a href={item.url} target="_blank" rel="noopener noreferrer">Open recording</a></li>)}</ul> : <p className="muted">No recordings have been published.</p>}<h2>Gallery</h2><div className="tabs">{categories.map(([value, label]) => <button className={category === value ? 'active' : ''} key={value} onClick={() => setCategory(value)}>{label}</button>)}</div>{photos.length ? <div className="home-gallery">{photos.map((item) => <button className="gallery-button" key={item.id} onClick={() => setLightbox(item)} aria-label={`View ${item.title}`}><img src={item.imageUrl} alt={item.title} loading="lazy" width="640" height="480" /><span>{item.title}</span></button>)}</div> : <p className="muted">No pictures in this category yet.</p>}<h2>Event calendar</h2><Calendar events={eventsQuery.data || []} /></DataState>{lightbox && <div className="lightbox" role="dialog" aria-modal="true" aria-label={lightbox.title} onClick={() => setLightbox(null)}><button aria-label="Close image" onClick={() => setLightbox(null)}>×</button><img src={lightbox.imageUrl} alt={lightbox.title} /><p>{lightbox.title}</p></div>}</section>
}
