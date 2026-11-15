import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { verifyTurnstile } from '../_shared/captcha.ts'
import { db } from '../_shared/db.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'
import { normEmail } from '../_shared/security.ts'

serveFunction('submit_contact', { kind: 'public' }, async (context, body) => {
  const input = body as { name: string; email: string; message: string; captcha_token: string; website: string }
  const email = normEmail(input.email)
  await enforceLimit(`contact:ip:${context.ip}`, 3, 3600)
  await enforceLimit(`contact:email:${email}`, 5, 86400)
  if (input.website) return {}
  await verifyTurnstile(input.captcha_token, context.ip)
  const { error } = await db.from('contact_messages').insert({ name: input.name.trim(), email, message: input.message.trim() })
  if (error) throw new AppError('SERVER_ERROR')
  return {}
})
