import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'
import { ensureCheckinOpen, venueDistance } from '../_shared/checkin.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'
import { assertLocation, hashValue } from '../_shared/security.ts'
import { verifyToken } from '../_shared/qr.ts'

serveFunction('start_check_in', { kind: 'public' }, async (context, body) => {
  const input = body as { event_token: string; device_token: string; location: unknown }
  const deviceHash = await hashValue(input.device_token)
  await enforceLimit(`checkin-start:device:${deviceHash}`, 10, 600)
  await enforceLimit(`checkin-start:ip:${context.ip}`, 300, 600)
  const eventId = await verifyToken(input.event_token)
  if (!eventId) throw new AppError('QR_EXPIRED')
  const [{ data: event, error: eventError }, { data: token, error: tokenError }, { data: windowOpen, error: windowError }] = await Promise.all([
    db.from('events').select('id,title,points,is_published,starts_at,ends_at,checkin_opens_at,checkin_closes_at,venue_lat,venue_lng,radius_m').eq('id', eventId).maybeSingle(),
    db.from('event_checkin_tokens').select('is_active').eq('event_id', eventId).maybeSingle(),
    db.rpc('event_checkin_window_open', { p_event: eventId }),
  ])
  if (eventError || tokenError || windowError) throw new AppError('SERVER_ERROR')
  if (!event || !token) throw new AppError('QR_EXPIRED')
  ensureCheckinOpen(event, token.is_active, Boolean(windowOpen))
  const location = assertLocation(input.location)
  venueDistance(location, event)
  const { data: created, error: insertError } = await db.rpc('open_checkin_session', { p_event: eventId, p_device_hash: deviceHash })
  if (insertError || !created) throw new AppError('SERVER_ERROR')
  const session = Array.isArray(created) ? created[0] : created
  return { session_id: session.session_id, expires_at: session.expires_at, event_title: event.title, points: event.points }
})
