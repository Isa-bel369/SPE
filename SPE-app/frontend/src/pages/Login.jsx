import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function onSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.target)
    const session = login(form.get('email'), form.get('password'))
    if (!session) {
      setError('Unknown email or password. Use a demo account from the README.')
      return
    }
    navigate(session.role === 'member' ? '/dashboard' : '/admin')
    window.location.reload()
  }

  return (
    <section className="section">
      <h2>Member login</h2>
      <p className="muted">Demo accounts are listed in the project README.</p>
      <form className="form" onSubmit={onSubmit}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button className="btn" type="submit">
          Sign in
        </button>
      </form>
      {error && <p>{error}</p>}
    </section>
  )
}
