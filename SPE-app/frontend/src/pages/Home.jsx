import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CONTACT } from '../data/seed'
import { loadStore } from '../lib/storage'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function eventDate(date) {
  const [year, month, day] = date.split('-')
  return `${monthNames[Number(month) - 1]} ${Number(day)}, ${year}`
}

export default function Home() {
  const { events, media } = loadStore()
  const photos = media.filter((item) => item.kind === 'image').slice(0, 3)
  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const upcoming = [...events]
    .filter((event) => event.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3)

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="home-kicker">University of Mines and Technology · Tarkwa</div>
          <div className="home-brand-lockup">
            <img src="/spe-logo.svg" alt="Society of Petroleum Engineers" />
            <span aria-hidden="true" />
            <img src="/umat-crest.svg" alt="University of Mines and Technology" />
          </div>
          <h1>Where energy minds <em>come together.</em></h1>
          <p>
            We are the SPE UMaT Student Chapter: a community of future energy professionals learning,
            leading, and building connections that move the industry forward.
          </p>
          <div className="home-actions">
            <Link className="btn" to="/membership">Become a member</Link>
            <Link className="btn secondary" to="/about">Discover our chapter</Link>
          </div>
          <div className="home-global-note">
            Part of the global Society of Petroleum Engineers
          </div>
        </div>
        <div className="home-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85"
            alt="Students working together at a university chapter activity"
          />
          <div className="hero-photo-caption">
            <span className="caption-mark" aria-hidden="true">SPE</span>
            <span>Curiosity today. Leadership tomorrow.</span>
          </div>
        </div>
      </section>

      <section className="home-intro">
        <div>
          <span className="eyebrow">Our chapter</span>
          <h2>Building the next generation of energy leaders.</h2>
        </div>
        <p>
          SPE brings together people who shape the future of energy. At UMaT, that mission comes to life
          through technical workshops, industry engagement, peer learning, and service to our community.
        </p>
        <Link className="text-link" to="/about">More about SPE UMaT <span aria-hidden="true">→</span></Link>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Get involved</span>
            <h2>Make your chapter experience count.</h2>
          </div>
          <p>Learn, connect, contribute, and keep track of every step along the way.</p>
        </div>
        <div className="home-feature-grid">
          <Link className="feature-card" to="/membership">
            <span className="feature-number">01</span>
            <h3>Membership</h3>
            <p>Find your place in our student community and explore the benefits of SPE membership.</p>
            <span className="feature-link">Explore membership <span aria-hidden="true">↗</span></span>
          </Link>
          <Link className="feature-card" to="/media">
            <span className="feature-number">02</span>
            <h3>Learn & connect</h3>
            <p>Explore chapter events, workshop recordings, videos, and moments from our community.</p>
            <span className="feature-link">Visit the media hub <span aria-hidden="true">↗</span></span>
          </Link>
          <Link className="feature-card" to="/dashboard">
            <span className="feature-number">03</span>
            <h3>Track your impact</h3>
            <p>Members can see event participation, attendance, and contributions in one place.</p>
            <span className="feature-link">Member dashboard <span aria-hidden="true">↗</span></span>
          </Link>
          <Link className="feature-card" to="/dues">
            <span className="feature-number">04</span>
            <h3>Chapter transactions</h3>
            <p>Pay membership dues and activity fees through the chapter’s payment page.</p>
            <span className="feature-link">View payment options <span aria-hidden="true">↗</span></span>
          </Link>
        </div>
      </section>

      <section className="home-section events-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">On the calendar</span>
            <h2>What’s happening next.</h2>
          </div>
          <Link className="text-link" to="/media">View event calendar <span aria-hidden="true">→</span></Link>
        </div>
        {upcoming.length > 0 ? (
          <div className="home-event-grid">
            {upcoming.map((event) => (
              <article className="home-event-card" key={event.id}>
                <div className="event-date">
                  <span>{eventDate(event.date).split(' ')[0]}</span>
                  <strong>{Number(event.date.split('-')[2])}</strong>
                </div>
                <div className="event-info">
                  <span className="event-type">{event.type}</span>
                  <h3>{event.title}</h3>
                  <p>{event.time} · {event.venue}</p>
                  <Link to={`/events/${event.id}`}>Event details <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-events">
            <h3>More events are on the way.</h3>
            <p>Check the calendar and follow our channels for the next chapter announcement.</p>
          </div>
        )}
      </section>

      <section className="home-section gallery-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Chapter life</span>
            <h2>Learning looks good on us.</h2>
          </div>
          <Link className="text-link" to="/media">Explore all media <span aria-hidden="true">→</span></Link>
        </div>
        {photos.length > 0 ? (
          <div className="home-gallery">
            {photos.map((item, index) => (
              <article className={`gallery-item gallery-item-${index + 1}`} key={item.id}>
                <img src={item.url} alt={item.title} loading="lazy" />
                <div className="gallery-caption">
                  <strong>{item.title}</strong>
                  <span>{item.caption}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">Chapter photos and activity highlights will appear here.</p>
        )}
      </section>

      <section className="home-contact">
        <div>
          <span className="eyebrow">Let’s talk</span>
          <h2>Your next opportunity starts with a conversation.</h2>
          <p>Questions about membership, events, or getting involved? Reach out to the SPE UMaT Chapter.</p>
        </div>
        <div className="contact-details">
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <a href={`tel:${CONTACT.phone.replace(/[^\d+]/g, '')}`}>{CONTACT.phone}</a>
          <span>{CONTACT.address}</span>
          <Link className="btn" to="/join-committee">Get involved</Link>
        </div>
      </section>
    </>
  )
}
