alter table public.members enable row level security;
alter table public.email_verifications enable row level security;
alter table public.user_roles enable row level security;
alter table public.site_content enable row level security;
alter table public.events enable row level security;
alter table public.event_checkin_tokens enable row level security;
alter table public.attendance enable row level security;
alter table public.merit_records enable row level security;
alter table public.news_posts enable row level security;
alter table public.media_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.audit_logs enable row level security;
alter table public.checkin_sessions enable row level security;
alter table public.rate_limits enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.site_content, public.news_posts, public.media_items to anon;
grant select, update on public.site_content to authenticated;
grant select, insert, update on public.events to authenticated;
grant select, insert, update on public.news_posts, public.media_items to authenticated;
grant select on public.members, public.attendance, public.merit_records to authenticated;
grant select, update (is_read) on public.contact_messages to authenticated;
grant select on public.audit_logs to authenticated;

create policy site_content_read on public.site_content for select to anon, authenticated using (true);
create policy site_content_write on public.site_content for update to authenticated
  using (public.has_role('communications_head') or public.has_role('technical_head'))
  with check (public.has_role('communications_head') or public.has_role('technical_head'));

create policy events_admin on public.events for all to authenticated
  using (public.has_any_role()) with check (public.has_any_role());

create policy news_public on public.news_posts for select to anon using (is_published);
create policy news_admin on public.news_posts for all to authenticated
  using (public.has_role('communications_head') or public.has_role('technical_head'))
  with check (public.has_role('communications_head') or public.has_role('technical_head'));

create policy media_public on public.media_items for select to anon using (is_published);
create policy media_admin on public.media_items for all to authenticated
  using (public.has_role('communications_head') or public.has_role('technical_head'))
  with check (public.has_role('communications_head') or public.has_role('technical_head'));

create policy members_read on public.members for select to authenticated
  using (public.has_role('organization_head') or public.has_role('technical_head'));
create policy attendance_read on public.attendance for select to authenticated
  using (public.has_role('organization_head') or public.has_role('technical_head'));
create policy merit_read on public.merit_records for select to authenticated
  using (public.has_role('organization_head') or public.has_role('technical_head'));
create policy messages_admin on public.contact_messages for select to authenticated
  using (public.has_role('communications_head') or public.has_role('technical_head'));
create policy messages_update_read on public.contact_messages for update to authenticated
  using (public.has_role('communications_head') or public.has_role('technical_head'))
  with check (public.has_role('communications_head') or public.has_role('technical_head'));

create policy audit_read on public.audit_logs for select to authenticated
  using (public.has_role('technical_head'));
