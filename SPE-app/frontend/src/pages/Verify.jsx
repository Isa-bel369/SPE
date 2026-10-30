import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { callFn } from '../lib/api'
import { useRegistration } from '../state/contexts'
import { verificationCodeSchema } from '../schemas/forms'

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [])
  return Math.max(0, Math.ceil((target - now) / 1000))
}

export default function Verify() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registration, setRegistration } = useRegistration()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resendBlocked, setResendBlocked] = useState(false)
  const cooldown = useCountdown(registration.resendAvailableAt || 0)
  const expires = useCountdown(registration.expiresAt || 0)
  if (!registration.email) return <Navigate to="/register" replace state={{ message: 'Please register again.' }} />
  async function verify(event) {
    event.preventDefault(); setBusy(true); setError('')
    const code = new FormData(event.currentTarget).get('code')
    const parsed = verificationCodeSchema.safeParse(code)
    if (!parsed.success) { setError(parsed.error.issues[0].message); setBusy(false); return }
    try {
      const result = await callFn('verify_email', { email: registration.email, code })
      setRegistration((current) => ({ ...current, memberCode: result.member_code, firstName: result.first_name }))
      navigate('/register/success')
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  async function resend() {
    setBusy(true); setError('')
    try {
      const result = await callFn('resend_code', { email: registration.email })
      setRegistration((current) => ({ ...current, resendAvailableAt: Date.now() + result.resend_available_in_seconds * 1000, expiresAt: Date.now() + result.expires_in_seconds * 1000 }))
    } catch (err) {
      setError(err.message)
      if (err.code === 'RATE_LIMITED') {
        setResendBlocked(true)
        if (err.retryAfter) setRegistration((current) => ({ ...current, resendAvailableAt: Date.now() + Math.max(err.retryAfter, 60) * 1000 }))
      }
    } finally { setBusy(false) }
  }
  return <section className="section">{location.state?.message && <p className="alert" role="status">{location.state.message}</p>}<h1>Verify your email</h1><p>We sent a 6-digit code to {registration.email}. It expires in {Math.floor(expires / 60)}:{String(expires % 60).padStart(2, '0')}.</p><form className="form" onSubmit={verify}><label>Verification code<input name="code" inputMode="numeric" pattern="[0-9]*" maxLength="6" autoComplete="one-time-code" autoFocus required /></label><button className="btn" disabled={busy}>{busy ? 'Checking…' : 'Verify email'}</button></form><button className="btn secondary" disabled={busy || cooldown > 0 || resendBlocked} onClick={resend}>{resendBlocked ? 'Resend limit reached' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}</button>{error && <p className="alert" role="alert">{error} {(error.includes('expired') || error.includes('wrong codes') || error.includes('attempts')) && <Link to="/register">Register again</Link>}</p>}</section>
}
