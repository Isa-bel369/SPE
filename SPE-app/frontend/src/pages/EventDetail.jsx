import { Link, useParams } from 'react-router-dom'
import { loadStore } from '../lib/storage'

export default function EventDetail() {
  const { id } = useParams()
  const event = loadStore().events.find((row) => row.id === id)

  if (!event) {
    return (
      <section className="section">
        <h2>Event not found</h2>
        <Link to="/">Back home</Link>
      </section>
    )
  }

  return (
    <section className="section">
      <p className="muted">{event.type}</p>
      <h2>{event.title}</h2>
      <p>
        {event.date} at {event.time}
        <br />
        {event.venue}
      </p>
      <p>{event.summary}</p>
      <p>
        Attendance is recorded with your member QR/code. Event-related payments, if any, are handled under{' '}
        <Link to="/dues">Pay Dues</Link>.
      </p>
    </section>
  )
}
