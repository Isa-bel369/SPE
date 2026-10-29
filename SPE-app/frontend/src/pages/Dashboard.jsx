import { Navigate } from 'react-router-dom'
import { getSession, ROLE_LABELS } from '../lib/auth'
import { leaderboard, loadStore, memberStats, qrUrl } from '../lib/storage'

export default function Dashboard() {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />

  const store = loadStore()
  const member = store.members.find((row) => row.id === session.memberId)
  const stats = memberStats(store, session.memberId)
  const board = leaderboard(store)
  const maxPoints = Math.max(...board.map((row) => row.points), 1)

  return (
    <section className="section">
      <h2>Member dashboard</h2>
      <p>
        {session.name} · {ROLE_LABELS[session.role]}
      </p>
      <div className="stat-row">
        <div className="stat">
          <span>Merit points</span>
          <strong>{stats.points}</strong>
        </div>
        <div className="stat">
          <span>Events attended</span>
          <strong>{stats.attendanceCount}</strong>
        </div>
        <div className="stat">
          <span>Merit records</span>
          <strong>{stats.meritCount}</strong>
        </div>
      </div>

      {member && (
        <article className="card qr-card" style={{ marginTop: 20 }}>
          <img src={qrUrl(`SPE-UMAT:${member.code}`)} alt={`QR code for member ${member.code}`} />
          <div>
            <h3>Attendance card</h3>
            <p>
              Unique code: <strong>{member.code}</strong>
            </p>
            <p className="muted">
              Present this QR or code at chapter events. Organization executives check it in from the admin
              attendance desk.
            </p>
          </div>
        </article>
      )}

      <h3>My merit tracker</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Note</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {stats.merit.map((row) => (
            <tr key={row.id}>
              <td>{row.date}</td>
              <td>{row.type}</td>
              <td>{row.note}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Participation leaderboard</h3>
      {board.map((row, index) => (
        <div key={row.id} style={{ marginBottom: 10 }}>
          <div>
            {index + 1}. {row.name} · {row.points} pts · {row.attendanceCount} events
          </div>
          <div className="bar">
            <i style={{ width: `${(row.points / maxPoints) * 100}%` }} />
          </div>
        </div>
      ))}
    </section>
  )
}
