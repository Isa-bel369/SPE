import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import TurnstileWidget from '../components/TurnstileWidget'
import { FACULTIES, PROGRAMMES_BY_FACULTY, YEARS } from '../config/programmes'
import { callFn, friendlyError } from '../lib/api'
import { normalizePhone, registrationSchema } from '../schemas/forms'
import { useRegistration } from '../state/contexts'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setRegistration } = useRegistration()
  const [programme, setProgramme] = useState('')
  const [faculty, setFaculty] = useState('')
  const [captcha, setCaptcha] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const [error, setError] = useState('')
  const [details, setDetails] = useState({})
  const [busy, setBusy] = useState(false)
  const [proof, setProof] = useState(null)
  const [payment, setPayment] = useState({})
  useEffect(() => { supabase.from('site_content').select('key,body').in('key', ['registration_fee_amount','registration_momo_number','registration_momo_name']).then(({ data }) => setPayment(Object.fromEntries((data || []).map((row) => [row.key, row.body])))) }, [])
  function validateField(field, value) {
    const schema = registrationSchema.shape[field]
    if (!schema) return
    const check = schema.safeParse(value)
    setDetails((current) => ({ ...current, [field]: check.success ? '' : check.error.issues[0].message }))
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setDetails({})
    const form = new FormData(event.currentTarget)
    const values = {
      first_name: String(form.get('first_name')).trim(), last_name: String(form.get('last_name')).trim(),
      programme, year_of_study: form.get('year_of_study'),
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
      if (!proof) { setError('Upload a screenshot of your payment.'); setBusy(false); return }
      if (!['image/jpeg','image/png','image/webp'].includes(proof.type) || proof.size > 5 * 1024 * 1024) throw new Error('Upload a JPEG, PNG, or WebP screenshot under 5 MB.')
      const path = `pending/${crypto.randomUUID()}.${proof.type === 'image/png' ? 'png' : proof.type === 'image/webp' ? 'webp' : 'jpg'}`
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(path, proof, { contentType: proof.type })
      if (uploadError) throw uploadError
      const result = await callFn('register_member', { ...parsed.data, payment_proof_path: path })
      setRegistration({ email: result.email, resendAvailableAt: Date.now() + result.resend_available_in_seconds * 1000, expiresAt: Date.now() + result.expires_in_seconds * 1000 })
      navigate('/register/verify')
    } catch (err) {
      setError(friendlyError(err, 'Could not start your registration. Check your details and try again.')); setDetails(Object.fromEntries((err.details || []).map((item) => [item.field, item.message])))
      setCaptcha(''); setResetKey((value) => value + 1)
    } finally { setBusy(false) }
  }
  return <section className="section">{location.state?.message && <p className="alert" role="status">{location.state.message}</p>}<h1>Register as a member</h1><p>Register with the SPE UMaT Chapter. We will email a verification code before issuing your membership ID.</p><form className="form" onSubmit={submit}>
    <label>First name<input name="first_name" required minLength="1" maxLength="50" autoComplete="given-name" onBlur={(event) => validateField('first_name', event.target.value)} />{details.first_name && <small>{details.first_name}</small>}</label>
    <label>Last name<input name="last_name" required minLength="1" maxLength="50" autoComplete="family-name" onBlur={(event) => validateField('last_name', event.target.value)} />{details.last_name && <small>{details.last_name}</small>}</label>
    <label>Faculty or school<select name="faculty" required value={faculty} onChange={(event) => { setFaculty(event.target.value); setProgramme('') }}><option value="" disabled>Select faculty or school</option>{FACULTIES.map((item) => <option key={item}>{item}</option>)}</select></label>
    <label>Programme<select name="programme_choice" required disabled={!faculty} value={programme} onChange={(event) => { setProgramme(event.target.value); validateField('programme', event.target.value) }}><option value="" disabled>{faculty ? 'Select programme' : 'Select a faculty or school first'}</option>{(PROGRAMMES_BY_FACULTY[faculty] || []).map((item) => <option key={item}>{item}</option>)}</select>{details.programme && <small>{details.programme}</small>}</label>
    <label>Year of study<select name="year_of_study" required defaultValue=""><option value="" disabled>Select year</option>{YEARS.map((year) => <option key={year}>{year}</option>)}</select></label>
    <h2>Mobile Money payment</h2><p>Pay GHS {payment.registration_fee_amount || '—'} to {payment.registration_momo_name || '—'} at {payment.registration_momo_number || '—'} before submitting.</p>
    <label>Payment screenshot<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => setProof(event.target.files?.[0] || null)} /></label>
    <label>Email<input name="email" type="email" required maxLength="254" autoComplete="email" onBlur={(event) => validateField('email', event.target.value)} />{details.email && <small>{details.email}</small>}</label>
    <label>Phone<input name="phone" type="tel" required autoComplete="tel" placeholder="0XXXXXXXXX or +233XXXXXXXXX" onBlur={(event) => validateField('phone', event.target.value)} />{details.phone && <small>{details.phone}</small>}</label>
    <label className="checkbox"><input name="show_on_leaderboard" type="checkbox" />Show my first name and last initial on the public leaderboard (optional)</label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex="-1" autoComplete="off" /></label></div>
    <TurnstileWidget onToken={setCaptcha} resetKey={resetKey} />
    {error && <p className="alert" role="alert">{error} {error === 'This email or phone number is already registered. Please contact the chapter executives.' && <Link to="/about">Contact the chapter</Link>}</p>}
    <button className="btn" disabled={busy || !captcha}>{busy ? 'Sending code…' : 'Register'}</button>
  </form></section>
}
