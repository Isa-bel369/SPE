import { AppError } from './errors.ts'
import { db } from './db.ts'
import { b64url, b64urlDecode, bytesFromHex, hmacHex, timingSafeEqualHex } from './security.ts'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function signToken(eventId: string, windowNo: number, secret: string) {
  const message = `${eventId}.${windowNo}`
  const signature = await hmacHex(secret, message)
  return `${b64url(message)}.${b64url(bytesFromHex(signature))}`
}

export async function verifyToken(token: string) {
  const [payloadPart, signaturePart, extra] = token.split('.')
  if (!payloadPart || !signaturePart || extra) return null
  let payload: string
  let signature: string
  try { payload = decoder.decode(b64urlDecode(payloadPart)); signature = Array.from(b64urlDecode(signaturePart), (x) => x.toString(16).padStart(2, '0')).join('') }
  catch { return null }
  const [eventId, windowText, trailing] = payload.split('.')
  if (!eventId || !windowText || trailing || !/^\d+$/.test(windowText)) return null
  const { data: row, error } = await db.from('event_checkin_tokens').select('secret,rotation_seconds').eq('event_id', eventId).maybeSingle()
  if (error || !row) return null
  const expected = await hmacHex(row.secret, payload)
  if (!timingSafeEqualHex(expected, signature)) return null
  const currentWindow = Math.floor(Date.now() / 1000 / row.rotation_seconds)
  const tokenWindow = Number(windowText)
  return tokenWindow === currentWindow || tokenWindow === currentWindow - 1 ? eventId : null
}

export async function tokenForEvent(eventId: string) {
  const { data, error } = await db.from('event_checkin_tokens').select('secret,rotation_seconds').eq('event_id', eventId).maybeSingle()
  if (error) throw new AppError('SERVER_ERROR')
  if (!data) throw new AppError('NOT_FOUND')
  const now = Math.floor(Date.now() / 1000)
  const windowNo = Math.floor(now / data.rotation_seconds)
  return { token: await signToken(eventId, windowNo, data.secret), refresh_in_seconds: data.rotation_seconds - (now % data.rotation_seconds) }
}
