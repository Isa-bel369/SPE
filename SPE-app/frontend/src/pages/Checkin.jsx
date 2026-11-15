import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { callFn, friendlyError } from '../lib/api'
import { getDeviceToken, getPosition } from '../lib/device'
import { useCheckin } from '../state/contexts'

const locationNotice = 'Your phone’s location is used only to confirm that you are at the event. It is checked and then discarded. Only the result and an approximate distance are saved.'

export default function Checkin() {
  const { eventToken } = useParams()
  const navigate = useNavigate()
  const { checkin, setCheckin } = useCheckin()
  const [phase, setPhase] = useState(eventToken ? 'locating' : checkin ? 'ready' : 'idle')
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [result, setResult] = useState(null)
  const [seconds, setSeconds] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const started = useRef({ token: '', task: null })

  useEffect(() => {
    if (!eventToken) return
    let cancelled = false
    if (started.current.token !== eventToken) started.current = { token: eventToken, task: null }
    if (!started.current.task) started.current.task = (async () => {
      setPhase('locating'); setError(''); setErrorCode('')
      const location = await getPosition()
      setPhase('starting')
      return callFn('start_check_in', { event_token: eventToken, device_token: getDeviceToken(), location })
    })()
    started.current.task.then((response) => {
      if (cancelled) return
      const deviceToken = getDeviceToken()
      setCheckin({ ...response, deviceToken, startedAt: Date.now() })
      navigate('/checkin', { replace: true })
    }).catch((err) => {
      if (!cancelled) { const message = friendlyError(err, 'Could not confirm your location. Allow location access and try again.'); setError(err.code === 'LOCATION_DENIED' ? `${message} Open your browser settings, allow location for this site, then scan the QR code again.` : message); setErrorCode(err.code || ''); setPhase('error') }
    })
    return () => { cancelled = true }
  }, [eventToken, attempt, navigate, setCheckin])

  useEffect(() => {
    if (!checkin?.expires_at || result) return undefined
    const update = () => setSeconds(Math.max(0, Math.ceil((new Date(checkin.expires_at).getTime() - Date.now()) / 1000)))
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer)
  }, [checkin, result])

  async function submit(event) {
    event.preventDefault(); setPhase('submitting'); setError(''); setErrorCode('')
    const member_code = String(new FormData(event.currentTarget).get('member_code')).trim()
    try {
      const location = await getPosition()
      const response = await callFn('check_in', { session_id: checkin.session_id, member_code, device_token: checkin.deviceToken, location })
      setResult(response); setCheckin(null); setPhase('success')
    } catch (err) {
      const message = friendlyError(err, 'Could not complete check-in. Check your connection and try again.')
      setError(err.code === 'LOCATION_DENIED' ? `${message} Open your browser settings, allow location for this site, then scan the QR code again.` : message)
      setErrorCode(err.code || '')
      if (['SESSION_INVALID', 'QR_EXPIRED'].includes(err.code)) { setCheckin(null); setPhase('expired') }
      else setPhase('ready')
    }
  }

  if (eventToken && (phase === 'locating' || phase === 'starting')) return <section className="section" role="status"><h1>{phase === 'locating' ? 'Getting your location' : 'Confirming the event code'}</h1><p>Please keep this page open.</p></section>
  if (eventToken && phase === 'error') return <section className="section"><h1>Check-in could not start</h1><p className="alert" role="alert">{error}</p><button className="btn" onClick={() => { started.current = { token: '', task: null }; setAttempt((value) => value + 1) }}>Try again</button><p>Scan the QR code on the screen again if the code has expired.</p></section>
  if (result) return <section className="section"><h1>Checked in</h1><p>Checked in, +{result.points_awarded} points</p><p>{result.first_name}, your new total is {result.total_points} points.</p><p>{result.event_title}</p></section>
  if (phase === 'expired') return <section className="section"><h1>Check-in session ended</h1><p className="alert">Your check-in session has ended. Scan the QR code again.</p></section>
  if (!checkin) return <section className="section"><h1>Event check-in</h1><p>Scan the QR code on the screen to start check-in.</p></section>
  return <section className="section"><h1>{checkin.event_title}</h1><p>{locationNotice}</p><p>Session expires in {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</p>{seconds === 0 ? <p className="alert">Your check-in session has ended. Scan the QR code again.</p> : <form className="form" onSubmit={submit}><label>6-digit membership ID<input name="member_code" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength="6" autoComplete="off" required /></label><button className="btn" disabled={phase === 'submitting'}>{phase === 'submitting' ? 'Checking in…' : 'Check in'}</button></form>}{error && <div className="alert" role="alert"><p>{error}</p>{['RATE_LIMITED', 'SERVER_ERROR', 'OUTSIDE_AREA', 'LOCATION_DENIED'].includes(errorCode) && <button className="btn secondary" onClick={() => { setError(''); setErrorCode('') }}>Try again</button>}{['LOCATION_DENIED', 'DEVICE_ALREADY_USED', 'CHECKIN_CLOSED'].includes(errorCode) && <p>Please see an executive.</p>}</div>}</section>
}
