import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'
import { sendEmail, memberIdEmail } from '../_shared/email.ts'
import { newMemberCode } from '../_shared/security.ts'

serveFunction('approve_registration', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const { registration_id } = body as { registration_id: string }
  for (let attempt = 0; attempt < 5; attempt++) {
    const memberCode = newMemberCode()
    const { data, error } = await db.rpc('approve_pending_registration', { p_id: registration_id, p_member_code: memberCode })
    if (!error) {
      const row = Array.isArray(data) ? data[0] : data
      const message = memberIdEmail(row.first_name, memberCode)
      let emailSent = true
      try { await sendEmail(row.email, message.subject, message.text, message.html) }
      catch { emailSent = false; console.error(JSON.stringify({ function: 'approve_registration', request_id: context.requestId, error_code: 'MEMBER_ID_EMAIL_FAILED' })) }
      await context.audit('registration_approved', { registration_id })
      return { member_code: memberCode, email_sent: emailSent }
    }
    if (`${error.message} ${error.details}`.includes('members_member_code_key')) continue
    if (`${error.message} ${error.details}`.includes('NOT_FOUND')) throw new AppError('NOT_FOUND')
    throw new AppError('SERVER_ERROR')
  }
  throw new AppError('SERVER_ERROR')
})
