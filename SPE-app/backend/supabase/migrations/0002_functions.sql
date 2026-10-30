create function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = r);
$$;

create function public.has_any_role() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid());
$$;

create function public.custom_access_token_hook(event jsonb) returns jsonb
language plpgsql stable set search_path = public as $$
declare claims jsonb; roles text[];
begin
  select coalesce(array_agg(role::text order by role::text), '{}') into roles
  from public.user_roles where user_id = (event->>'user_id')::uuid;
  claims := jsonb_set(event->'claims', '{app_roles}', to_jsonb(roles), true);
  return jsonb_set(event, '{claims}', claims, true);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook(jsonb) from authenticated, anon, public;
grant select on public.user_roles to supabase_auth_admin;
create policy auth_admin_reads_roles on public.user_roles as permissive for select to supabase_auth_admin using (true);

create function public.rl_hit(p_key text, p_limit integer, p_window_seconds integer)
returns table (allowed boolean, retry_after integer)
language plpgsql security definer set search_path = public as $$
declare v_count integer; v_start timestamptz;
begin
  insert into public.rate_limits as r (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end,
    count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end
  returning count, window_start into v_count, v_start;
  return query select v_count <= p_limit,
    greatest(1, ceil(extract(epoch from (v_start + make_interval(secs => p_window_seconds) - now())))::integer);
end;
$$;
revoke all on function public.rl_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.rl_hit(text, integer, integer) to service_role;

create function public.events_create_token() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
begin
  insert into public.event_checkin_tokens (event_id, secret)
  values (new.id, encode(extensions.gen_random_bytes(32), 'hex'));
  return new;
end;
$$;
create trigger trg_events_token after insert on public.events for each row execute function public.events_create_token();

create function public.events_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare restricted boolean;
begin
  restricted := public.has_role('communications_head')
    and not (public.has_role('organization_head') or public.has_role('technical_head'));
  if restricted then
    if tg_op = 'INSERT' then
      new.points := 3; new.radius_m := 100; new.venue_lat := null; new.venue_lng := null;
      new.checkin_opens_at := null; new.checkin_closes_at := null;
    elsif new.points is distinct from old.points
      or new.radius_m is distinct from old.radius_m
      or new.venue_lat is distinct from old.venue_lat
      or new.venue_lng is distinct from old.venue_lng
      or new.checkin_opens_at is distinct from old.checkin_opens_at
      or new.checkin_closes_at is distinct from old.checkin_closes_at then
      raise exception 'FORBIDDEN';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_events_guard before insert or update on public.events for each row execute function public.events_guard();

create function public.bump_email_verification_attempt(p_email text) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.email_verifications set attempts = attempts + 1
  where email = p_email and expires_at > now() returning attempts into n;
  return coalesce(n, -1);
end;
$$;

create function public.upsert_email_verification(p_email text, p_data jsonb, p_code_hash text)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare expiry timestamptz;
begin
  insert into public.email_verifications (email, registration_data, code_hash, expires_at, attempts, resend_count, last_sent_at)
  values (p_email, p_data, p_code_hash, now() + interval '10 minutes', 0, 0, now())
  on conflict (email) do update set registration_data = excluded.registration_data,
    code_hash = excluded.code_hash, expires_at = now() + interval '10 minutes',
    attempts = 0, resend_count = 0, last_sent_at = now()
  returning expires_at into expiry;
  return expiry;
end;
$$;

create function public.resend_email_verification(p_email text, p_code_hash text)
returns table (registration_data jsonb, expires_in_seconds integer, resend_available_in_seconds integer)
language plpgsql security definer set search_path = public as $$
declare pending public.email_verifications%rowtype; wait_seconds integer;
begin
  select * into pending from public.email_verifications where email = p_email for update;
  if not found or pending.expires_at <= now() then raise exception 'CODE_EXPIRED'; end if;
  wait_seconds := greatest(0, ceil(extract(epoch from (pending.last_sent_at + interval '60 seconds' - now())))::integer);
  if pending.resend_count >= 3 or wait_seconds > 0 then raise exception 'RATE_LIMITED:%', greatest(wait_seconds, 1); end if;
  update public.email_verifications set code_hash = p_code_hash, expires_at = now() + interval '10 minutes',
    attempts = 0, resend_count = pending.resend_count + 1, last_sent_at = now()
  where id = pending.id;
  return query select pending.registration_data, 600, 60;
end;
$$;

create function public.open_checkin_session(p_event uuid, p_device_hash text)
returns table (session_id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query insert into public.checkin_sessions (event_id, device_hash, expires_at)
  values (p_event, p_device_hash, now() + interval '3 minutes') returning id, checkin_sessions.expires_at;
end;
$$;

create function public.event_checkin_window_open(p_event uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.events e where e.id = p_event and e.is_published
      and now() >= coalesce(e.checkin_opens_at, e.starts_at)
      and now() <= coalesce(e.checkin_closes_at, e.ends_at) + interval '15 minutes'
  );
$$;

create function public.expire_event_checkin_sessions(p_event uuid) returns void
language sql security definer set search_path = public as $$
  update public.checkin_sessions set expires_at = now()
  where event_id = p_event and used_at is null;
$$;

create function public.consume_email_verification(p_email text, p_code_hash text, p_member_code text)
returns table (member_id uuid, first_name text)
language plpgsql security definer set search_path = public as $$
declare pending public.email_verifications%rowtype; member_uuid uuid;
begin
  select * into pending from public.email_verifications where email = p_email for update;
  if not found or pending.expires_at <= now() then raise exception 'CODE_EXPIRED'; end if;
  if pending.code_hash <> p_code_hash then raise exception 'CODE_INVALID'; end if;
  insert into public.members (first_name, last_name, email, phone, programme, year_of_study, member_code, show_on_leaderboard, email_verified_at)
  values (
    pending.registration_data->>'first_name', pending.registration_data->>'last_name', pending.email,
    pending.registration_data->>'phone', pending.registration_data->>'programme', pending.registration_data->>'year_of_study',
    p_member_code, coalesce((pending.registration_data->>'show_on_leaderboard')::boolean, false), now()
  ) returning id, members.first_name into member_uuid, first_name;
  delete from public.email_verifications where id = pending.id;
  return query select member_uuid, first_name;
end;
$$;

create function public.claim_checkin_attempt(p_session uuid, p_device_hash text)
returns table (event_id uuid, attempts integer, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  return query update public.checkin_sessions as s set attempts = s.attempts + 1
  where s.id = p_session and s.device_hash = p_device_hash and s.used_at is null and s.expires_at > now()
  returning s.event_id, s.attempts, s.expires_at;
end;
$$;

create function public.perform_check_in(
  p_session uuid, p_event uuid, p_member uuid, p_device_hash text, p_distance integer, p_ip_hash text, p_ua text
) returns table (points_awarded integer, total_points integer)
language plpgsql security definer set search_path = public as $$
declare v_points integer; v_attendance uuid;
begin
  update public.checkin_sessions set used_at = now()
  where id = p_session and event_id = p_event and used_at is null and expires_at > now() and device_hash = p_device_hash;
  if not found then raise exception 'SESSION_INVALID'; end if;
  select points into v_points from public.events where id = p_event;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into public.attendance (event_id, member_id, method, device_hash, distance_m, ip_hash, ua_family)
  values (p_event, p_member, 'qr', p_device_hash, p_distance, p_ip_hash, p_ua) returning id into v_attendance;
  insert into public.merit_records (member_id, event_id, attendance_id, points, source)
  values (p_member, p_event, v_attendance, v_points, 'event_checkin');
  return query select v_points, (select coalesce(sum(points), 0)::integer from public.merit_records where member_id = p_member);
end;
$$;

create function public.perform_manual_check_in(p_event uuid, p_member uuid, p_admin uuid)
returns table (points_awarded integer, total_points integer)
language plpgsql security definer set search_path = public as $$
declare v_points integer; v_attendance uuid;
begin
  select points into v_points from public.events where id = p_event;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into public.attendance (event_id, member_id, method) values (p_event, p_member, 'manual') returning id into v_attendance;
  insert into public.merit_records (member_id, event_id, attendance_id, points, source, awarded_by)
  values (p_member, p_event, v_attendance, v_points, 'event_checkin', p_admin);
  return query select v_points, (select coalesce(sum(points), 0)::integer from public.merit_records where member_id = p_member);
end;
$$;

create function public.perform_remove_check_in(p_attendance uuid, p_reason text, p_admin uuid)
returns table (member_id uuid, total_points integer)
language plpgsql security definer set search_path = public as $$
declare a public.attendance%rowtype; awarded integer;
begin
  select * into a from public.attendance where id = p_attendance for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select coalesce(sum(points), 0)::integer into awarded from public.merit_records where attendance_id = a.id;
  insert into public.merit_records (member_id, event_id, attendance_id, points, source, reason, awarded_by)
  values (a.member_id, a.event_id, a.id, -awarded, 'check_in_reversal', p_reason, p_admin);
  delete from public.attendance where id = a.id;
  return query select a.member_id, (select coalesce(sum(points), 0)::integer from public.merit_records where merit_records.member_id = a.member_id);
end;
$$;

create function public.perform_delete_member(p_member uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.merit_records where member_id = p_member;
  delete from public.attendance where member_id = p_member;
  delete from public.members where id = p_member;
  if not found then raise exception 'NOT_FOUND'; end if;
end;
$$;

create function public.member_total(p_member uuid) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce(sum(points), 0)::integer from public.merit_records where member_id = p_member;
$$;

create function public.set_admin_user_role(p_user_id uuid, p_role public.app_role, p_action text, p_caller uuid)
returns public.app_role[]
language plpgsql security definer set search_path = public as $$
declare remaining integer; result_roles public.app_role[];
begin
  if p_action not in ('add', 'remove') then raise exception 'VALIDATION_ERROR'; end if;
  if p_action = 'remove' then
    if p_role = 'technical_head' and p_caller = p_user_id then raise exception 'LAST_TECHNICAL_HEAD'; end if;
    if p_role = 'technical_head' then
      select count(*) into remaining from public.user_roles where role = 'technical_head';
      if remaining <= 1 then raise exception 'LAST_TECHNICAL_HEAD'; end if;
    end if;
    delete from public.user_roles where user_id = p_user_id and role = p_role;
  else
    insert into public.user_roles (user_id, role) values (p_user_id, p_role) on conflict do nothing;
  end if;
  select coalesce(array_agg(role order by role::text), '{}') into result_roles
  from public.user_roles where user_id = p_user_id;
  return result_roles;
end;
$$;

revoke all on function public.bump_email_verification_attempt(text) from public, anon, authenticated;
revoke all on function public.upsert_email_verification(text, jsonb, text) from public, anon, authenticated;
revoke all on function public.resend_email_verification(text, text) from public, anon, authenticated;
revoke all on function public.open_checkin_session(uuid, text) from public, anon, authenticated;
revoke all on function public.event_checkin_window_open(uuid) from public, anon, authenticated;
revoke all on function public.expire_event_checkin_sessions(uuid) from public, anon, authenticated;
revoke all on function public.consume_email_verification(text, text, text) from public, anon, authenticated;
revoke all on function public.claim_checkin_attempt(uuid, text) from public, anon, authenticated;
revoke all on function public.perform_check_in(uuid, uuid, uuid, text, integer, text, text) from public, anon, authenticated;
revoke all on function public.perform_manual_check_in(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.perform_remove_check_in(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.perform_delete_member(uuid) from public, anon, authenticated;
revoke all on function public.member_total(uuid) from public, anon, authenticated;
revoke all on function public.set_admin_user_role(uuid, public.app_role, text, uuid) from public, anon, authenticated;
grant execute on function public.bump_email_verification_attempt(text) to service_role;
grant execute on function public.upsert_email_verification(text, jsonb, text) to service_role;
grant execute on function public.resend_email_verification(text, text) to service_role;
grant execute on function public.open_checkin_session(uuid, text) to service_role;
grant execute on function public.event_checkin_window_open(uuid) to service_role;
grant execute on function public.expire_event_checkin_sessions(uuid) to service_role;
grant execute on function public.consume_email_verification(text, text, text) to service_role;
grant execute on function public.claim_checkin_attempt(uuid, text) to service_role;
grant execute on function public.perform_check_in(uuid, uuid, uuid, text, integer, text, text) to service_role;
grant execute on function public.perform_manual_check_in(uuid, uuid, uuid) to service_role;
grant execute on function public.perform_remove_check_in(uuid, text, uuid) to service_role;
grant execute on function public.perform_delete_member(uuid) to service_role;
grant execute on function public.member_total(uuid) to service_role;
grant execute on function public.set_admin_user_role(uuid, public.app_role, text, uuid) to service_role;
