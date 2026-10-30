import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('list_admins', { kind: 'admin', roles: ['technical_head'] }, async () => {
  const { data: roleRows, error: roleError } = await db.from('user_roles').select('user_id,role')
  if (roleError) throw new AppError('SERVER_ERROR')
  const rolesByUser = new Map<string, string[]>()
  for (const row of roleRows || []) rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) || []), row.role])
  const users = []
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new AppError('SERVER_ERROR')
    users.push(...data.users)
    if (data.users.length < 1000) break
  }
  const admins = users.filter((user) => rolesByUser.has(user.id)).map((user) => ({
    user_id: user.id, email: user.email || '', roles: rolesByUser.get(user.id) || [], last_sign_in_at: user.last_sign_in_at || null,
  }))
  return { admins }
})
