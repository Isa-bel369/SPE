import { serveFunction } from '../_shared/http.ts'

serveFunction('log_export', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const input = body as { format: 'csv' | 'xlsx'; row_count: number }
  await context.audit('registrations_exported', { format: input.format, row_count: input.row_count })
  return {}
})
