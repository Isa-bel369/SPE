insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy site_media_public_read on storage.objects for select
  using (bucket_id = 'site-media');

create policy site_media_event_write on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'events' and public.has_any_role());
create policy site_media_event_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (storage.foldername(name))[1] = 'events' and public.has_any_role());

create policy site_media_content_write on storage.objects for insert to authenticated
  with check (bucket_id = 'site-media' and (storage.foldername(name))[1] in ('news', 'gallery')
    and (public.has_role('communications_head') or public.has_role('technical_head')));
create policy site_media_content_delete on storage.objects for delete to authenticated
  using (bucket_id = 'site-media' and (storage.foldername(name))[1] in ('news', 'gallery')
    and (public.has_role('communications_head') or public.has_role('technical_head')));
