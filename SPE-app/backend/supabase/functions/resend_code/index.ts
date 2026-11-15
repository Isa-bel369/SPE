import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { sendEmail, verificationEmail } from '../_shared/email.ts'
import { db } from '../_shared/db.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'
import { hashValue, newVerificationCode, normEmail } from '../_shared/security.ts'

serveFunction('resend_code', { kind: 'public' }, async (context, body) => {
  const email = normEmail((body as { email: string }).email)
  await enforceLimit(`resend:ip:${context.ip}`, 10, 3600)
  await enforceLimit(`resend:email:${email}`, 3, 3600)
  const code = newVerificationCode()
  const pepper = Deno.env.get('CODE_HASH_PEPPER')
  if (!pepper) throw new AppError('SERVER_ERROR')
  const codeHash = await hashValue(`${email}:${code}`, pepper)
  const { data, error } = await db.rpc('resend_email_verification', { p_email: email, p_code_hash: codeHash })
  if (error) {
    const detail = `${error.message || ''} ${error.details || ''}`
    if (detail.includes('CODE_EXPIRED')) throw new AppError('CODE_EXPIRED')
    if (detail.includes('RATE_LIMITED')) {
      const retryAfter = Number(detail.match(/RATE_LIMITED:(\d+)/)?.[1] || 1)
      throw new AppError('RATE_LIMITED', { retryAfter })
    }
    throw new AppError('SERVER_ERROR')
  }
  const row = Array.isArray(data) ? data[0] : data
  const message = verificationEmail(row.registration_data.first_name, code)
  await sendEmail(email, message.subject, message.text, message.html)
  return { expires_in_seconds: 600, resend_available_in_seconds: 60 }
})
