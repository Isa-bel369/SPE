import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { sendEmail } from '../_shared/email.ts'
import { db } from '../_shared/db.ts'

serveFunction('send_contact_notification', { kind: 'webhook' }, async (_context, body) => {
  const record = (body as { record: { name: string; email: string; message: string } }).record
  const { data: roles, error } = await db.from('user_roles').select('user_id').in('role', ['communications_head', 'technical_head'])
  if (error) throw new AppError('SERVER_ERROR')
  const userIds = [...new Set((roles || []).map((row) => row.user_id))]
  if (!userIds.length) return {}
  const emailAddresses = new Set<string>()
  for (let page = 1; ; page++) {
    const { data, error: usersError } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (usersError) throw new AppError('SERVER_ERROR')
    for (const user of data.users) if (userIds.includes(user.id) && user.email) emailAddresses.add(user.email)
    if (data.users.length < 1000) break
  }
  const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
  const text = `From: ${record.name} <${record.email}>\n\n${record.message}`
  const html = `<p>From: ${escape(record.name)} &lt;${escape(record.email)}&gt;</p><p>${escape(record.message).replace(/\n/g, '<br>')}</p>`
  const results = await Promise.allSettled([...emailAddresses].map((address) => sendEmail(address, `New message from ${record.name}`, text, html)))
  if (results.some((result) => result.status === 'rejected')) throw new AppError('SERVER_ERROR')
  return {}
})
