import { serveFunction } from '../_shared/http.ts'
import { AppError, mapDatabaseError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

function publicStoragePath(url: string | null) {
  if (!url) return null
  try {
    const marker = '/storage/v1/object/public/site-media/'
    const index = new URL(url).pathname.indexOf(marker)
    return index < 0 ? null : decodeURIComponent(new URL(url).pathname.slice(index + marker.length))
  } catch { return null }
}

serveFunction('delete_event', { kind: 'admin', roles: ['organization_head', 'technical_head'] }, async (context, body) => {
  const eventId = (body as { event_id: string }).event_id
  const { data: event, error: findError } = await db.from('events').select('id,title,cover_image_url').eq('id', eventId).maybeSingle()
  if (findError) throw new AppError('SERVER_ERROR')
  if (!event) throw new AppError('NOT_FOUND')
  const { count, error: attendanceError } = await db.from('attendance').select('id', { count: 'exact', head: true }).eq('event_id', eventId)
  if (attendanceError) throw new AppError('SERVER_ERROR')
  if ((count || 0) > 0) throw new AppError('EVENT_HAS_CHECKINS')
  const { error } = await db.from('events').delete().eq('id', eventId)
  if (error) {
    if (error.code === '23503') throw new AppError('EVENT_HAS_CHECKINS')
    throw mapDatabaseError(error, 'NOT_FOUND')
  }
  const path = publicStoragePath(event.cover_image_url)
  if (path) {
    const { error: storageError } = await db.storage.from('site-media').remove([path])
    if (storageError) throw new AppError('SERVER_ERROR')
  }
  await context.audit('event_deleted', { event_id: eventId, title: event.title })
  return {}
})
