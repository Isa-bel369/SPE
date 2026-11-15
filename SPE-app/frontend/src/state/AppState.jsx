import { useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { supabase } from '../lib/supabase'
import { AuthContext, CheckinContext, RegistrationContext } from './contexts'

const ADMIN_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000

function rolesFor(session) {
  if (!session?.access_token) return []
  try { return jwtDecode(session.access_token).app_roles || [] } catch { return [] }
}

function sessionIdFor(session) {
  if (!session?.access_token) return null
  try { return jwtDecode(session.access_token).session_id || null } catch { return null }
}

function adminSessionStartedAt(sessionId) {
  const key = `spe-admin-session-start:${sessionId}`
  const now = Date.now()
  try {
    const saved = Number(localStorage.getItem(key))
    if (Number.isFinite(saved) && saved > 0 && saved <= now) return saved
    localStorage.setItem(key, String(now))
  } catch {}
  return now
}

export function AppStateProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [registration, setRegistration] = useState({})
  const [checkin, setCheckin] = useState(null)

  useEffect(() => {
    let timeoutId
    let activeAdminSessionId = null
    let disposed = false

    function clearTimeoutIfSet() {
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = undefined
    }

    function acceptSession(nextSession) {
      if (disposed) return
      clearTimeoutIfSet()
      if (!nextSession) {
        if (activeAdminSessionId) {
          try { localStorage.removeItem(`spe-admin-session-start:${activeAdminSessionId}`) } catch {}
        }
        activeAdminSessionId = null
        setSession(null)
        setAuthLoading(false)
        return
      }

      if (!rolesFor(nextSession).length) {
        activeAdminSessionId = null
        setSession(nextSession)
        setAuthLoading(false)
        return
      }

      const sessionId = sessionIdFor(nextSession)
      if (!sessionId) {
        setSession(nextSession)
        setAuthLoading(false)
        return
      }

      activeAdminSessionId = sessionId
      const expiresAt = adminSessionStartedAt(sessionId) + ADMIN_SESSION_MAX_AGE_MS
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        setSession(null)
        setAuthLoading(false)
        void supabase.auth.signOut({ scope: 'local' })
        return
      }

      setSession(nextSession)
      setAuthLoading(false)
      timeoutId = window.setTimeout(() => {
        if (activeAdminSessionId !== sessionId) return
        setSession(null)
        void supabase.auth.signOut({ scope: 'local' })
      }, remaining)
    }

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      queueMicrotask(() => acceptSession(nextSession))
    })
    supabase.auth.getSession().then(({ data: result }) => acceptSession(result.session)).catch(() => setAuthLoading(false))

    return () => {
      disposed = true
      clearTimeoutIfSet()
      data.subscription.unsubscribe()
    }
  }, [])

  const auth = useMemo(() => ({ session, roles: rolesFor(session), authLoading, signOut: () => supabase.auth.signOut() }), [session, authLoading])
  return (
    <AuthContext.Provider value={auth}>
      <RegistrationContext.Provider value={{ registration, setRegistration }}>
        <CheckinContext.Provider value={{ checkin, setCheckin }}>{children}</CheckinContext.Provider>
      </RegistrationContext.Provider>
    </AuthContext.Provider>
  )
}

