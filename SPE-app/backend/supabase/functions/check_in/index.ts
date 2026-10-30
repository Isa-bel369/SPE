import { serveFunction } from '../_shared/http.ts'
import { AppError, mapDatabaseError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'
import { ensureCheckinOpen, venueDistance } from '../_shared/checkin.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'
import { assertLocation, hashValue, userAgentFamily } from '../_shared/security.ts'

serveFunction('check_in', { kind: 'public' }, async (context, body) => {
  const input = body as { session_id: string; member_code: string; device_token: string; location: unknown }
  const deviceHash = await hashValue(input.device_token)
  await enforceLimit(`checkin:device:${deviceHash}`, 10, 600)
  await enforceLimit(`checkin:member:${input.member_code}`, 10, 600)
  await enforceLimit(`checkin:ip:${context.ip}`, 300, 600)

  const { data: claim, error: claimError } = await db.rpc('claim_checkin_attempt', { p_session: input.session_id, p_device_hash: deviceHash })
  if (claimError) throw new AppError('SERVER_ERROR')
  const session = Array.isArray(claim) ? claim[0] : claim
  if (!session || Number(session.attempts) > 5) throw new AppError('SESSION_INVALID')

  const [{ data: event, error: eventError }, { data: token, error: tokenError }, { data: windowOpen, error: windowError }] = await Promise.all([
    db.from('events').select('id,title,points,is_published,starts_at,ends_at,checkin_opens_at,checkin_closes_at,venue_lat,venue_lng,radius_m').eq('id', session.event_id).maybeSingle(),
    db.from('event_checkin_tokens').select('is_active').eq('event_id', session.event_id).maybeSingle(),
    db.rpc('event_checkin_window_open', { p_event: session.event_id }),
  ])
  if (eventError || tokenError || windowError) throw new AppError('SERVER_ERROR')
  if (!event || !token) throw new AppError('SESSION_INVALID')
  const location = assertLocation(input.location)
  const distance = venueDistance(location, event)
  ensureCheckinOpen(event, token.is_active, Boolean(windowOpen))

  const { data: member, error: memberError } = await db.from('members').select('id,first_name').eq('member_code', input.member_code).maybeSingle()
  if (memberError) throw new AppError('SERVER_ERROR')
  if (!member) {
    await enforceLimit(`checkin:failed-member:${input.member_code}`, 10, 600)
    throw new AppError('ID_NOT_FOUND')
  }
  const ipHash = await hashValue(context.ip)
  const { data: checkedIn, error: checkError } = await db.rpc('perform_check_in', {
    p_session: input.session_id, p_event: event.id, p_member: member.id,
    p_device_hash: deviceHash, p_distance: distance, p_ip_hash: ipHash,
    p_ua: userAgentFamily(context.userAgent),
  })
  if (checkError) throw mapDatabaseError(checkError)
  const row = Array.isArray(checkedIn) ? checkedIn[0] : checkedIn
  return { first_name: member.first_name, points_awarded: row.points_awarded, total_points: row.total_points, event_title: event.title }
})
