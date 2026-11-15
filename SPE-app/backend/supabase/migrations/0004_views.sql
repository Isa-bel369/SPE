create view public.events_public as
select id, title, slug, description, starts_at, ends_at, location, cover_image_url, points
from public.events where is_published;

create view public.leaderboard as
select display_name, total_points, rank() over (order by total_points desc)::integer as rank
from (
  select m.first_name || ' ' || upper(left(m.last_name, 1)) || '.' as display_name,
    coalesce(sum(r.points), 0)::integer as total_points
  from public.members m
  left join public.merit_records r on r.member_id = m.id
  where m.show_on_leaderboard
  group by m.id
  having coalesce(sum(r.points), 0) > 0
) ranked_members;

create view public.admin_registrations with (security_invoker = true) as
select m.id, m.first_name, m.last_name, m.email, m.phone, m.programme, m.year_of_study,
  m.member_code, m.show_on_leaderboard, m.created_at,
  coalesce(sum(r.points), 0)::integer as total_points
from public.members m left join public.merit_records r on r.member_id = m.id
group by m.id;

create view public.admin_attendance with (security_invoker = true) as
select a.id as attendance_id, a.event_id, a.member_id, m.member_code, m.first_name, m.last_name,
  a.checked_in_at, a.method, a.distance_m, a.ip_hash, a.ua_family
from public.attendance a join public.members m on m.id = a.member_id;

create view public.admin_merit with (security_invoker = true) as
select r.id, r.member_id, m.member_code, m.first_name, m.last_name, r.event_id,
  e.title as event_title, r.points, r.source, r.reason, r.awarded_by, r.created_at
from public.merit_records r join public.members m on m.id = r.member_id
left join public.events e on e.id = r.event_id;

grant select on public.events_public, public.leaderboard to anon, authenticated;
grant select on public.admin_registrations, public.admin_attendance, public.admin_merit to authenticated;
