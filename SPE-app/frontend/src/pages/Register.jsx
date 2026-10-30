import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import TurnstileWidget from '../components/TurnstileWidget'
import { PROGRAMMES, YEARS } from '../config/programmes'
import { callFn } from '../lib/api'
import { normalizePhone, registrationSchema } from '../schemas/forms'
import { useRegistration } from '../state/contexts'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setRegistration } = useRegistration()
  const [programme, setProgramme] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState('')
  const [details, setDetails] = useState({})
  const [busy, setBusy] = useState(false)
  function validateField(field, value) {
    const schema = registrationSchema.shape[field]
    if (!schema) return
    const check = schema.safeParse(value)
    setDetails((current) => ({ ...current, [field]: check.success ? '' : check.error.issues[0].message }))
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setDetails({})
    const form = new FormData(event.currentTarget)
    const other = String(form.get('programme_other') || '').trim()
    const values = {
      first_name: String(form.get('first_name')).trim(), last_name: String(form.get('last_name')).trim(),
      programme: programme === 'Other' ? other : programme, year_of_study: form.get('year_of_study'),
      email: form.get('email'), phone: normalizePhone(String(form.get('phone'))), show_on_leaderboard: form.get('show_on_leaderboard') === 'on',
      captcha_token: captcha, website: form.get('website') || '',
    }
    try {
      const parsed = registrationSchema.safeParse(values)
      if (!parsed.success) {
        setDetails(Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])))
        setBusy(false)
        return
      }
      const result = await callFn('register_member', parsed.data)
      setRegistration({ email: result.email, resendAvailableAt: Date.now() + result.resend_available_in_seconds * 1000, expiresAt: Date.now() + result.expires_in_seconds * 1000 })
      navigate('/register/verify')
    } catch (err) {
      setError(err.message); setDetails(Object.fromEntries((err.details || []).map((item) => [item.field, item.message])))
      setCaptcha(''); setResetKey((value) => value + 1)
    } finally { setBusy(false) }
  }
  return <section className="section">{location.state?.message && <p className="alert" role="status">{location.state.message}</p>}<h1>Register as a member</h1><p>Register with the SPE UMaT Chapter. We will email a verification code before issuing your membership ID.</p><form className="form" onSubmit={submit}>
    <label>First name<input name="first_name" required minLength="1" maxLength="50" autoComplete="given-name" onBlur={(event) => validateField('first_name', event.target.value)} />{details.first_name && <small>{details.first_name}</small>}</label>
    <label>Last name<input name="last_name" required minLength="1" maxLength="50" autoComplete="family-name" onBlur={(event) => validateField('last_name', event.target.value)} />{details.last_name && <small>{details.last_name}</small>}</label>
    <label>Programme<select name="programme_choice" required value={programme} onChange={(event) => setProgramme(event.target.value)}><option value="" disabled>Select programme</option>{PROGRAMMES.map((item) => <option key={item}>{item}</option>)}</select></label>
    {programme === 'Other' && <label>Programme name<input name="programme_other" required minLength="2" maxLength="100" onBlur={(event) => validateField('programme', event.target.value)} />{details.programme && <small>{details.programme}</small>}</label>}
    <label>Year of study<select name="year_of_study" required defaultValue=""><option value="" disabled>Select year</option>{YEARS.map((year) => <option key={year}>{year}</option>)}</select></label>
    <label>Email<input name="email" type="email" required maxLength="254" autoComplete="email" onBlur={(event) => validateField('email', event.target.value)} />{details.email && <small>{details.email}</small>}</label>
    <label>Phone<input name="phone" type="tel" required autoComplete="tel" placeholder="0XXXXXXXXX or +233XXXXXXXXX" onBlur={(event) => validateField('phone', event.target.value)} />{details.phone && <small>{details.phone}</small>}</label>
    <label className="checkbox"><input name="show_on_leaderboard" type="checkbox" />Show my first name and last initial on the public leaderboard (optional)</label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex="-1" autoComplete="off" /></label></div>
    <TurnstileWidget onToken={setCaptcha} resetKey={resetKey} />
    <p className="privacy-notice">The SPE UMaT Chapter collects your name, email address, phone number, programme and year of study to register you as a member, verify your email, issue your membership ID and record your merit points. Only authorised chapter executives can see this information, and it is not sold or shared. Your first name and last initial appear on the public leaderboard only if you tick the box above. Under the Data Protection Act, 2012 (Act 843) you may ask the executives to correct or remove your information.</p>
    {error && <p className="alert" role="alert">{error} {error === 'This email or phone number is already registered. Please contact the chapter executives.' && <Link to="/about">Contact the chapter</Link>}</p>}
    <button className="btn" disabled={busy || !captcha}>{busy ? 'Sending code…' : 'Register'}</button>
  </form></section>
}
