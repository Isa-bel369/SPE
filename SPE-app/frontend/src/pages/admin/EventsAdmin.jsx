import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Markdown from '../../components/Markdown'
import { adminCall, friendlyError } from '../../lib/api'
import { resizeImage } from '../../lib/image'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'
import { formatDate } from '../../lib/format'
import { useConfirmDialog } from '../../components/useConfirmDialog'

function slugify(value) { return (value || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) }
function accraTimestamp(value) { return new Date(`${value}:00Z`).toISOString() }

export default function EventsAdmin() {
  const { roles } = useAuth()
  const advanced = roles.some((role) => ['organization_head', 'technical_head'].includes(role))
  const [events, setEvents] = useState([]); const [tokens, setTokens] = useState({})
  const [selected, setSelected] = useState(undefined); const [loading, setLoading] = useState(true)
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  const [cover, setCover] = useState(null)
  const { confirm, dialog } = useConfirmDialog()
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
  const form = { title: '', slug: '', description: '', starts_at: '', ends_at: '', location: '', points: 3, is_published: true, ...(selected || {}) }
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
    if (advanced) Object.assign(payload, { points: Number(values.get('points')), checkin_opens_at: values.get('checkin_opens_at') ? accraTimestamp(values.get('checkin_opens_at')) : startsAt, checkin_closes_at: values.get('checkin_closes_at') ? accraTimestamp(values.get('checkin_closes_at')) : endsAt })
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
  async function toggleCheckin(item, is_active) {
    try { await adminCall('set_checkin_state', { event_id: item.id, is_active }); await load() } catch (err) { setError(friendlyError(err, 'Could not update event check-in. Try again.')) }
  }
  async function resetSecret(item) {
    if (!await confirm({ title: 'Reset QR secret?', message: `All displayed QR codes for “${item.title}” will stop working.`, confirmLabel: 'Reset secret', danger: true })) return
    try { await adminCall('reset_event_secret', { event_id: item.id }); setError(''); } catch (err) { setError(friendlyError(err, 'Could not reset the event QR code. Try again.')) }
  }
  async function deleteEvent(item) {
    if (!await confirm({ title: 'Delete event?', message: `Delete “${item.title}”? This cannot be undone.`, confirmLabel: 'Delete event', danger: true })) return
    try { await adminCall('delete_event', { event_id: item.id }); await load() }
    catch (err) {
      if (err.code === 'EVENT_HAS_CHECKINS' && await confirm({ title: 'Event has check-ins', message: `${err.message} You can unpublish this event instead.`, confirmLabel: 'Unpublish event' })) {
        const { error: updateError } = await supabase.from('events').update({ is_published: false }).eq('id', item.id)
        if (updateError) setError(friendlyError(updateError, 'Could not unpublish the event. Try again.')); else load()
      } else setError(friendlyError(err, 'Could not delete the event. Try again.'))
    }
  }
  const filtered = events
  return <section>{dialog}<div className="section-heading"><h1>Events</h1><button className="btn" onClick={() => { setSelected({}); setCover(null) }}>Create event</button></div>{error && <p className="alert" role="alert">{error}</p>}{loading ? <p role="status">Loading events…</p> : <div className="table-scroll"><table className="table"><thead><tr><th>Event</th><th>Starts</th><th>Status</th><th>Check-in</th><th>Actions</th></tr></thead><tbody>{filtered.map((event) => { const missing = []; if (!event.is_published) missing.push('publish the event'); if (!event.checkin_opens_at || !event.checkin_closes_at) missing.push('set the check-in window'); const qrReady = missing.length === 0; const qrHelp = qrReady ? '' : `To open QR, ${missing.join(', ')}.`; return <tr key={event.id}><td>{event.title}</td><td>{formatDate(event.starts_at)}</td><td>{event.is_published ? 'Published' : 'Draft'}</td><td>{tokens[event.id] ? 'Open' : 'Closed'}</td><td className="row-actions"><button className="btn secondary" onClick={() => { setSelected({ ...event, starts_at: event.starts_at.slice(0, 16), ends_at: event.ends_at.slice(0, 16), checkin_opens_at: event.checkin_opens_at?.slice(0, 16) || '', checkin_closes_at: event.checkin_closes_at?.slice(0, 16) || '' }); setCover(null) }}>Edit</button>{advanced && <><Link className={`btn secondary ${qrReady ? '' : 'disabled-link'}`} to={qrReady ? `/admin/events/${event.id}/qr` : '#'} onClick={(e) => !qrReady && e.preventDefault()} title={qrHelp} aria-disabled={!qrReady}>Open QR</Link>{qrHelp && <span role="note">{qrHelp}</span>}<button className="btn secondary" onClick={() => toggleCheckin(event, !tokens[event.id])}>{tokens[event.id] ? 'Close check-in' : 'Open check-in'}</button><button className="btn secondary" onClick={() => resetSecret(event)}>Reset secret</button><button className="btn danger" onClick={() => deleteEvent(event)}>Delete</button></>}</td></tr>})}</tbody></table></div>}
    {selected !== undefined && <div className="modal-backdrop"><section className="card admin-modal"><div className="section-heading"><h2>{selected.id ? 'Edit event' : 'Create event'}</h2><button className="linkish" onClick={() => setSelected(undefined)}>Close</button></div>{error && <p className="alert" role="alert">{error}</p>}<form className="form" onSubmit={submit}>
      <label>Title<input name="title" required maxLength="120" value={form.title} onChange={(e) => update('title', e.target.value)} onBlur={() => !form.slug && update('slug', slugify(form.title))} /></label>
      <label>Slug<input name="slug" required minLength="3" maxLength="80" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={(e) => update('slug', e.target.value)} /></label>
      <label>Description (Markdown)<textarea name="description" rows="5" required value={form.description || ''} onChange={(e) => update('description', e.target.value)} /></label><details><summary>Preview</summary><Markdown>{form.description}</Markdown></details>
      <label>Starts<input name="starts_at" type="datetime-local" required defaultValue={form.starts_at} /></label><label>Ends<input name="ends_at" type="datetime-local" required defaultValue={form.ends_at} /></label>
      <label>Location<input name="location" required value={form.location} onChange={(e) => update('location', e.target.value)} /></label>
      <label>Cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCover(e.target.files?.[0] || null)} /></label>
      <label className="checkbox"><input type="checkbox" name="is_published" checked={Boolean(form.is_published)} onChange={(e) => update('is_published', e.target.checked)} />Publish this event on the website</label>
      <fieldset disabled={!advanced}><legend>Organization and Technical controls</legend>{!advanced && <p title="Only the Organization Head or Technical Head can change this.">Only the Organization Head or Technical Head can change this.</p>}<label>Points<input name="points" type="number" min="1" max="20" defaultValue={form.points || 3} /></label><label>Check-in opens<input name="checkin_opens_at" type="datetime-local" defaultValue={form.checkin_opens_at || form.starts_at} /></label><label>Check-in closes<input name="checkin_closes_at" type="datetime-local" defaultValue={form.checkin_closes_at || form.ends_at} /></label></fieldset>
      <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button>
    </form></section></div>}
  </section>
}
