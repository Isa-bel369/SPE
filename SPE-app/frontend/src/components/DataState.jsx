export default function DataState({ loading, error, onRetry, empty, children }) {
  if (loading) return <div className="card skeleton-card" role="status" aria-live="polite" aria-label="Loading content"><i /><i /><i /></div>
  if (error) return <div className="card alert" role="alert"><span>{error}</span><button type="button" className="btn secondary" onClick={onRetry}>Retry</button></div>
  if (empty) return <div className="card muted">{empty}</div>
  return children
}
