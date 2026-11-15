export type ErrorCode =
  | 'VALIDATION_ERROR' | 'CAPTCHA_FAILED' | 'CODE_INVALID' | 'LOCATION_DENIED'
  | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CHECKIN_CLOSED' | 'OUTSIDE_AREA' | 'ID_NOT_FOUND'
  | 'NOT_FOUND' | 'DUPLICATE_REGISTRATION' | 'ALREADY_CHECKED_IN' | 'DEVICE_ALREADY_USED'
  | 'EVENT_HAS_CHECKINS' | 'LAST_TECHNICAL_HEAD' | 'CODE_EXPIRED' | 'QR_EXPIRED'
  | 'SESSION_INVALID' | 'RATE_LIMITED' | 'TOO_MANY_ATTEMPTS' | 'SERVER_ERROR'

const status: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400, CAPTCHA_FAILED: 400, CODE_INVALID: 400, LOCATION_DENIED: 400,
  UNAUTHORIZED: 401, FORBIDDEN: 403, CHECKIN_CLOSED: 403, OUTSIDE_AREA: 403,
  ID_NOT_FOUND: 404, NOT_FOUND: 404, DUPLICATE_REGISTRATION: 409,
  ALREADY_CHECKED_IN: 409, DEVICE_ALREADY_USED: 409, EVENT_HAS_CHECKINS: 409,
  LAST_TECHNICAL_HEAD: 409, CODE_EXPIRED: 410, QR_EXPIRED: 410,
  SESSION_INVALID: 410, RATE_LIMITED: 429, TOO_MANY_ATTEMPTS: 429, SERVER_ERROR: 500,
}

export const messages: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Input failed validation.', CAPTCHA_FAILED: 'CAPTCHA verification failed.',
  CODE_INVALID: 'Verification code is not correct.', LOCATION_DENIED: 'Location is required or too inaccurate.',
  UNAUTHORIZED: 'Admin call without a valid session.', FORBIDDEN: 'Signed-in admin lacks the required role.',
  CHECKIN_CLOSED: 'Check-in is closed for this event.', OUTSIDE_AREA: 'Phone is outside the event area.',
  ID_NOT_FOUND: 'ID not found.', NOT_FOUND: 'This item no longer exists.',
  DUPLICATE_REGISTRATION: 'This email or phone number is already registered. Please contact the chapter executives.',
  ALREADY_CHECKED_IN: 'You are already checked in to this event.',
  DEVICE_ALREADY_USED: 'This phone has already been used to check in for this event.',
  EVENT_HAS_CHECKINS: 'This event has check-ins and cannot be deleted. Unpublish it instead.',
  LAST_TECHNICAL_HEAD: 'At least one Technical Head must remain.',
  CODE_EXPIRED: 'That code has expired. Request a new one or register again.',
  QR_EXPIRED: 'This QR code has expired. Scan the screen again.',
  SESSION_INVALID: 'Your check-in session has ended. Scan the QR code again.',
  RATE_LIMITED: 'Too many attempts. Please wait and try again.',
  TOO_MANY_ATTEMPTS: 'Too many wrong verification codes. Please register again.',
  SERVER_ERROR: 'Something went wrong. Please try again.',
}

export class AppError extends Error {
  code: ErrorCode
  details?: { field: string; message: string }[]
  retryAfter?: number
  constructor(code: ErrorCode, options: { details?: { field: string; message: string }[]; retryAfter?: number; message?: string } = {}) {
    super(options.message || messages[code])
    this.name = 'AppError'
    this.code = code
    this.details = options.details
    this.retryAfter = options.retryAfter
  }
  get status() { return status[this.code] }
}

export function validationError(issues: { path: PropertyKey[]; message: string }[]) {
  return new AppError('VALIDATION_ERROR', {
    details: issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  })
}

export function mapDatabaseError(error: { code?: string; message?: string; details?: string } | null, fallback: ErrorCode = 'SERVER_ERROR'): AppError {
  const detail = `${error?.message || ''} ${error?.details || ''}`
  if (detail.includes('members_email_key') || detail.includes('members_phone_key')) return new AppError('DUPLICATE_REGISTRATION')
  if (detail.includes('members_member_code_key')) return new AppError('SERVER_ERROR')
  if (detail.includes('attendance_event_member_uq')) return new AppError('ALREADY_CHECKED_IN')
  if (detail.includes('attendance_event_device_uq')) return new AppError('DEVICE_ALREADY_USED')
  if (detail.includes('EVENT_HAS_CHECKINS')) return new AppError('EVENT_HAS_CHECKINS')
  if (detail.includes('LAST_TECHNICAL_HEAD')) return new AppError('LAST_TECHNICAL_HEAD')
  if (detail.includes('NOT_FOUND')) return new AppError('NOT_FOUND')
  if (detail.includes('CODE_EXPIRED')) return new AppError('CODE_EXPIRED')
  if (detail.includes('CODE_INVALID')) return new AppError('CODE_INVALID')
  if (detail.includes('SESSION_INVALID')) return new AppError('SESSION_INVALID')
  if (error?.code === '23505') return new AppError(fallback)
  return new AppError(fallback)
}
