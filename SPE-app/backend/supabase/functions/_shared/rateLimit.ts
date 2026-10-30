import { AppError } from './errors.ts'
import { db } from './db.ts'
import { hashValue } from './security.ts'

export const RATE_LIMITS = {
  registerIp: [5, 3600], registerEmail: [3, 3600], verifyIp: [20, 3600], verifyEmail: [10, 3600],
  resendIp: [10, 3600], resendEmail: [3, 3600], meritIp: [30, 600], meritMember: [10, 600],
  meritFailed: [10, 600], startDevice: [10, 600], startIp: [300, 600], checkDevice: [10, 600],
  checkMember: [10, 600], checkIp: [300, 600], contactIp: [3, 3600], contactEmail: [5, 86400], adminUser: [120, 60],
} as const

export async function enforceLimit(key: string, limit: number, windowSeconds: number) {
  const hashedKey = await hashValue(key)
  const { data, error } = await db.rpc('rl_hit', { p_key: hashedKey, p_limit: limit, p_window_seconds: windowSeconds })
  if (error) throw new AppError('SERVER_ERROR')
  const result = Array.isArray(data) ? data[0] : data
  if (!result?.allowed) throw new AppError('RATE_LIMITED', { retryAfter: Number(result?.retry_after || 1) })
}

export async function enforceNamedLimit(key: string, values: readonly [number, number]) {
  await enforceLimit(key, values[0], values[1])
}
