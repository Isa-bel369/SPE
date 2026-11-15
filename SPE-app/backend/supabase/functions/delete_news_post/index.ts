import { serveFunction } from '../_shared/http.ts'
import { AppError } from '../_shared/errors.ts'
import { db } from '../_shared/db.ts'

function publicStoragePath(url: string | null) {
  if (!url) return null
  try {
    const pathname = new URL(url).pathname
    const marker = '/storage/v1/object/public/site-media/'
    const index = pathname.indexOf(marker)
    return index < 0 ? null : decodeURIComponent(pathname.slice(index + marker.length))
  } catch { return null }
}

serveFunction('delete_news_post', { kind: 'admin', roles: ['communications_head', 'technical_head'] }, async (context, body) => {
  const postId = (body as { post_id: string }).post_id
  const { data: post, error: findError } = await db.from('news_posts').select('id,title,cover_image_url').eq('id', postId).maybeSingle()
  if (findError) throw new AppError('SERVER_ERROR')
  if (!post) throw new AppError('NOT_FOUND')
  const { error } = await db.from('news_posts').delete().eq('id', postId)
  if (error) throw new AppError('SERVER_ERROR')
  const path = publicStoragePath(post.cover_image_url)
  if (path) {
    const { error: storageError } = await db.storage.from('site-media').remove([path])
    if (storageError) throw new AppError('SERVER_ERROR')
  }
  await context.audit('news_deleted', { post_id: postId, title: post.title })
  return {}
})
