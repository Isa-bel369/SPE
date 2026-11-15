create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron;

create type public.app_role as enum ('communications_head', 'organization_head', 'technical_head');

create table public.members (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  programme text not null,
  year_of_study text not null,
  member_code char(6) not null,
  show_on_leaderboard boolean not null default false,
  email_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint members_email_key unique (email),
  constraint members_phone_key unique (phone),
  constraint members_member_code_key unique (member_code),
  constraint members_code_format check (member_code ~ '^[1-9][0-9]{5}$'),
  constraint members_year_check check (year_of_study in ('Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate'))
);

create table public.email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  registration_data jsonb not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  resend_count integer not null default 0 check (resend_count between 0 and 3),
  last_sent_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.site_content (
  key text primary key,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null,
  cover_image_url text,
  points integer not null default 3,
  checkin_opens_at timestamptz,
  checkin_closes_at timestamptz,
  venue_lat numeric(9,6),
  venue_lng numeric(9,6),
  radius_m integer not null default 100,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_radius_check check (radius_m between 20 and 1000),
  constraint events_points_check check (points >= 0),
  constraint events_time_check check (ends_at > starts_at),
  constraint events_lat_check check (venue_lat is null or venue_lat between -90 and 90),
  constraint events_lng_check check (venue_lng is null or venue_lng between -180 and 180)
);

create table public.event_checkin_tokens (
  event_id uuid primary key references public.events(id) on delete cascade,
  secret text not null,
  is_active boolean not null default true,
  rotation_seconds integer not null default 30 check (rotation_seconds = 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  member_id uuid not null references public.members(id) on delete restrict,
  checked_in_at timestamptz not null default now(),
  method text not null check (method in ('qr', 'manual')),
  device_hash text,
  distance_m integer,
  ip_hash text,
  ua_family text,
  created_at timestamptz not null default now(),
  constraint attendance_event_member_uq unique (event_id, member_id),
  constraint attendance_event_device_uq unique (event_id, device_hash)
);

create table public.merit_records (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete restrict,
  event_id uuid references public.events(id) on delete restrict,
  attendance_id uuid references public.attendance(id) on delete set null,
  points integer not null,
  source text not null check (source in ('event_checkin', 'manual_adjustment', 'check_in_reversal')),
  reason text,
  awarded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null,
  cover_image_url text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('youtube', 'recording', 'photo')),
  title text not null,
  category text not null default 'general' check (category in ('general', 'event', 'activity', 'member', 'executive')),
  url text,
  storage_path text,
  event_id uuid references public.events(id) on delete set null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_source_check check (
    (type = 'photo' and storage_path is not null and url is null)
    or (type in ('youtube', 'recording') and url is not null and storage_path is null)
  )
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action text not null,
  details jsonb not null default '{}',
  ip_address inet,
  created_at timestamptz not null default now()
);

create table public.checkin_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  device_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now()
);

create table public.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null check (count >= 0)
);

create index merit_records_member_idx on public.merit_records (member_id);
create index attendance_event_time_idx on public.attendance (event_id, checked_in_at);
create index attendance_event_burst_idx on public.attendance (event_id, ip_hash, ua_family);
create index checkin_sessions_expiry_idx on public.checkin_sessions (expires_at);
create index email_verifications_expiry_idx on public.email_verifications (expires_at);
create index news_posts_published_idx on public.news_posts (is_published, published_at desc);
create index events_published_starts_idx on public.events (is_published, starts_at);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['members','email_verifications','site_content','events','event_checkin_tokens','news_posts','media_items','contact_messages'] loop
    execute format('create trigger trg_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
