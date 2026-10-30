import { serveFunction } from '../_shared/http.ts'
import { AppError, mapDatabaseError } from '../_shared/errors.ts'
import { sendEmail, memberIdEmail } from '../_shared/email.ts'
import { db } from '../_shared/db.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'
import { hashValue, newMemberCode, normEmail, timingSafeEqualHex } from '../_shared/security.ts'

serveFunction('verify_email', { kind: 'public' }, async (context, body) => {
  const input = body as { email: string; code: string }
  const email = normEmail(input.email)
  await enforceLimit(`verify:ip:${context.ip}`, 20, 3600)
  await enforceLimit(`verify:email:${email}`, 10, 3600)

  const { data: pending, error } = await db.from('email_verifications').select('code_hash,registration_data,expires_at').eq('email', email).maybeSingle()
  if (error) throw new AppError('SERVER_ERROR')
  if (!pending) throw new AppError('CODE_EXPIRED')

  const { data: attempts, error: attemptsError } = await db.rpc('bump_email_verification_attempt', { p_email: email })
  if (attemptsError) throw new AppError('SERVER_ERROR')
  if (Number(attempts) < 0) throw new AppError('CODE_EXPIRED')
  if (Number(attempts) > 5) throw new AppError('TOO_MANY_ATTEMPTS')

  const pepper = Deno.env.get('CODE_HASH_PEPPER')
  if (!pepper) throw new AppError('SERVER_ERROR')
  const submitted = await hashValue(`${email}:${input.code}`, pepper)
  if (!timingSafeEqualHex(submitted, pending.code_hash)) throw new AppError('CODE_INVALID')

  let memberCode = ''
  let created: { member_id: string; first_name: string } | null = null
  for (let attempt = 0; attempt < 5; attempt++) {
    memberCode = newMemberCode()
    const { data, error: createError } = await db.rpc('consume_email_verification', {
      p_email: email, p_code_hash: submitted, p_member_code: memberCode,
    })
    if (!createError) {
      const row = Array.isArray(data) ? data[0] : data
      created = row
      break
    }
    const detail = `${createError.message || ''} ${createError.details || ''}`
    if (detail.includes('members_member_code_key')) continue
    if (detail.includes('members_email_key') || detail.includes('members_phone_key') || createError.code === '23505') throw new AppError('DUPLICATE_REGISTRATION')
    throw mapDatabaseError(createError)
  }
  if (!created) throw new AppError('SERVER_ERROR')

  const message = memberIdEmail(created.first_name, memberCode)
  try { await sendEmail(email, message.subject, message.text, message.html) }
  catch { console.error(JSON.stringify({ function: 'verify_email', request_id: context.requestId, error_code: 'MEMBER_ID_EMAIL_FAILED' })) }
  return { member_code: memberCode, first_name: created.first_name }
})
