import { useMemo, useState } from 'react'
import DataState from '../components/DataState'
import StoryCard, { textExcerpt } from '../components/StoryCard'
import { useQuery } from '../hooks/useQuery'
import { getPublicEvents } from '../lib/publicData'
import { formatDate } from '../lib/format'

const PAGE_SIZE = 12
export default function Events() {
  const query = useQuery(getPublicEvents)
  const [tab, setTab] = useState('upcoming')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [now] = useState(() => Date.now())
  const items = useMemo(() => {
    return (query.data || []).filter((event) => tab === 'upcoming' ? new Date(event.ends_at) >= now : new Date(event.ends_at) < now)
      .sort((a, b) => tab === 'upcoming' ? a.starts_at.localeCompare(b.starts_at) : b.starts_at.localeCompare(a.starts_at))
  }, [query.data, tab, now])
  return <section className="section"><h1>Events</h1><div className="tabs"><button className={tab === 'upcoming' ? 'active' : ''} onClick={() => { setTab('upcoming'); setLimit(PAGE_SIZE) }}>Upcoming</button><button className={tab === 'past' ? 'active' : ''} onClick={() => { setTab('past'); setLimit(PAGE_SIZE) }}>Past</button></div><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !items.length ? `No ${tab} events.` : null}><div className="story-grid">{items.slice(0, limit).map((event) => <StoryCard key={event.id} title={event.title} to={`/events/${event.slug}`} image={event.cover_image_url} meta={`${formatDate(event.starts_at)} · ${event.location}`} excerpt={textExcerpt(event.description)} />)}</div>{items.length > limit && <button className="btn secondary" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Load more</button>}</DataState></section>
}
