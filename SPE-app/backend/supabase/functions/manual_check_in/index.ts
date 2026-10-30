import { serveFunction } from '../_shared/http.ts'
import { AppError, mapDatabaseError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('manual_check_in', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const input = body as { event_id: string; member_code: string }
  const [{ data: member, error: memberError }, { data: event, error: eventError }] = await Promise.all([
    db.from('members').select('id,first_name').eq('member_code', input.member_code).maybeSingle(),
    db.from('events').select('id').eq('id', input.event_id).maybeSingle(),
  ])
  if (memberError || eventError) throw new AppError('SERVER_ERROR')
  if (!member || !event) throw new AppError(!event ? 'NOT_FOUND' : 'ID_NOT_FOUND')
  const { data, error } = await db.rpc('perform_manual_check_in', { p_event: input.event_id, p_member: member.id, p_admin: context.user!.id })
  if (error) throw mapDatabaseError(error)
  const row = Array.isArray(data) ? data[0] : data
  await context.audit('manual_check_in', { event_id: input.event_id, member_code: input.member_code })
  return { first_name: member.first_name, points_awarded: row.points_awarded, total_points: row.total_points }
})
