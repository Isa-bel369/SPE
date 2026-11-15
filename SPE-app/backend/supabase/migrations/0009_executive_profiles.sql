alter table public.media_items
  add column if not exists position text,
  add column if not exists description text;
