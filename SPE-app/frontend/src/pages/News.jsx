import { useState } from 'react'
import DataState from '../components/DataState'
import StoryCard, { textExcerpt } from '../components/StoryCard'
import { useQuery } from '../hooks/useQuery'
import { getNews } from '../lib/publicData'
import { dateOnly } from '../lib/format'

const PAGE_SIZE = 9
export default function News() {
  const [limit, setLimit] = useState(PAGE_SIZE)
  const query = useQuery(() => getNews(limit), [limit])
  return <section className="section"><h1>Chapter news</h1><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !query.data.length ? 'No news has been published yet.' : null}><div className="story-grid">{query.data?.map((post) => <StoryCard key={post.id} title={post.title} to={`/news/${post.slug}`} image={post.cover_image_url} meta={dateOnly(post.published_at)} excerpt={textExcerpt(post.body)} />)}</div>{query.data?.length === limit && <button className="btn secondary" onClick={() => setLimit((value) => value + PAGE_SIZE)}>Load more</button>}</DataState></section>
}
