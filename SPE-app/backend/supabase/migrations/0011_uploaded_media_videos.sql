alter table public.media_items
  drop constraint if exists media_items_type_check,
  drop constraint if exists media_source_check;

alter table public.media_items
  add constraint media_items_type_check check (type in ('youtube', 'recording', 'video', 'photo')),
  add constraint media_source_check check (
    (type = 'photo' and storage_path is not null and url is null)
    or (type = 'video' and storage_path is not null and url is null)
    or (type in ('youtube', 'recording') and url is not null and storage_path is null)
  );

update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
where id = 'site-media';

drop policy if exists site_media_content_write on storage.objects;
create policy site_media_content_write on storage.objects for insert to authenticated
  with check (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] in ('news', 'gallery', 'videos')
    and (public.has_role('communications_head') or public.has_role('technical_head'))
  );

drop policy if exists site_media_content_delete on storage.objects;
create policy site_media_content_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'site-media'
    and (storage.foldername(name))[1] in ('news', 'gallery', 'videos')
    and (public.has_role('communications_head') or public.has_role('technical_head'))
  );
