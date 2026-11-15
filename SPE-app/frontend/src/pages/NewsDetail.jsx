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
  return <section className="section"><DataState loading={query.loading} error={query.error} onRetry={query.retry}>{query.data && <article>{query.data.cover_image_url && <img src={query.data.cover_image_url} alt={query.data.title} width="1200" height="675" />}<h1>{query.data.title}</h1><p>{dateOnly(query.data.published_at)}</p><Markdown>{query.data.body}</Markdown></article>}</DataState></section>
}
