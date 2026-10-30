import { supabase } from './supabase'

export async function getSiteContent(keys) {
  const { data, error } = await supabase.from('site_content').select('key,body').in('key', keys)
  if (error) throw error
  return Object.fromEntries((data || []).map((row) => [row.key, row.body]))
}

export async function getPublicEvents() {
  const { data, error } = await supabase.from('events_public').select('*').order('starts_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getNews(limit = 9) {
  const { data, error } = await supabase.from('news_posts').select('id,title,slug,body,cover_image_url,published_at').eq('is_published', true).order('published_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data || []
}

export async function getMedia(query = {}) {
  let request = supabase.from('media_items').select('id,type,title,category,url,storage_path,event_id').eq('is_published', true)
  if (query.type) request = request.eq('type', query.type)
  if (query.category && query.category !== 'all') request = request.eq('category', query.category)
  if (query.eventId) request = request.eq('event_id', query.eventId)
  const { data, error } = await request.order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map((item) => ({
    ...item,
    imageUrl: item.storage_path ? supabase.storage.from('site-media').getPublicUrl(item.storage_path).data.publicUrl : item.url,
  }))
}

export async function getLeaderboard() {
  const { data, error } = await supabase.from('leaderboard').select('display_name,total_points,rank').order('rank', { ascending: true }).limit(20)
  if (error) throw error
  return data || []
}

export async function getEvent(slug) {
  const { data, error } = await supabase.from('events_public').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function getPost(slug) {
  const { data, error } = await supabase.from('news_posts').select('id,title,slug,body,cover_image_url,published_at').eq('is_published', true).eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}
