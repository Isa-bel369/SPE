import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

export const MESSAGES = {
  VALIDATION_ERROR: 'Please check the highlighted fields.',
  CAPTCHA_FAILED: 'Please complete the verification and try again.',
  CODE_INVALID: 'That code is not correct.',
  LOCATION_DENIED: 'Location is required. Allow location for this site, then scan the QR code again.',
  UNAUTHORIZED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to do this.',
  CHECKIN_CLOSED: 'Check-in is closed for this event.',
  OUTSIDE_AREA: 'You do not appear to be at the event. Move closer and try again.',
  ID_NOT_FOUND: 'ID not found.',
  NOT_FOUND: 'This item no longer exists.',
  DUPLICATE_REGISTRATION: 'This email or phone number is already registered. Please contact the chapter executives.',
  ALREADY_CHECKED_IN: 'You are already checked in to this event.',
  DEVICE_ALREADY_USED: 'This phone has already been used to check in for this event.',
  EVENT_HAS_CHECKINS: 'This event has check-ins and cannot be deleted. Unpublish it instead.',
  LAST_TECHNICAL_HEAD: 'At least one Technical Head must remain.',
  CODE_EXPIRED: 'That code has expired. Request a new one or register again.',
  QR_EXPIRED: 'This QR code has expired. Scan the screen again.',
  SESSION_INVALID: 'Your check-in session has ended. Scan the QR code again.',
  RATE_LIMITED: 'Too many attempts. Please wait and try again.',
  TOO_MANY_ATTEMPTS: 'Too many wrong codes. Please register again.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
}

export class ApiError extends Error {
  constructor(code, message, details, retryAfter) {
    const base = message || MESSAGES[code] || MESSAGES.SERVER_ERROR
    super(code === 'RATE_LIMITED' && retryAfter ? `${base} Try again in ${retryAfter} seconds.` : base)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.retryAfter = retryAfter
  }
}

export async function callFn(name, body = {}, accessToken) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new ApiError('SERVER_ERROR', 'Supabase frontend settings are missing. Copy the values from .env.example.')
  const headers = { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  let result
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
    })
    result = await response.json()
  } catch {
    throw new ApiError('SERVER_ERROR')
  }
  if (!result?.ok) {
    const error = result?.error || {}
    throw new ApiError(error.code || 'SERVER_ERROR', MESSAGES[error.code] || error.message, error.details, error.retry_after_seconds)
  }
  return result.data
}

export async function adminCall(name, body = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) { await supabase.auth.signOut(); throw new ApiError('UNAUTHORIZED') }
  try { return await callFn(name, body, session.access_token) }
  catch (error) {
    if (error.code === 'UNAUTHORIZED') await supabase.auth.signOut()
    throw error
  }
}
