import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('delete_member', { kind: 'admin', roles: ['technical_head'] }, async (context, body) => {
  const memberId = (body as { member_id: string }).member_id
  const { data: member, error: findError } = await db.from('members').select('member_code').eq('id', memberId).maybeSingle()
  if (findError) throw new AppError('SERVER_ERROR')
  if (!member) throw new AppError('NOT_FOUND')
  const { error } = await db.rpc('perform_delete_member', { p_member: memberId })
  if (error) throw new AppError('SERVER_ERROR')
  await context.audit('member_deleted', { member_code: member.member_code })
  return {}
})
