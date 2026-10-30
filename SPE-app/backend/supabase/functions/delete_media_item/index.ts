import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

serveFunction('delete_media_item', { kind: 'admin', roles: ['communications_head', 'technical_head'] }, async (context, body) => {
  const mediaId = (body as { media_id: string }).media_id
  const { data: item, error: findError } = await db.from('media_items').select('id,title,storage_path').eq('id', mediaId).maybeSingle()
  if (findError) throw new AppError('SERVER_ERROR')
  if (!item) throw new AppError('NOT_FOUND')
  const { error } = await db.from('media_items').delete().eq('id', mediaId)
  if (error) throw new AppError('SERVER_ERROR')
  if (item.storage_path) {
    const { error: storageError } = await db.storage.from('site-media').remove([item.storage_path])
    if (storageError) throw new AppError('SERVER_ERROR')
  }
  await context.audit('media_deleted', { media_id: mediaId, title: item.title })
  return {}
})
