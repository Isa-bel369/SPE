import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/format'

export default function Messages() {
  const [items, setItems] = useState([]); const [error, setError] = useState('')
  async function load() { const { data, error: err } = await supabase.from('contact_messages').select('*').order('is_read', { ascending: true }).order('created_at', { ascending: false }); if (err) setError(err.message); else setItems(data || []) }
  useEffect(() => { load() }, [])
  async function toggle(item) { const { error: err } = await supabase.from('contact_messages').update({ is_read: !item.is_read }).eq('id', item.id); if (err) setError(err.message); else load() }
  return <section><h1>Messages</h1>{error && <p className="alert" role="alert">{error}</p>}{items.length ? items.map((item) => <article className={`card message-card ${item.is_read ? '' : 'unread'}`} key={item.id}><div className="section-heading"><h2>{item.name}</h2><button className="btn secondary" onClick={() => toggle(item)}>{item.is_read ? 'Mark unread' : 'Mark read'}</button></div><p>{item.email} · {formatDate(item.created_at)}</p><p>{item.message}</p></article>) : !error && <p>No messages yet.</p>}</section>
}
