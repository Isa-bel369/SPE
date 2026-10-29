import { USERS } from '../data/seed'

const AUTH_KEY = 'spe-umat-auth-v1'

export const ROLE_LABELS = {
  member: 'Member',
  communications: 'Communications Head',
  organization: 'Organization Head',
  technical: 'Technical Head',
}

export const PERMISSIONS = {
  member: ['dashboard', 'dues', 'media'],
  communications: ['dashboard', 'dues', 'media', 'admin', 'admin-media', 'admin-news'],
  organization: ['dashboard', 'dues', 'media', 'admin', 'admin-events', 'admin-attendance'],
  technical: ['dashboard', 'dues', 'media', 'admin', 'admin-members', 'admin-merit'],
}

export function getSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function login(email, password) {
  const user = USERS.find(
    (row) => row.email.toLowerCase() === email.trim().toLowerCase() && row.password === password,
  )
  if (!user) return null
  const session = {
    email: user.email,
    name: user.name,
    role: user.role,
    memberId: user.memberId,
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  return session
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function can(session, permission) {
  if (!session) return false
  return (PERMISSIONS[session.role] || []).includes(permission)
}
