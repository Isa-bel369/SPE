import { Link } from 'react-router-dom'
import DataState from '../components/DataState'
import Markdown from '../components/Markdown'
import { useQuery } from '../hooks/useQuery'
import { getSiteContent, publicImageUrl } from '../lib/publicData'

export default function About() {
  const query = useQuery(() => getSiteContent(['about_heading', 'about_hero_image', 'about_hero_alt', 'about_chapter', 'about_mission', 'about_vision', 'about_benefits']))
  const content = query.data || {}
  return <>
    <section className="hero-block"><DataState {...query} onRetry={query.retry} empty={null}>
      <h1>{content.about_heading}</h1>
      <div className="dual-logos"><div><img src="/spe-logo.svg" alt="SPE" /><div className="logo-caption">Society of Petroleum Engineers</div><div className="logo-caption">UMaT STUDENT CHAPTER</div></div><img src="/umat-crest.svg" alt="UMaT" /></div>
      {content.about_hero_image && <img className="hero-photo" src={publicImageUrl(content.about_hero_image)} alt={content.about_hero_alt || ''} />}
    </DataState></section>
    <section className="section"><DataState {...query} onRetry={query.retry} empty={null}><h2>The SPE UMaT Chapter</h2><Markdown>{content.about_chapter}</Markdown><h2>Mission</h2><Markdown>{content.about_mission}</Markdown><h2>Vision</h2><Markdown>{content.about_vision}</Markdown><h2>Benefits of membership</h2><Markdown>{content.about_benefits}</Markdown></DataState><Link className="btn" to="/register">Become a member</Link></section>
  </>
}
