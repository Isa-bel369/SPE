import { Link } from 'react-router-dom'

export default function RegistrationPending() {
  return <section className="section"><h1>Application pending review</h1><p>Your email is verified and your payment proof has been submitted. An administrator will review your application. We’ll email your membership ID after approval.</p><Link className="btn secondary" to="/">Return home</Link></section>
}
