import { useState } from 'react'
import { Link } from 'react-router-dom'
import DataState from '../components/DataState'
import { useQuery } from '../hooks/useQuery'
import { getNews } from '../lib/publicData'
import { dateOnly } from '../lib/format'

const PAGE_SIZE = 9
export default function News() {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const query = useQuery(() => getNews(limit), [limit])
  return <section className="section"><h1>Chapter news</h1><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !query.data.length ? 'No news has been published yet.' : null}><div className="grid cards">{query.data?.map((post) => <article className="card" key={post.id}>{post.cover_image_url && <img src={post.cover_image_url} alt={post.title} loading="lazy" width="640" height="360" />}<h2><Link to={`/news/${post.slug}`}>{post.title}</Link></h2><p className="muted">{dateOnly(post.published_at)}</p><p>{post.body.replace(/[#*_`>]/g, '').replaceAll('[', '').replaceAll(']', '').slice(0, 140)}</p></article>)}</div>{query.data?.length === limit && <button className="btn secondary" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Load more</button>}</DataState></section>
}
