import { Link } from 'react-router-dom'

export function textExcerpt(value = '', length = 150) {
  const plain = value
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`#>*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > length ? `${plain.slice(0, length).trimEnd()}…` : plain
}

export default function StoryCard({ title, to, image, meta, excerpt }) {
  return <article className="story-card">
    {image && <Link className="story-image" to={to} tabIndex={-1} aria-hidden="true"><img src={image} alt="" loading="lazy" width="900" height="560" /></Link>}
    <div className="story-card-content">
      {meta && <p className="story-meta">{meta}</p>}
      <h2><Link to={to}>{title}</Link></h2>
      {excerpt && <p className="story-excerpt">{excerpt}</p>}
      <Link className="story-read-more" to={to}>Read more <span aria-hidden="true">→</span></Link>
    </div>
  </article>
}
