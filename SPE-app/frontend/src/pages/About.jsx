import { Link } from 'react-router-dom'
import DataState from '../components/DataState'
import Markdown from '../components/Markdown'
import { useQuery } from '../hooks/useQuery'
import { getSiteContent } from '../lib/publicData'

export default function About() {
  const query = useQuery(() => getSiteContent(['home_intro', 'about_mission', 'about_vision', 'about_benefits']))
  const content = query.data || {}
  return <section className="section"><h1>About SPE UMaT</h1><DataState {...query} onRetry={query.retry}><h2>Our chapter</h2><Markdown>{content.home_intro}</Markdown><h2>Our mission</h2><Markdown>{content.about_mission}</Markdown><h2>Our vision</h2><Markdown>{content.about_vision}</Markdown><h2>Benefits of membership</h2><Markdown>{content.about_benefits}</Markdown></DataState><Link className="btn" to="/register">Become a member</Link></section>
}
