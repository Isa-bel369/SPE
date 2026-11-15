import { z } from 'npm:zod'
import { db } from './db.ts'
import { AppError, validationError } from './errors.ts'
import { enforceLimit } from './rateLimit.ts'
import { getRequestIp } from './security.ts'
import { schemas, type FunctionName } from './validate.ts'

type AdminIdentity = { id: string; email: string | null; roles: string[] }
export type FunctionContext = {
  request: Request
  requestId: string
  ip: string
  userAgent: string
  user?: AdminIdentity
  audit: (action: string, details?: Record<string, unknown>) => Promise<void>
}
type Handler = (context: FunctionContext, body: Record<string, unknown>) => Promise<unknown>
type Mode = { kind: 'public' } | { kind: 'webhook' } | { kind: 'admin'; roles: string[] }

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean)

function corsFor(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigins.includes(origin)) throw new AppError('FORBIDDEN')
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-webhook-secret',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
  if (origin) headers['Access-Control-Allow-Origin'] = origin
  return headers
}

function response(body: unknown, status: number, cors: Record<string, string>, requestId: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json', 'X-Request-Id': requestId },
  })
}

async function authorize(request: Request, allowedRoles: string[]) {
  const header = request.headers.get('authorization') || ''
  const token = header.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) throw new AppError('UNAUTHORIZED')
  const { data: auth, error: authError } = await db.auth.getUser(token)
  if (authError || !auth.user) throw new AppError('UNAUTHORIZED')
  const { data, error } = await db.from('user_roles').select('role').eq('user_id', auth.user.id)
  if (error) throw new AppError('SERVER_ERROR')
  const roles = (data || []).map((row) => row.role as string)
  if (!roles.length) throw new AppError('FORBIDDEN')
  if (!roles.some((role) => allowedRoles.includes(role))) throw new AppError('FORBIDDEN')
  return { id: auth.user.id, email: auth.user.email || null, roles }
}

function safeDetails(action: string, details: Record<string, unknown> = {}) {
  const forbidden = /email|phone|verification.?code|token|coordinate|location|password|secret|device/i
  for (const key of Object.keys(details)) {
    if (forbidden.test(key) && !(action === 'admin_invited' && key === 'email')) throw new Error('Sensitive audit field refused')
  }
  return details
}

function bodySchema(name: FunctionName) { return schemas[name] }

export function serveFunction(name: FunctionName, mode: Mode, handler: Handler) {
  Deno.serve(async (request) => {
    const requestId = crypto.randomUUID()
    const startedAt = Date.now()
    let cors: Record<string, string> = {}
    try {
      cors = corsFor(request)
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
      if (request.method !== 'POST') throw new AppError('VALIDATION_ERROR')
      const context: FunctionContext = {
        request,
        requestId,
        ip: getRequestIp(request),
        userAgent: request.headers.get('user-agent') || '',
        audit: async (action, details = {}) => {
          if (!context.user) throw new AppError('UNAUTHORIZED')
          const { error } = await db.from('audit_logs').insert({
            user_id: context.user.id, action, details: safeDetails(action, details), ip_address: context.ip === 'unknown' ? null : context.ip,
          })
          if (error) throw new AppError('SERVER_ERROR')
        },
      }

      if (mode.kind === 'webhook') {
        const expected = Deno.env.get('WEBHOOK_SECRET')
        if (!expected || request.headers.get('x-webhook-secret') !== expected) throw new AppError('UNAUTHORIZED')
      }
      if (mode.kind === 'admin') {
        context.user = await authorize(request, mode.roles)
        await enforceLimit(`admin-user:${context.user.id}`, 120, 60)
      }

      let input: unknown
      try { input = await request.json() } catch { throw new AppError('VALIDATION_ERROR') }
      const parsed = bodySchema(name).safeParse(input)
      if (!parsed.success) throw validationError(parsed.error.issues)
      const data = await handler(context, parsed.data as Record<string, unknown>)
      return response({ ok: true, data: data ?? {} }, 200, cors, requestId)
    } catch (error) {
      if (error instanceof z.ZodError) error = validationError(error.issues)
      const appError = error instanceof AppError ? error : new AppError('SERVER_ERROR')
      console.error(JSON.stringify({ function: name, request_id: requestId, error_code: appError.code, duration_ms: Date.now() - startedAt }))
      try { cors = corsFor(request) } catch { cors = {} }
      const payload: Record<string, unknown> = { ok: false, error: { code: appError.code, message: appError.message } }
      if (appError.details?.length) (payload.error as Record<string, unknown>).details = appError.details
      if (appError.retryAfter) (payload.error as Record<string, unknown>).retry_after_seconds = appError.retryAfter
      return response(payload, appError.status, cors, requestId)
    }
  })
}
