import { serveFunction } from '../_shared/http.ts'
import { tokenForEvent } from '../_shared/qr.ts'

serveFunction('qr_token', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (_context, body) => {
  return tokenForEvent((body as { event_id: string }).event_id)
})
