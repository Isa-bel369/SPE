import { AppError } from './errors.ts'

function bytesToHex(bytes: Uint8Array) { return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('') }
function hexToBytes(hex: string) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) throw new Error('Invalid hex')
  return new Uint8Array(hex.match(/.{2}/g)!.map((part) => parseInt(part, 16)))
}

export async function hmacHex(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))))
}

export async function hashValue(value: string, secret = Deno.env.get('DEVICE_HASH_PEPPER') || '') {
  if (!secret) throw new Error('DEVICE_HASH_PEPPER is not configured')
  return hmacHex(secret, value)
}

export function timingSafeEqualHex(a: string, b: string) {
  let left: Uint8Array; let right: Uint8Array
  try { left = hexToBytes(a); right = hexToBytes(b) } catch { return false }
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let i = 0; i < left.length; i++) mismatch |= left[i] ^ right[i]
  return mismatch === 0
}

export function randomInt(min: number, max: number) {
  const range = max - min + 1
  const limit = Math.floor(0x100000000 / range) * range
  const buffer = new Uint32Array(1)
  do { crypto.getRandomValues(buffer) } while (buffer[0] >= limit)
  return min + (buffer[0] % range)
}
export const newMemberCode = () => String(randomInt(100000, 999999))
export const newVerificationCode = () => String(randomInt(0, 999999)).padStart(6, '0')

export function normEmail(email: string) { return email.trim().toLowerCase() }
export function normPhone(raw: string) {
  const phone = raw.replace(/[\s\-()]/g, '')
  if (/^(\+233|233|0)[2-9]\d{8}$/.test(phone)) return `+233${phone.replace(/^(\+233|233|0)/, '')}`
  if (/^\+[1-9]\d{7,14}$/.test(phone)) return phone
  return null
}

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const radius = 6371000
  const radians = (value: number) => value * Math.PI / 180
  const dLat = radians(lat2 - lat1); const dLng = radians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * radius * Math.asin(Math.sqrt(a))
}

export function assertLocation(value: unknown): { lat: number; lng: number; accuracy: number } {
  const row = value as Record<string, unknown>
  if (!row || typeof row.lat !== 'number' || typeof row.lng !== 'number' || typeof row.accuracy !== 'number'
    || !Number.isFinite(row.lat) || !Number.isFinite(row.lng) || !Number.isFinite(row.accuracy)
    || row.lat < -90 || row.lat > 90 || row.lng < -180 || row.lng > 180 || row.accuracy <= 0 || row.accuracy > 100) {
    throw new AppError('LOCATION_DENIED')
  }
  return { lat: row.lat, lng: row.lng, accuracy: row.accuracy }
}

export function b64url(value: Uint8Array | string) {
  const binary = typeof value === 'string' ? value : Array.from(value, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
export function b64urlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')), (char) => char.charCodeAt(0))
}
export function bytesToBase64Url(bytes: Uint8Array) { return b64url(bytes) }
export function bytesFromHex(hex: string) { return hexToBytes(hex) }

export function getRequestIp(request: Request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}
export function userAgentFamily(value: string) {
  const ua = value.toLowerCase()
  if (/android/.test(ua) && /chrome/.test(ua)) return 'Chrome Android'
  if (/iphone|ipad|ipod/.test(ua) && /safari/.test(ua)) return 'Safari iOS'
  if (/edg\//.test(ua)) return 'Edge'
  if (/firefox\//.test(ua)) return 'Firefox'
  if (/chrome\//.test(ua)) return 'Chrome'
  if (/safari\//.test(ua)) return 'Safari'
  return 'Other'
}
