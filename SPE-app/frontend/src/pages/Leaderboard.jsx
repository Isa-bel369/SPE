import DataState from '../components/DataState'
import { useQuery } from '../hooks/useQuery'
import { getLeaderboard } from '../lib/publicData'

export default function Leaderboard() {
  const query = useQuery(getLeaderboard)
  return <section className="section"><h1>Member leaderboard</h1><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !query.data.length ? 'No members have opted in to the leaderboard yet.' : null}><table className="table"><thead><tr><th>Rank</th><th>Name</th><th>Points</th></tr></thead><tbody>{query.data?.map((row) => <tr key={`${row.rank}-${row.display_name}`}><td>{row.rank}</td><td>{row.display_name}</td><td>{row.total_points}</td></tr>)}</tbody></table><p>Members appear here only if they chose to when registering.</p></DataState></section>
}
