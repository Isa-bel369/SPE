import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('remove_check_in', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const input = body as { attendance_id: string; reason: string }
  const { data: attendance, error: findError } = await db.from('attendance').select('id,member_id,members(member_code)').eq('id', input.attendance_id).maybeSingle()
  if (findError) throw new AppError('SERVER_ERROR')
  if (!attendance) throw new AppError('NOT_FOUND')
  const { data, error } = await db.rpc('perform_remove_check_in', { p_attendance: input.attendance_id, p_reason: input.reason, p_admin: context.user!.id })
  if (error) throw new AppError('SERVER_ERROR')
  const row = Array.isArray(data) ? data[0] : data
  const member = Array.isArray(attendance.members) ? attendance.members[0] : attendance.members
  await context.audit('check_in_removed', { attendance_id: input.attendance_id, member_code: member?.member_code, reason: input.reason })
  return { total_points: row.total_points }
})
