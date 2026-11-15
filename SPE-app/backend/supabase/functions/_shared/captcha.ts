import { AppError } from './errors.ts'

export async function verifyTurnstile(token: string, ip: string) {
  const secret = Deno.env.get('CAPTCHA_SECRET_KEY')
  if (!secret) throw new AppError('SERVER_ERROR')
  const form = new URLSearchParams({ secret, response: token })
  if (ip !== 'unknown') form.set('remoteip', ip)
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
    const result = await response.json()
    if (!response.ok || !result.success) throw new AppError('CAPTCHA_FAILED')
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('SERVER_ERROR')
  }
}
