import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

function newSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
}

serveFunction('reset_event_secret', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const eventId = (body as { event_id: string }).event_id
  const { data, error } = await db.from('event_checkin_tokens').update({ secret: newSecret() }).eq('event_id', eventId).select('event_id').maybeSingle()
  if (error) throw new AppError('SERVER_ERROR')
  if (!data) throw new AppError('NOT_FOUND')
  const { error: expireError } = await db.rpc('expire_event_checkin_sessions', { p_event: eventId })
  if (expireError) throw new AppError('SERVER_ERROR')
  await context.audit('event_secret_reset', { event_id: eventId })
  return {}
})
