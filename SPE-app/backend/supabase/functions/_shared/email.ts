import { AppError } from './errors.ts'

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export async function sendEmail(to: string, subject: string, text: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY') || Deno.env.get('Resend_API')
  const from = Deno.env.get('EMAIL_FROM')
  if (!apiKey || !from) throw new AppError('SERVER_ERROR')
  const result = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: `SPE UMaT Chapter <${from}>`, to: [to], subject, text, html }),
  })
  if (!result.ok) throw new AppError('SERVER_ERROR')
}

export function verificationEmail(firstName: string, code: string) {
  const name = escapeHtml(firstName)
  return {
    subject: 'Your SPE UMaT Chapter verification code',
    text: `Hello ${firstName}, your verification code is ${code}. It expires in 10 minutes. If you did not try to register, ignore this email.`,
    html: `<p>Hello ${name},</p><p>Your verification code is <strong>${code}</strong>. It expires in 10 minutes.</p><p>If you did not try to register, ignore this email.</p>`,
  }
}

export function memberIdEmail(firstName: string, memberCode: string) {
  const name = escapeHtml(firstName)
  const site = Deno.env.get('SITE_URL') || ''
  return {
    subject: 'Your SPE UMaT Chapter membership ID',
    text: `Welcome to the SPE UMaT Chapter, ${firstName}. Your membership ID is ${memberCode}. Use it to check in to events and to see your merit points at ${site}/merit. Keep it safe and do not share it.`,
    html: `<p>Welcome to the SPE UMaT Chapter, ${name}.</p><p>Your membership ID is <strong>${memberCode}</strong>.</p><p>Use it to check in to events and to see your merit points at <a href="${escapeHtml(site)}/merit">${escapeHtml(site)}/merit</a>. Keep it safe and do not share it.</p>`,
  }
}
