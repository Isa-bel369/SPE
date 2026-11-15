-- Admin clients may read only the on/off state; the signing secret stays server-only.
grant select (event_id, is_active) on public.event_checkin_tokens to authenticated;

create policy checkin_token_state_read on public.event_checkin_tokens for select to authenticated
  using (public.has_role('organization_head') or public.has_role('technical_head'));
