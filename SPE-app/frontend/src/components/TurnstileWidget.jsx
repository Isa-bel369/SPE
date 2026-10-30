import { Turnstile } from '@marsidev/react-turnstile'
import { CAPTCHA_SITE_KEY } from '../lib/supabase'

export default function TurnstileWidget({ onToken, resetKey }) {
  if (!CAPTCHA_SITE_KEY) return <p className="muted">CAPTCHA site key is missing. Configure VITE_CAPTCHA_SITE_KEY.</p>
  return <Turnstile key={resetKey} siteKey={CAPTCHA_SITE_KEY} onSuccess={onToken} onExpire={() => onToken('')} onError={() => onToken('')} />
}
