create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create function public.notify_contact_message() returns trigger
language plpgsql security definer set search_path = public, extensions, net, vault as $$
declare project_url text; webhook_secret text;
begin
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'SUPABASE_URL' limit 1;
  select decrypted_secret into webhook_secret from vault.decrypted_secrets where name = 'WEBHOOK_SECRET' limit 1;
  if project_url is null or webhook_secret is null then
    raise warning 'Contact notification is not configured; set SUPABASE_URL and WEBHOOK_SECRET in Vault.';
    return new;
  end if;
  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/send_contact_notification',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', webhook_secret),
    body := jsonb_build_object('type', 'INSERT', 'table', 'contact_messages', 'schema', 'public', 'record', to_jsonb(new))
  );
  return new;
end;
$$;

create trigger trg_contact_notification after insert on public.contact_messages
for each row execute function public.notify_contact_message();
