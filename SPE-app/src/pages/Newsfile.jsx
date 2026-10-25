import { loadStore } from '../lib/storage'

export default function Newsfile() {
  const { news } = loadStore()
  return (
    <section className="section">
      <h2>Newsfile</h2>
      <div className="grid">
        {news.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.title}</h3>
            <p className="muted">{item.date}</p>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
