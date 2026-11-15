select cron.schedule('daily-cleanup', '0 2 * * *', $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
  delete from public.checkin_sessions where expires_at < now() - interval '1 day';
  delete from public.email_verifications where expires_at < now() - interval '1 day';
$$);
