import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('set_user_role', { kind: 'admin', roles: ['technical_head'] }, async (context, body) => {
  const input = body as { user_id: string; role: 'communications_head' | 'organization_head' | 'technical_head'; action: 'add' | 'remove' }
  const { data, error } = await db.rpc('set_admin_user_role', {
    p_user_id: input.user_id, p_role: input.role, p_action: input.action, p_caller: context.user!.id,
  })
  if (error) {
    if (`${error.message} ${error.details || ''}`.includes('LAST_TECHNICAL_HEAD')) throw new AppError('LAST_TECHNICAL_HEAD')
    throw new AppError('SERVER_ERROR')
  }
  await context.audit('role_changed', { user_id: input.user_id, role: input.role, action: input.action })
  return { roles: data || [] }
})
