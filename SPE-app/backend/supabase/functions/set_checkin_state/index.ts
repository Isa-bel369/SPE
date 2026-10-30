import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('set_checkin_state', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const input = body as { event_id: string; is_active: boolean }
  const { data, error } = await db.from('event_checkin_tokens').update({ is_active: input.is_active }).eq('event_id', input.event_id).select('event_id').maybeSingle()
  if (error) throw new AppError('SERVER_ERROR')
  if (!data) throw new AppError('NOT_FOUND')
  await context.audit(input.is_active ? 'checkin_opened' : 'checkin_closed', { event_id: input.event_id })
  return { is_active: input.is_active }
})
