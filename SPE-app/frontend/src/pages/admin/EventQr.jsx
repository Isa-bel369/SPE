import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { adminCall } from '../../lib/api'
import { supabase } from '../../lib/supabase'
import { SITE_URL } from '../../lib/supabase'

export default function EventQr() {
  const { id } = useParams()
  const [event, setEvent] = useState(null); const [token, setToken] = useState('')
  const [refreshIn, setRefreshIn] = useState(0); const [error, setError] = useState('')
  const [lastSuccess, setLastSuccess] = useState(() => Date.now()); const [lost, setLost] = useState(false)
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [busy, setBusy] = useState(false); const wakeLock = useRef(null)
  const [closed, setClosed] = useState(false)
  const refresh = useCallback(async () => {
    try {
      const result = await adminCall('qr_token', { event_id: id })
      setToken(result.token); setRefreshIn(result.refresh_in_seconds); setLastSuccess(Date.now()); setLost(false); setError(''); setRetryAttempt(0)
    } catch (err) { setError(err.message); setRetryAttempt((value) => value + 1) }
  }, [id])
  useEffect(() => {
    supabase.from('events').select('id,title,location,venue_lat,venue_lng,checkin_opens_at,checkin_closes_at,is_published').eq('id', id).maybeSingle().then(({ data }) => setEvent(data))
    refresh()
  }, [id, refresh])
  useEffect(() => {
    const timer = setInterval(() => setRefreshIn((value) => Math.max(0, value - 1)), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!token || closed) return undefined
    if (refreshIn <= 0) {
      const timer = setTimeout(refresh, token ? 300 : 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [refreshIn, token, refresh, closed])
  useEffect(() => {
    if (!error || closed) return undefined
    const timer = setTimeout(refresh, 3000)
    const lostTimer = setTimeout(() => setLost(true), Math.max(0, 60000 - (Date.now() - lastSuccess)))
    return () => { clearTimeout(timer); clearTimeout(lostTimer) }
  }, [error, refresh, lastSuccess, retryAttempt, closed])
  useEffect(() => {
    let active = true
    async function request() { try { wakeLock.current = await navigator.wakeLock?.request('screen') } catch {} }
    request()
    const visibility = () => { if (document.visibilityState === 'visible' && active) request() }
    document.addEventListener('visibilitychange', visibility)
    return () => { active = false; document.removeEventListener('visibilitychange', visibility); wakeLock.current?.release() }
  }, [])
  async function command(name, body, message) {
    if (!window.confirm(message)) return
    setBusy(true)
    try { await adminCall(name, body); if (name === 'reset_event_secret') await refresh(); else setClosed(true) }
    catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  const link = token ? `${SITE_URL.replace(/\/$/, '')}/checkin/${token}` : ''
  const progress = refreshIn ? `${Math.max(0, Math.min(100, (refreshIn / 30) * 100))}%` : '0%'
  return <main className="qr-screen" onContextMenu={(event) => event.preventDefault()}><header><Link to="/admin/events">Back to event</Link><h1>{event?.title || 'Event QR code'}</h1><p>{event?.location}</p></header>{error && <p className="qr-badge" role="status">{lost ? 'Connection lost' : 'Reconnecting'}</p>}{closed ? <p>Check-in is closed.</p> : token && !lost ? <><div className="qr-panel"><QRCodeSVG value={link} level="M" size={Math.min(window.innerHeight * 0.68, 740)} includeMargin /></div><p className="qr-url">{link}</p><div className="qr-progress"><i style={{ width: progress }} /></div><p>Code refreshes in {refreshIn}s</p></> : <p>{lost ? 'Connection lost' : 'Waiting for a valid check-in code…'}</p>}<div className="qr-actions"><button className="btn secondary" disabled={busy || closed} onClick={() => command('set_checkin_state', { event_id: id, is_active: false }, 'Close check-in for this event?')}>Close check-in</button><button className="btn danger" disabled={busy} onClick={() => command('reset_event_secret', { event_id: id }, 'Reset the event secret? Current QR codes will stop working immediately.')}>Reset secret</button></div></main>
}
