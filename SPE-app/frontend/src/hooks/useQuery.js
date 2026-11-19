import { useCallback, useEffect, useState } from 'react'
import { friendlyError } from '../lib/api'
import { getSupabaseConfigError } from '../lib/supabase'

export function useQuery(load, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const [retryKey, setRetryKey] = useState(0)
  const retry = useCallback(() => setRetryKey((value) => value + 1), [])
  useEffect(() => {
    let current = true
    setState((old) => ({ ...old, loading: true, error: '' }))
    const configError = getSupabaseConfigError()
    if (configError) {
      setState({ data: null, loading: false, error: configError })
      return () => { current = false }
    }
    Promise.resolve().then(load).then((data) => {
      if (current) setState({ data, loading: false, error: '' })
    }).catch((error) => {
      if (current) setState({ data: null, loading: false, error: friendlyError(error, 'Could not load this information. Check your connection and try again.') })
    })
    return () => { current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, retryKey])
  return { ...state, retry }
}
