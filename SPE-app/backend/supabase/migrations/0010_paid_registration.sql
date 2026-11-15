create table public.pending_registrations (
  id uuid primary key default gen_random_uuid(),
  first_name text not null, last_name text not null, email text not null unique, phone text not null unique,
  programme text not null, year_of_study text not null, show_on_leaderboard boolean not null default false,
  payment_proof_path text not null, email_verified_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.pending_registrations enable row level security;
revoke all on public.pending_registrations from anon, authenticated;
grant select on public.pending_registrations to authenticated;
create policy pending_registrations_admin_read on public.pending_registrations for select to authenticated
  using (public.has_role('organization_head') or public.has_role('technical_head'));

insert into public.site_content(key, body) values
  ('registration_fee_amount', ''), ('registration_momo_number', ''), ('registration_momo_name', '')
on conflict (key) do nothing;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy payment_proof_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = 'pending');
create policy payment_proof_admin_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (public.has_role('organization_head') or public.has_role('technical_head')));

drop function public.consume_email_verification(text, text, text);
create function public.consume_email_verification(p_email text, p_code_hash text, p_member_code text)
returns table (member_id uuid, first_name text)
language plpgsql security definer set search_path = public as $$
declare pending public.email_verifications%rowtype; app_id uuid;
begin
  select * into pending from public.email_verifications where email = p_email for update;
  if not found or pending.expires_at <= now() then raise exception 'CODE_EXPIRED'; end if;
  if pending.code_hash <> p_code_hash then raise exception 'CODE_INVALID'; end if;
  insert into public.pending_registrations(first_name,last_name,email,phone,programme,year_of_study,show_on_leaderboard,payment_proof_path,email_verified_at)
  values (pending.registration_data->>'first_name',pending.registration_data->>'last_name',pending.email,pending.registration_data->>'phone',pending.registration_data->>'programme',pending.registration_data->>'year_of_study',coalesce((pending.registration_data->>'show_on_leaderboard')::boolean,false),pending.registration_data->>'payment_proof_path',now())
  returning id into app_id;
  delete from public.email_verifications where id = pending.id;
  return query select app_id, pending.registration_data->>'first_name';
end;
$$;

create function public.approve_pending_registration(p_id uuid, p_member_code text)
returns table(first_name text, email text)
language plpgsql security definer set search_path = public as $$
declare p public.pending_registrations%rowtype;
begin
  select * into p from public.pending_registrations where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into public.members(first_name,last_name,email,phone,programme,year_of_study,member_code,show_on_leaderboard,email_verified_at)
  values(p.first_name,p.last_name,p.email,p.phone,p.programme,p.year_of_study,p_member_code,p.show_on_leaderboard,p.email_verified_at);
  delete from public.pending_registrations where id = p_id;
  return query select p.first_name,p.email;
end;
$$;
revoke all on function public.consume_email_verification(text, text, text) from public, anon, authenticated;
grant execute on function public.consume_email_verification(text, text, text) to service_role;
revoke all on function public.approve_pending_registration(uuid,text) from public, anon, authenticated;
grant execute on function public.approve_pending_registration(uuid,text) to service_role;
