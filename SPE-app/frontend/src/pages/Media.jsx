import { loadStore } from '../lib/storage'

export default function Media() {
  const { media, events } = loadStore()
  return (
    <section className="section">
      <h2>Media</h2>
      <p>Videos, workshop recordings, photographs, and the chapter event calendar.</p>

      <h3>Event calendar</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th>Venue</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.date}</td>
              <td>{event.title}</td>
              <td>{event.venue}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid cards" style={{ marginTop: 24 }}>
        {media.map((item) => (
          <article className="card" key={item.id}>
            <h3>{item.title}</h3>
            {item.kind === 'image' ? (
              <img src={item.url} alt={item.title} />
            ) : (
              <iframe
                title={item.title}
                src={item.url}
                height="180"
                style={{ width: '100%', border: 0, borderRadius: 8 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            <p>{item.caption}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
