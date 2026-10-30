import { useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'
import { supabase } from '../lib/supabase'
import { AuthContext, CheckinContext, RegistrationContext } from './contexts'

function rolesFor(session) {
  if (!session?.access_token) return []
  try { return jwtDecode(session.access_token).app_roles || [] } catch { return [] }
}

export function AppStateProvider({ children }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [registration, setRegistration] = useState({})
  const [checkin, setCheckin] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false) }).catch(() => setAuthLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setAuthLoading(false) })
    return () => data.subscription.unsubscribe()
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

