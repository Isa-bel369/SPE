import { serveFunction } from '../_shared/http.ts'
import { AppError, mapDatabaseError } from '../_shared/errors.ts'
import { verifyTurnstile } from '../_shared/captcha.ts'
import { sendEmail, verificationEmail } from '../_shared/email.ts'
import { db } from '../_shared/db.ts'
import { enforceLimit } from '../_shared/rateLimit.ts'
import { hashValue, newVerificationCode, normEmail, normPhone } from '../_shared/security.ts'

serveFunction('register_member', { kind: 'public' }, async (context, body) => {
  const input = body as { first_name: string; last_name: string; programme: string; year_of_study: string; email: string; phone: string; show_on_leaderboard?: boolean; captcha_token: string; website: string }
  const email = normEmail(input.email)
  const phone = normPhone(input.phone)
  if (!phone) throw new AppError('VALIDATION_ERROR', { details: [{ field: 'phone', message: 'Enter a Ghanaian phone number or international E.164 number.' }] })
  await enforceLimit(`register:ip:${context.ip}`, 5, 3600)
  await enforceLimit(`register:email:${email}`, 3, 3600)
  if (input.website) return { email, expires_in_seconds: 600, resend_available_in_seconds: 60 }
  await verifyTurnstile(input.captcha_token, context.ip)

  const { data: duplicate, error: findError } = await db.from('members').select('id').or(`email.eq.${email},phone.eq.${phone}`).limit(1)
  if (findError) throw new AppError('SERVER_ERROR')
  if (duplicate?.length) throw new AppError('DUPLICATE_REGISTRATION')

  const code = newVerificationCode()
  const codePepper = Deno.env.get('CODE_HASH_PEPPER')
  if (!codePepper) throw new AppError('SERVER_ERROR')
  const codeHash = await hashValue(`${email}:${code}`, codePepper)
  const registrationData = {
    first_name: input.first_name.trim(), last_name: input.last_name.trim(), programme: input.programme.trim(),
    year_of_study: input.year_of_study, phone, show_on_leaderboard: input.show_on_leaderboard ?? false,
  }
  const { error: upsertError } = await db.rpc('upsert_email_verification', { p_email: email, p_data: registrationData, p_code_hash: codeHash })
  if (upsertError) throw mapDatabaseError(upsertError)
  const message = verificationEmail(registrationData.first_name, code)
  await sendEmail(email, message.subject, message.text, message.html)
  return { email, expires_in_seconds: 600, resend_available_in_seconds: 60 }
})
