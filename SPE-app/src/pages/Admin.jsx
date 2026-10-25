import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { can, getSession, ROLE_LABELS } from '../lib/auth'
import { loadStore, updateStore } from '../lib/storage'

export default function Admin() {
  const session = getSession()
  const [tick, setTick] = useState(0)
  if (!session) return <Navigate to="/login" replace />
  if (!can(session, 'admin')) return <Navigate to="/dashboard" replace />

  const store = loadStore()
  const refresh = () => setTick((value) => value + 1)
  void tick

  function addNews(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    updateStore((next) => {
      next.news = [
        {
          id: `news-${Date.now()}`,
          title: form.get('title'),
          date: new Date().toISOString().slice(0, 10),
          body: form.get('body'),
        },
        ...next.news,
      ]
      return next
    })
    event.target.reset()
    refresh()
  }

  function addMedia(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    updateStore((next) => {
      next.media = [
        {
          id: `media-${Date.now()}`,
          kind: form.get('kind'),
          title: form.get('title'),
          url: form.get('url'),
          caption: form.get('caption'),
        },
        ...next.media,
      ]
      return next
    })
    event.target.reset()
    refresh()
  }

  function addEvent(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    updateStore((next) => {
      next.events = [
        {
          id: `evt-${Date.now()}`,
          title: form.get('title'),
          date: form.get('date'),
          time: form.get('time'),
          venue: form.get('venue'),
          type: form.get('type'),
          summary: form.get('summary'),
          feeGhs: Number(form.get('feeGhs') || 0),
        },
        ...next.events,
      ]
      return next
    })
    event.target.reset()
    refresh()
  }

  function checkIn(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const code = String(form.get('code')).trim()
    const eventId = form.get('eventId')
    const member = store.members.find((row) => row.code === code)
    if (!member) {
      alert('No member found for that code.')
      return
    }
    updateStore((next) => {
      next.attendance = [
        {
          id: `att-${Date.now()}`,
          eventId,
          memberId: member.id,
          date: new Date().toISOString().slice(0, 10),
        },
        ...next.attendance,
      ]
      next.merit = [
        {
          id: `m-${Date.now()}`,
          memberId: member.id,
          type: 'event',
          points: 10,
          note: `Attendance: ${next.events.find((row) => row.id === eventId)?.title || 'Event'}`,
          date: new Date().toISOString().slice(0, 10),
        },
        ...next.merit,
      ]
      return next
    })
    event.target.reset()
    refresh()
  }

  function addMerit(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    updateStore((next) => {
      next.merit = [
        {
          id: `m-${Date.now()}`,
          memberId: form.get('memberId'),
          type: form.get('type'),
          points: Number(form.get('points')),
          note: form.get('note'),
          date: new Date().toISOString().slice(0, 10),
        },
        ...next.merit,
      ]
      return next
    })
    event.target.reset()
    refresh()
  }

  return (
    <section className="section">
      <h2>Administrative section</h2>
      <p>
        Signed in as {session.name} · {ROLE_LABELS[session.role]}
      </p>
      <p className="muted">
        Access is limited by office: Communications (news/media), Organization (events/attendance), Technical
        (members/merit).
      </p>

      {can(session, 'admin-news') && (
        <article className="card" style={{ marginBottom: 16 }}>
          <h3>Publish news</h3>
          <form className="form" onSubmit={addNews}>
            <input name="title" placeholder="Headline" required />
            <textarea name="body" rows="3" placeholder="Body" required />
            <button className="btn" type="submit">
              Publish
            </button>
          </form>
        </article>
      )}

      {can(session, 'admin-media') && (
        <article className="card" style={{ marginBottom: 16 }}>
          <h3>Add media</h3>
          <form className="form" onSubmit={addMedia}>
            <input name="title" placeholder="Title" required />
            <select name="kind" defaultValue="image">
              <option value="image">Picture</option>
              <option value="youtube">YouTube</option>
              <option value="recording">Workshop recording</option>
            </select>
            <input name="url" placeholder="Image URL or YouTube embed URL" required />
            <input name="caption" placeholder="Caption" required />
            <button className="btn" type="submit">
              Add to media
            </button>
          </form>
        </article>
      )}

      {can(session, 'admin-events') && (
        <article className="card" style={{ marginBottom: 16 }}>
          <h3>Create event</h3>
          <form className="form" onSubmit={addEvent}>
            <input name="title" placeholder="Title" required />
            <input name="date" type="date" required />
            <input name="time" type="time" required />
            <input name="venue" placeholder="Venue" required />
            <input name="type" placeholder="Type" required />
            <input name="feeGhs" type="number" min="0" placeholder="Fee (GHS)" />
            <textarea name="summary" rows="3" placeholder="Summary" required />
            <button className="btn" type="submit">
              Save event
            </button>
          </form>
        </article>
      )}

      {can(session, 'admin-attendance') && (
        <article className="card" style={{ marginBottom: 16 }}>
          <h3>Attendance desk</h3>
          <p className="muted">Enter the member’s unique numerical code from their QR card.</p>
          <form className="form" onSubmit={checkIn}>
            <select name="eventId" required defaultValue="">
              <option value="" disabled>
                Select event
              </option>
              {store.events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
            <input name="code" placeholder="Member code e.g. 24018321" required />
            <button className="btn" type="submit">
              Check in
            </button>
          </form>
        </article>
      )}

      {can(session, 'admin-members') && (
        <article className="card" style={{ marginBottom: 16 }}>
          <h3>Members</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Programme</th>
              </tr>
            </thead>
            <tbody>
              {store.members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.code}</td>
                  <td>{member.programme}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Committee applications</h3>
          {store.applications.length === 0 && <p className="muted">No applications yet.</p>}
          {store.applications.map((row) => (
            <p key={row.id}>
              {row.name} · {row.committee} · {row.email}
            </p>
          ))}
        </article>
      )}

      {can(session, 'admin-merit') && (
        <article className="card">
          <h3>Merit tracker entry</h3>
          <form className="form" onSubmit={addMerit}>
            <select name="memberId" required defaultValue="">
              <option value="" disabled>
                Select member
              </option>
              {store.members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select name="type" defaultValue="volunteer">
              <option value="event">Event participation</option>
              <option value="volunteer">Volunteer activity</option>
              <option value="contribution">Programme contribution</option>
              <option value="engagement">Other engagement</option>
            </select>
            <input name="points" type="number" min="1" placeholder="Points" required />
            <input name="note" placeholder="Note" required />
            <button className="btn" type="submit">
              Record merit
            </button>
          </form>
        </article>
      )}
    </section>
  )
}
