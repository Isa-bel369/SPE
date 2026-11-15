import { Link, useParams } from 'react-router-dom'
import DataState from '../components/DataState'
import Markdown from '../components/Markdown'
import { useQuery } from '../hooks/useQuery'
import { getPost } from '../lib/publicData'
import { dateOnly } from '../lib/format'

export default function NewsDetail() {
  const { slug } = useParams()
  const query = useQuery(() => getPost(slug), [slug])
  if (!query.loading && !query.error && !query.data) return <section className="section"><h1>News story not found</h1><Link to="/news">Back to news</Link></section>
  return <section className="section"><DataState loading={query.loading} error={query.error} onRetry={query.retry}>{query.data && <article className="story-detail"><div className="story-detail-content"><p className="story-meta">{dateOnly(query.data.published_at)}</p><h1>{query.data.title}</h1>{query.data.cover_image_url && <img className="story-detail-image" src={query.data.cover_image_url} alt={query.data.title} width="1200" height="675" />}<div className="story-body"><Markdown>{query.data.body}</Markdown></div></div></article>}</DataState></section>
}
