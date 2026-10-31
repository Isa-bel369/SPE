import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminCall, friendlyError } from '../../lib/api'
import Markdown from '../../components/Markdown'
import { resizeImage } from '../../lib/image'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../state/contexts'

const siteKeys = ['home_hero_title', 'home_hero_intro', 'home_hero_image', 'home_hero_alt', 'home_hero_caption', 'home_intro', 'about_heading', 'about_hero_image', 'about_hero_alt', 'about_chapter', 'about_mission', 'about_vision', 'about_benefits', 'contact_info']
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

function NewsManager() {
  const { session } = useAuth()
  const [posts, setPosts] = useState([]); const [editing, setEditing] = useState(null)
  const [draftBody, setDraftBody] = useState('')
  const [cover, setCover] = useState(null)
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  async function load() { const { data, error: err } = await supabase.from('news_posts').select('*').order('created_at', { ascending: false }); if (err) setError(friendlyError(err, 'Could not load news posts. Refresh the page and try again.')); else setPosts(data || []) }
  useEffect(() => { load() }, [])
  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    const fields = new FormData(event.currentTarget); const title = String(fields.get('title')).trim(); const published = fields.get('is_published') === 'on'
    const row = { title, slug: fields.get('slug'), body: draftBody, is_published: published, published_at: published ? editing?.published_at || new Date().toISOString() : null, created_by: session.user.id }
    try {
      let newPath = null
      if (cover) {
        const blob = await resizeImage(cover, 1200)
        newPath = `news/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage.from('site-media').upload(newPath, blob, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        row.cover_image_url = supabase.storage.from('site-media').getPublicUrl(newPath).data.publicUrl
      }
      let result
      if (editing?.id) result = await supabase.from('news_posts').update(row).eq('id', editing.id)
      else result = await supabase.from('news_posts').insert(row)
      if (result.error) throw result.error
      if (cover && editing?.cover_image_url) { try { const old = new URL(editing.cover_image_url).pathname.split('/site-media/')[1]; if (old) await supabase.storage.from('site-media').remove([decodeURIComponent(old)]) } catch {} }
      setEditing(null); setCover(null); await load()
    } catch (err) { setError(friendlyError(err, 'Could not save the news post. Check the details and try again.')) } finally { setBusy(false) }
  }
  async function remove(post) { if (!window.confirm(`Delete “${post.title}”?`)) return; try { await adminCall('delete_news_post', { post_id: post.id }); await load() } catch (err) { setError(friendlyError(err, 'Could not delete the news post. Try again.')) } }
  async function publish(post) { const is_published = !post.is_published; const { error: err } = await supabase.from('news_posts').update({ is_published, published_at: is_published ? post.published_at || new Date().toISOString() : null }).eq('id', post.id); if (err) setError(friendlyError(err, 'Could not update the news post. Try again.')); else load() }
  return <div><div className="section-heading"><h2>News</h2><button className="btn" onClick={() => { setEditing({ title: '', slug: '', body: '', is_published: false }); setDraftBody(''); setCover(null) }}>New post</button></div>{error && <p role="alert" className="alert">{error}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>Title</th><th>Status</th><th>Actions</th></tr></thead><tbody>{posts.map((post) => <tr key={post.id}><td>{post.title}</td><td>{post.is_published ? 'Published' : 'Draft'}</td><td><button className="btn secondary" onClick={() => { setEditing(post); setDraftBody(post.body); setCover(null) }}>Edit</button><button className="btn secondary" onClick={() => publish(post)}>{post.is_published ? 'Unpublish' : 'Publish'}</button><button className="btn danger" onClick={() => remove(post)}>Delete</button></td></tr>)}</tbody></table></div>{editing && <form className="form card" onSubmit={save}><h3>{editing.id ? 'Edit post' : 'Create post'}</h3><label>Title<input name="title" required maxLength="150" defaultValue={editing.title} onBlur={(event) => { const slug = event.currentTarget.form.elements.slug; if (!slug.value) slug.value = slugify(event.currentTarget.value) }} /></label><label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" minLength="3" maxLength="80" defaultValue={editing.slug} /></label><label>Body (Markdown)<textarea name="body" required rows="9" value={draftBody} onChange={(event) => setDraftBody(event.target.value)} /></label><label>Cover image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setCover(event.target.files?.[0] || null)} /></label>{editing.cover_image_url && <img src={editing.cover_image_url} alt="Current post cover" width="320" height="180" />}<label className="checkbox"><input type="checkbox" name="is_published" defaultChecked={editing.is_published} />Published</label><details><summary>Preview</summary><Markdown>{draftBody}</Markdown></details><button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save post'}</button><button type="button" className="btn secondary" onClick={() => setEditing(null)}>Cancel</button></form>}</div>
}

function MediaManager() {
  const [items, setItems] = useState([]); const [events, setEvents] = useState([])
  const [error, setError] = useState(''); const [progress, setProgress] = useState('')
  async function load() {
    const [media, eventResult] = await Promise.all([supabase.from('media_items').select('*').order('created_at', { ascending: false }), supabase.from('events').select('id,title').order('starts_at')])
    if (media.error || eventResult.error) setError('Could not load media content.')
    else { setItems(media.data || []); setEvents(eventResult.data || []) }
  }
  useEffect(() => { load() }, [])
  async function upload(event) {
    event.preventDefault(); setError('')
    const form = event.currentTarget; const data = new FormData(form); const files = [...form.elements.files.files]
    if (!files.length) return
    let failures = 0
    for (let index = 0; index < files.length; index++) {
      const file = files[index]; setProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`)
      try {
        const blob = await resizeImage(file)
        const path = `gallery/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage.from('site-media').upload(path, blob, { contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const { error: insertError } = await supabase.from('media_items').insert({ type: 'photo', title: String(data.get('title') || '').trim() || file.name.replace(/\.[^.]+$/, ''), category: data.get('category'), storage_path: path, url: null, event_id: data.get('event_id') || null, is_published: true })
        if (insertError) { await supabase.storage.from('site-media').remove([path]); throw insertError }
      } catch (err) { failures++; setError((old) => `${old}${old ? ' ' : ''}${file.name}: ${friendlyError(err, 'Upload failed. Check the file and try again.')}`) }
    }
    setProgress(''); if (!failures) form.reset(); await load()
  }
  async function addLink(event) {
    event.preventDefault(); setError('')
    const form = event.currentTarget; const data = new FormData(form); const url = String(data.get('url')).trim()
    if (data.get('type') === 'youtube') {
      try { const parsed = new URL(url); if (!['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtu.be'].includes(parsed.hostname)) throw new Error() }
      catch { setError('Enter a valid YouTube URL.'); return }
    }
    const { error: err } = await supabase.from('media_items').insert({ type: data.get('type'), title: data.get('title'), url, storage_path: null, category: 'general', is_published: true })
    if (err) setError(friendlyError(err, 'Could not add the video or recording. Check the title and URL and try again.')); else { form.reset(); await load() }
  }
  async function remove(item) { if (!window.confirm(`Delete “${item.title}”?`)) return; try { await adminCall('delete_media_item', { media_id: item.id }); await load() } catch (err) { setError(friendlyError(err, 'Could not delete this media item. Try again.')) } }
  async function toggle(item) { const { error: err } = await supabase.from('media_items').update({ is_published: !item.is_published }).eq('id', item.id); if (err) setError(friendlyError(err, 'Could not update this media item. Try again.')); else load() }
  return <div><h2>Pictures</h2><form className="form card" onSubmit={upload}><label>Images<input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp" required /></label><label>Default title<input name="title" placeholder="Defaults to each filename" /></label><label>Category<select name="category"><option value="general">General</option><option value="event">Event</option><option value="activity">Activity</option><option value="member">Member</option><option value="executive">Executive</option></select></label><label>Linked event<select name="event_id"><option value="">None</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}</select></label><button className="btn">Upload selected</button>{progress && <p role="status">{progress}</p>}</form><h2>Videos and recordings</h2><form className="form card" onSubmit={addLink}><label>Title<input name="title" required /></label><label>Type<select name="type"><option value="youtube">YouTube</option><option value="recording">Recording</option></select></label><label>URL<input name="url" type="url" required /></label><button className="btn">Add link</button></form>{error && <p className="alert" role="alert">{error}</p>}<h2>Published content</h2><div className="table-scroll"><table className="table"><thead><tr><th>Title</th><th>Type</th><th>Storage path / URL</th><th>Status</th><th>Actions</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.type}</td><td>{item.storage_path || item.url || '—'}</td><td>{item.is_published ? 'Published' : 'Hidden'}</td><td><button className="btn secondary" onClick={() => toggle(item)}>{item.is_published ? 'Unpublish' : 'Publish'}</button><button className="btn danger" onClick={() => remove(item)}>Delete</button></td></tr>)}</tbody></table></div></div>
}

function SiteTextManager() {
  const [content, setContent] = useState({}); const [error, setError] = useState(''); const [notice, setNotice] = useState('')
  async function load() { const { data, error: err } = await supabase.from('site_content').select('key,body').in('key', siteKeys); if (err) setError(friendlyError(err, 'Could not load site content. Refresh the page and try again.')); else setContent(Object.fromEntries((data || []).map((row) => [row.key, row.body]))) }
  useEffect(() => { load() }, [])
  async function save() { setError(''); setNotice(''); const results = await Promise.all(siteKeys.map((key) => supabase.from('site_content').update({ body: content[key] || '' }).eq('key', key))); const failed = results.find((result) => result.error); if (failed) setError(friendlyError(failed.error, 'Could not save site content. Try again.')); else setNotice('Site text saved.') }
  const labels = { home_hero_title: 'Homepage hero title', home_hero_intro: 'Homepage hero intro', home_hero_image: 'Homepage hero image', home_hero_alt: 'Homepage hero image description', home_hero_caption: 'Homepage hero image caption', home_intro: 'Homepage chapter intro', about_heading: 'About page heading', about_hero_image: 'About page hero image', about_hero_alt: 'About page hero image description', about_chapter: 'About chapter intro', about_mission: 'About mission', about_vision: 'About vision', about_benefits: 'About benefits', contact_info: 'Contact information' }
  return <div><h2>Site text and page images</h2>{siteKeys.map((key) => <div className="form" key={key}><label>{labels[key]}{key.endsWith('_image') ? ' (Storage path or public URL)' : ' (Markdown)'}{key.endsWith('_image') ? <input value={content[key] || ''} onChange={(event) => setContent((state) => ({ ...state, [key]: event.target.value }))} /> : <textarea rows="5" value={content[key] || ''} onChange={(event) => setContent((state) => ({ ...state, [key]: event.target.value }))} />}</label>{key.endsWith('_image') && content[key] && <p className="muted">Upload images in Pictures and links, then enter the file's storage path here.</p>}{!key.endsWith('_image') && <details><summary>Preview</summary><Markdown>{content[key]}</Markdown></details>}</div>)}<button className="btn" onClick={save}>Save site content</button><Link to="/events">Calendar is managed on the Events screen</Link>{error && <p className="alert">{error}</p>}{notice && <p role="status">{notice}</p>}</div>
}

export default function ContentAdmin({ initialTab = 'media' }) {
  const [tab, setTab] = useState(initialTab)
  return <section><h1>{initialTab === 'news' ? 'News' : 'Media and content'}</h1>{initialTab !== 'news' && <div className="tabs"><button className={tab === 'media' ? 'active' : ''} onClick={() => setTab('media')}>Pictures and links</button><button className={tab === 'site' ? 'active' : ''} onClick={() => setTab('site')}>Site text</button><button className={tab === 'calendar' ? 'active' : ''} onClick={() => setTab('calendar')}>Calendar</button></div>}{(initialTab === 'news' || tab === 'news') ? <NewsManager /> : tab === 'media' ? <MediaManager /> : tab === 'site' ? <SiteTextManager /> : <p>The public calendar uses published events. <Link to="/admin/events">Manage events</Link>.</p>}</section>
}
