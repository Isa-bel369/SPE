import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'
import { normEmail } from '../_shared/security.ts'

serveFunction('invite_admin', { kind: 'admin', roles: ['technical_head'] }, async (context, body) => {
  const input = body as { email: string; role: 'communications_head' | 'organization_head' | 'technical_head' }
  const email = normEmail(input.email)
  let existing: { id: string } | null = null
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new AppError('SERVER_ERROR')
    const match = data.users.find((user) => user.email?.toLowerCase() === email)
    if (match) { existing = { id: match.id }; break }
    if (data.users.length < 1000) break
  }
  let userId = existing?.id
  if (userId) {
    const { data: roles, error } = await db.from('user_roles').select('role').eq('user_id', userId)
    if (error) throw new AppError('SERVER_ERROR')
    if (!roles?.length) {
      const { data, error: inviteError } = await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${Deno.env.get('SITE_URL')}/admin/accept-invite` })
      if (inviteError || !data.user) throw new AppError('SERVER_ERROR')
      userId = data.user.id
    }
  } else {
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${Deno.env.get('SITE_URL')}/admin/accept-invite` })
    if (error || !data.user) throw new AppError('SERVER_ERROR')
    userId = data.user.id
  }
  const { error: roleError } = await db.from('user_roles').upsert({ user_id: userId, role: input.role }, { onConflict: 'user_id,role', ignoreDuplicates: true })
  if (roleError) throw new AppError('SERVER_ERROR')
  await context.audit('admin_invited', { email, role: input.role })
  return { user_id: userId }
})
