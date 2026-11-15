import { useParams, Link } from 'react-router-dom'
import DataState from '../components/DataState'
import Markdown from '../components/Markdown'
import { useQuery } from '../hooks/useQuery'
import { getEvent, getMedia } from '../lib/publicData'
import { formatDate } from '../lib/format'

export default function EventDetail() {
  const { slug } = useParams()
  const query = useQuery(async () => {
    const event = await getEvent(slug)
    if (!event) return null
    return { event, photos: await getMedia({ type: 'photo', eventId: event.id }) }
  }, [slug])
  if (!query.loading && !query.error && !query.data) return <section className="section"><h1>Event not found</h1><Link to="/events">Back to events</Link></section>
  return <section className="section"><DataState loading={query.loading} error={query.error} onRetry={query.retry}>{query.data && <><article>{query.data.event.cover_image_url && <img src={query.data.event.cover_image_url} alt={query.data.event.title} width="1200" height="675" />}<h1>{query.data.event.title}</h1><p>{formatDate(query.data.event.starts_at)} – {formatDate(query.data.event.ends_at)}</p><p>{query.data.event.location}</p><Markdown>{query.data.event.description}</Markdown></article><h2>Event photos</h2><div className="home-gallery">{query.data.photos.map((photo) => <img key={photo.id} src={photo.imageUrl} alt={photo.title} loading="lazy" width="640" height="480" />)}</div></>}</DataState></section>
}
