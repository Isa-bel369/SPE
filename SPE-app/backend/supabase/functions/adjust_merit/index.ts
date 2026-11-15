import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('adjust_merit', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const input = body as { member_code: string; points: number; reason: string }
  const { data: member, error: findError } = await db.from('members').select('id').eq('member_code', input.member_code).maybeSingle()
  if (findError) throw new AppError('SERVER_ERROR')
  if (!member) throw new AppError('ID_NOT_FOUND')
  const { error } = await db.from('merit_records').insert({
    member_id: member.id, points: input.points, source: 'manual_adjustment', reason: input.reason, awarded_by: context.user!.id,
  })
  if (error) throw new AppError('SERVER_ERROR')
  const { data: total, error: totalError } = await db.rpc('member_total', { p_member: member.id })
  if (totalError) throw new AppError('SERVER_ERROR')
  await context.audit('merit_adjusted', { member_code: input.member_code, points: input.points, reason: input.reason })
  return { total_points: Number(total || 0) }
})
