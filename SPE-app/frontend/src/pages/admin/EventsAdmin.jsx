import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from '../../components/Markdown'
import { adminCall, friendlyError } from '../../lib/api'
import { resizeImage } from '../../lib/image'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'
import { formatDate } from '../../lib/format'

function slugify(value) { return (value || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) }
function accraTimestamp(value) { return new Date(`${value}:00Z`).toISOString() }

export default function EventsAdmin() {
  const { roles } = useAuth()
  const advanced = roles.some((role) => ['organization_head', 'technical_head'].includes(role))
  const [events, setEvents] = useState([]); const [tokens, setTokens] = useState({})
  const [selected, setSelected] = useState(undefined); const [loading, setLoading] = useState(true)
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const [cover, setCover] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  async function load() {
    setLoading(true); setError('')
    const [eventResult, tokenResult] = await Promise.all([
      supabase.from('events').select('*').order('created_at', { ascending: false }),
      supabase.from('event_checkin_tokens').select('event_id,is_active'),
    ])
    if (eventResult.error || tokenResult.error) setError('Could not load events. Check access and retry.')
    else { setEvents(eventResult.data || []); setTokens(Object.fromEntries((tokenResult.data || []).map((row) => [row.event_id, row.is_active]))) }
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const form = { title: '', slug: '', description: '', starts_at: '', ends_at: '', location: '', points: 3, radius_m: 100, is_published: true, ...(selected || {}) }
  function update(key, value) { setSelected((old) => ({ ...(old || form), [key]: value })) }
  async function submit(event) {
    event.preventDefault(); setError('')
    const values = new FormData(event.currentTarget)
    const title = String(values.get('title')).trim()
    const startsValue = values.get('starts_at')
    const endsValue = values.get('ends_at')
    const startsAt = accraTimestamp(startsValue)
    const endsAt = accraTimestamp(endsValue)
    if (!Number.isFinite(Date.parse(startsAt)) || !Number.isFinite(Date.parse(endsAt)) || Date.parse(endsAt) <= Date.parse(startsAt)) {
      setError('The event end time must be later than its start time.')
      return
    }
    setBusy(true)
    const payload = { title, slug: String(values.get('slug')).trim(), description: values.get('description'), starts_at: startsAt, ends_at: endsAt, location: values.get('location'), is_published: values.get('is_published') === 'on' }
    if (advanced) Object.assign(payload, { points: Number(values.get('points')), radius_m: Number(values.get('radius_m')), checkin_opens_at: values.get('checkin_opens_at') ? accraTimestamp(values.get('checkin_opens_at')) : startsAt, checkin_closes_at: values.get('checkin_closes_at') ? accraTimestamp(values.get('checkin_closes_at')) : endsAt, venue_lat: values.get('venue_lat') ? Number(values.get('venue_lat')) : null, venue_lng: values.get('venue_lng') ? Number(values.get('venue_lng')) : null })
    try {
      if (cover) {
        const image = await resizeImage(cover, 1200)
        const path = `events/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage.from('site-media').upload(path, image, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        payload.cover_image_url = supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
      }
      let result
      if (form.id) result = await supabase.from('events').update(payload).eq('id', form.id).select('id,cover_image_url').single()
      else result = await supabase.from('events').insert(payload).select('id,cover_image_url').single()
      if (result.error) throw result.error
      if (cover && form.cover_image_url) {
        try { const old = new URL(form.cover_image_url).pathname.split('/site-media/')[1]; if (old) await supabase.storage.from('site-media').remove([decodeURIComponent(old)]) } catch {}
      }
      setSelected(undefined); setCover(null); await load()
    } catch (err) { setError(friendlyError(err, 'Event could not be saved. Check the details and try again.')) }
    finally { setBusy(false) }
  }
  async function getVenue() {
    setError(''); setLocationMessage('')
    if (!window.isSecureContext) { setLocationMessage('Location access requires a secure connection (HTTPS) or localhost. Open the admin page using its HTTPS address.'); return }
    if (!navigator.geolocation) { setLocationMessage('This browser does not support location access. Enter the venue latitude and longitude manually.'); return }
    setLocating(true); setLocationMessage('Getting your location. Allow location access if your browser asks.')
    navigator.geolocation.getCurrentPosition((position) => {
      setLocating(false)
      if (position.coords.accuracy > 30) { setLocationMessage(`Location accuracy is about ${Math.round(position.coords.accuracy)} m; it must be 30 m or better. Move outdoors, wait for a stronger GPS signal, and try again.`); return }
      update('venue_lat', position.coords.latitude.toFixed(6)); update('venue_lng', position.coords.longitude.toFixed(6))
      setLocationMessage(`Venue coordinates set (accuracy ±${Math.round(position.coords.accuracy)} m).`)
    }, (err) => {
      setLocating(false)
      const message = err.code === err.PERMISSION_DENIED
        ? 'Location permission was blocked. Allow location for this site in your browser settings, then try again.'
        : err.code === err.TIMEOUT
          ? 'The browser could not get a location in time. Move outdoors or enter the venue coordinates manually.'
          : 'Could not get your location. Check browser permissions or enter the coordinates manually.'
      setLocationMessage(message)
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
  }
  async function toggleCheckin(item, is_active) {
    try { await adminCall('set_checkin_state', { event_id: item.id, is_active }); await load() } catch (err) { setError(friendlyError(err, 'Could not update event check-in. Try again.')) }
  }
  async function resetSecret(item) {
    if (!window.confirm(`Reset the QR secret for “${item.title}”? All displayed QR codes will stop working.`)) return
    try { await adminCall('reset_event_secret', { event_id: item.id }); setError(''); } catch (err) { setError(friendlyError(err, 'Could not reset the event QR code. Try again.')) }
  }
  async function deleteEvent(item) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    try { await adminCall('delete_event', { event_id: item.id }); await load() }
    catch (err) {
      if (err.code === 'EVENT_HAS_CHECKINS' && window.confirm(`${err.message}\n\nUnpublish this event instead?`)) {
        const { error: updateError } = await supabase.from('events').update({ is_published: false }).eq('id', item.id)
        if (updateError) setError(friendlyError(updateError, 'Could not unpublish the event. Try again.')); else load()
      } else setError(friendlyError(err, 'Could not delete the event. Try again.'))
    }
  }
  const filtered = events
  return <section><div className="section-heading"><h1>Events</h1><button className="btn" onClick={() => { setSelected({}); setCover(null) }}>Create event</button></div>{error && <p className="alert" role="alert">{error}</p>}{loading ? <p role="status">Loading events…</p> : <div className="table-scroll"><table className="table"><thead><tr><th>Event</th><th>Starts</th><th>Status</th><th>Check-in</th><th>Actions</th></tr></thead><tbody>{filtered.map((event) => { const missing = []; if (!event.is_published) missing.push('publish the event'); if (event.venue_lat == null || event.venue_lng == null) missing.push('set the venue coordinates'); if (!event.checkin_opens_at || !event.checkin_closes_at) missing.push('set the check-in window'); const qrReady = missing.length === 0; const qrHelp = qrReady ? '' : `To open QR, ${missing.join(', ')}.`; return <tr key={event.id}><td>{event.title}</td><td>{formatDate(event.starts_at)}</td><td>{event.is_published ? 'Published' : 'Draft'}</td><td>{tokens[event.id] ? 'Open' : 'Closed'}</td><td className="row-actions"><button className="btn secondary" onClick={() => { setSelected({ ...event, starts_at: event.starts_at.slice(0, 16), ends_at: event.ends_at.slice(0, 16), checkin_opens_at: event.checkin_opens_at?.slice(0, 16) || '', checkin_closes_at: event.checkin_closes_at?.slice(0, 16) || '' }); setCover(null) }}>Edit</button>{advanced && <><Link className={`btn secondary ${qrReady ? '' : 'disabled-link'}`} to={qrReady ? `/admin/events/${event.id}/qr` : '#'} onClick={(e) => !qrReady && e.preventDefault()} title={qrHelp} aria-disabled={!qrReady}>Open QR</Link>{qrHelp && <span role="note">{qrHelp}</span>}<button className="btn secondary" onClick={() => toggleCheckin(event, !tokens[event.id])}>{tokens[event.id] ? 'Close check-in' : 'Open check-in'}</button><button className="btn secondary" onClick={() => resetSecret(event)}>Reset secret</button><button className="btn danger" onClick={() => deleteEvent(event)}>Delete</button></>}</td></tr>})}</tbody></table></div>}
    {selected !== undefined && <div className="modal-backdrop"><section className="card admin-modal"><div className="section-heading"><h2>{selected.id ? 'Edit event' : 'Create event'}</h2><button className="linkish" onClick={() => setSelected(undefined)}>Close</button></div>{error && <p className="alert" role="alert">{error}</p>}<form className="form" onSubmit={submit}>
      <label>Title<input name="title" required maxLength="120" value={form.title} onChange={(e) => update('title', e.target.value)} onBlur={() => !form.slug && update('slug', slugify(form.title))} /></label>
      <label>Slug<input name="slug" required minLength="3" maxLength="80" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(e) => update('slug', e.target.value)} /></label>
      <label>Description (Markdown)<textarea name="description" rows="5" required value={form.description || ''} onChange={(e) => update('description', e.target.value)} /></label><details><summary>Preview</summary><Markdown>{form.description}</Markdown></details>
      <label>Starts<input name="starts_at" type="datetime-local" required defaultValue={form.starts_at} /></label><label>Ends<input name="ends_at" type="datetime-local" required defaultValue={form.ends_at} /></label>
      <label>Location<input name="location" required value={form.location} onChange={(e) => update('location', e.target.value)} /></label>
      <label>Cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} /></label>
      <label className="checkbox"><input type="checkbox" name="is_published" checked={Boolean(form.is_published)} onChange={(e) => update('is_published', e.target.checked)} />Publish this event on the website</label>
      <fieldset disabled={!advanced}><legend>Organization and Technical controls</legend>{!advanced && <p title="Only the Organization Head or Technical Head can change this.">Only the Organization Head or Technical Head can change this.</p>}<label>Points<input name="points" type="number" min="1" max="20" defaultValue={form.points || 3} /></label><label>Check-in opens<input name="checkin_opens_at" type="datetime-local" defaultValue={form.checkin_opens_at || form.starts_at} /></label><label>Check-in closes<input name="checkin_closes_at" type="datetime-local" defaultValue={form.checkin_closes_at || form.ends_at} /></label><label>Radius (metres)<input name="radius_m" type="number" min="20" max="1000" defaultValue={form.radius_m || 100} /></label><label>Venue latitude<input name="venue_lat" value={form.venue_lat ?? ''} onChange={(e) => update('venue_lat', e.target.value)} /></label><label>Venue longitude<input name="venue_lng" value={form.venue_lng ?? ''} onChange={(e) => update('venue_lng', e.target.value)} /></label><button className="btn secondary" type="button" disabled={locating} onClick={getVenue}>{locating ? 'Getting location…' : 'Use my current location'}</button>{locationMessage && <p role="status" aria-live="polite">{locationMessage}</p>}{form.venue_lat && <a target="_blank" rel="noopener noreferrer" href={`https://www.openstreetmap.org/?mlat=${form.venue_lat}&mlon=${form.venue_lng}`}>View saved venue point on OpenStreetMap</a>}</fieldset>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button>
    </form></section></div>}
  </section>
}
