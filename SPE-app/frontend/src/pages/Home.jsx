import { useState } from 'react'
import { Link } from 'react-router-dom'
import TurnstileWidget from '../components/TurnstileWidget'
import Markdown from '../components/Markdown'
import DataState from '../components/DataState'
import { useQuery } from '../hooks/useQuery'
import { getMedia, getNews, getPublicEvents, getSiteContent, publicImageUrl } from '../lib/publicData'
import { callFn, friendlyError } from '../lib/api'
import { formatDate } from '../lib/format'
import { contactSchema } from '../schemas/forms'

async function loadHome() {
  const [content, events, news, executives] = await Promise.all([
    getSiteContent(['home_hero_title', 'home_hero_intro', 'home_hero_image', 'home_hero_alt', 'home_hero_caption', 'home_intro', 'contact_info']), getPublicEvents(), getNews(3),
    getMedia({ type: 'photo', category: 'executive' }),
  ])
  const now = Date.now()
  return { content, events: events.filter((event) => new Date(event.ends_at) >= now).slice(0, 3), news, executives }
}

function ContactForm({ contactInfo = '' }) {
  const [captcha, setCaptcha] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [message, setMessage] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = Object.fromEntries(new FormData(form))
    setBusy(true); setMessage('')
    try {
      const parsed = contactSchema.safeParse(values)
      if (!parsed.success) { setFieldErrors(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))); setBusy(false); return }
      setFieldErrors({})
      await callFn('submit_contact', { ...parsed.data, captcha_token: captcha, website: values.website || '' })
      setSent(true); form.reset()
    } catch (error) { setMessage(friendlyError(error, 'Your message could not be sent. Check your connection and try again.')); setFieldErrors(Object.fromEntries((error.details || []).map((item) => [item.field, item.message]))); setCaptcha(''); setResetKey((value) => value + 1) }
    finally { setBusy(false) }
  }
  return (
    <section className="section home-contact" id="contact">
      <div><span className="eyebrow">Contact us</span><h2>Talk with the chapter</h2><Markdown>{contactInfo}</Markdown></div>
      <div>
        {sent ? <p className="alert" role="status">Thank you. Your message has been sent.</p> : <>
          <form className="form" onSubmit={submit}>
            <label>Name<input name="name" required minLength="2" maxLength="100" autoComplete="name" onBlur={(event) => { const result = contactSchema.shape.name.safeParse(event.target.value); setFieldErrors((old) => ({ ...old, name: result.success ? '' : result.error.issues[0].message })) }} />{fieldErrors.name && <small>{fieldErrors.name}</small>}</label>
            <label>Email<input name="email" type="email" required autoComplete="email" onBlur={(event) => { const result = contactSchema.shape.email.safeParse(event.target.value); setFieldErrors((old) => ({ ...old, email: result.success ? '' : result.error.issues[0].message })) }} />{fieldErrors.email && <small>{fieldErrors.email}</small>}</label>
            <label>Message<textarea name="message" required minLength="10" maxLength="2000" rows="5" onBlur={(event) => { const result = contactSchema.shape.message.safeParse(event.target.value); setFieldErrors((old) => ({ ...old, message: result.success ? '' : result.error.issues[0].message })) }} />{fieldErrors.message && <small>{fieldErrors.message}</small>}</label>
            <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex="-1" autoComplete="off" /></label></div>
            <TurnstileWidget onToken={setCaptcha} resetKey={resetKey} />
            <p className="muted">Your name, email address and message are sent to the chapter executives so that they can reply to you.</p>
            <button className="btn" disabled={busy || !captcha}>{busy ? 'Sending…' : 'Send message'}</button>
          </form>
          <p className="form-message" role="status" aria-live="polite">{message}</p>
        </>}
      </div>
    </section>
  )
}

function Cards({ items, kind }) {
  if (!items?.length) return <p className="muted">No {kind} have been published yet.</p>
  return <div className="grid cards">{items.map((item) => (
    <article className="card" key={item.id}>
      {item.cover_image_url && <img src={item.cover_image_url} alt={item.title} loading="lazy" width="640" height="360" />}
      <h3><Link to={kind === 'events' ? `/events/${item.slug}` : `/news/${item.slug}`}>{item.title}</Link></h3>
      <p className="muted">{formatDate(item.starts_at || item.published_at)}</p>
      {kind === 'news' && <Markdown>{item.body?.slice(0, 140)}</Markdown>}
    </article>
  ))}</div>
}

export default function Home() {
  const query = useQuery(loadHome)
  const content = query.data?.content || {}
  return (
    <>
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-kicker">University of Mines and Technology · Tarkwa</div>
          <div className="home-brand-lockup"><img src="/spe-logo.svg" alt="Society of Petroleum Engineers" /><span aria-hidden="true" /><img src="/umat-crest.svg" alt="University of Mines and Technology" /></div>
          <h1>{content.home_hero_title}</h1>
          <Markdown>{content.home_hero_intro}</Markdown>
          <div className="home-actions"><Link className="btn" to="/register">Become a member</Link><Link className="btn secondary" to="/merit">Check my merit</Link></div>
        </div>
        {content.home_hero_image && <div className="home-hero-visual">
          <img src={publicImageUrl(content.home_hero_image)} alt={content.home_hero_alt || ''} />
          {content.home_hero_caption && <div className="hero-photo-caption"><span className="caption-mark" aria-hidden="true">SPE</span><span>{content.home_hero_caption}</span></div>}
        </div>}
      </section>
      <section className="section"><h2>About SPE UMaT</h2><DataState {...query} empty={null}><Markdown>{content.home_intro || ''}</Markdown><Link to="/about">More about the chapter</Link></DataState></section>
      <section className="section"><div className="section-heading"><h2>Upcoming events</h2><Link to="/events">All events</Link></div><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !query.data.events.length ? 'No upcoming events right now. Check back soon.' : null}><Cards items={query.data?.events} kind="events" /></DataState></section>
      <section className="section"><div className="section-heading"><h2>Latest news</h2><Link to="/news">All news</Link></div><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !query.data.news.length ? 'No news has been published yet.' : null}><Cards items={query.data?.news} kind="news" /></DataState></section>
      <section className="section"><h2>Our executives</h2><DataState loading={query.loading} error={query.error} onRetry={query.retry} empty={query.data && !query.data.executives.length ? 'Executive profiles will appear here.' : null}><div className="grid cards">{query.data?.executives.map((item) => <article className="card" key={item.id}><img src={item.imageUrl} alt={item.title} loading="lazy" width="400" height="400" /><h3>{item.title}</h3></article>)}</div></DataState></section>
      <ContactForm contactInfo={content.contact_info} />
    </>
  )
}
