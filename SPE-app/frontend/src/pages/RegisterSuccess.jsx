import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useRegistration } from '../state/contexts'

export default function RegisterSuccess() {
  const navigate = useNavigate()
  const { registration, setRegistration } = useRegistration()
  const [copied, setCopied] = useState(false)
  if (!registration.memberCode) return <Navigate to="/register" replace />
  async function copy() {
    try { await navigator.clipboard.writeText(registration.memberCode) }
    catch {
      const input = document.createElement('textarea'); input.value = registration.memberCode; document.body.appendChild(input); input.select(); document.execCommand('copy'); input.remove()
    }
    setCopied(true)
  }
  return <section className="section register-success"><h1>Welcome, {registration.firstName}</h1><p>Your membership ID is:</p><strong className="member-code">{registration.memberCode}</strong><button className="btn secondary" onClick={copy}>{copied ? 'Copied' : 'Copy ID'}</button><p>Save this ID now. You need it to check in to events and to see your merit points. A copy has also been emailed to you.</p><button className="btn" onClick={() => { setRegistration({}); navigate('/') }}>I have saved my ID</button></section>
}
