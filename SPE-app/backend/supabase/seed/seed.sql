insert into public.site_content (key, body) values
  ('home_intro', 'The SPE UMaT Student Chapter brings together future energy professionals through technical learning, industry engagement and service.'),
  ('about_mission', 'Connect students with the knowledge, people and opportunities that advance the energy profession.'),
  ('about_vision', 'A community of responsible, skilled and connected energy professionals.'),
  ('about_benefits', 'Members take part in technical talks, workshops, industry visits, outreach and professional networking.'),
  ('contact_info', 'Society of Petroleum Engineers, University of Mines and Technology, Tarkwa, Ghana.')
on conflict (key) do nothing;

insert into public.events (title, slug, description, starts_at, ends_at, location, points, is_published)
values
  ('SPE UMaT Technical Forum', 'spe-umat-technical-forum', 'A staging event for checking event publishing and details.', now() + interval '14 days', now() + interval '14 days 3 hours', 'UMaT campus', 3, true),
  ('Energy Careers Workshop', 'energy-careers-workshop', 'A staging event for checking upcoming events.', now() + interval '30 days', now() + interval '30 days 4 hours', 'UMaT campus', 3, true),
  ('Student Chapter Orientation', 'student-chapter-orientation', 'A staging event for checking past events.', now() - interval '30 days', now() - interval '30 days' + interval '3 hours', 'UMaT campus', 3, true),
  ('Draft Field Visit', 'draft-field-visit', 'Unpublished staging event with venue metadata for admin testing.', now() + interval '45 days', now() + interval '45 days 5 hours', 'Tarkwa', 3, false);

insert into public.news_posts (title, slug, body, is_published, published_at)
values
  ('Welcome to SPE UMaT', 'welcome-to-spe-umat', 'Welcome to the SPE UMaT Student Chapter website.', true, now() - interval '3 days'),
  ('Technical learning this semester', 'technical-learning-this-semester', 'Chapter members will take part in technical sessions and practical learning.', true, now() - interval '2 days'),
  ('Industry engagement', 'industry-engagement', 'Updates from chapter industry engagement activities.', true, now() - interval '1 day'),
  ('Draft chapter announcement', 'draft-chapter-announcement', 'Staging-only unpublished post.', false, null);

insert into public.media_items (type, title, category, url, is_published)
values
  ('youtube', 'Chapter introduction', 'general', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('recording', 'Technical session recording', 'activity', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('youtube', 'Energy careers session', 'event', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('recording', 'Workshop highlights', 'activity', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('youtube', 'SPE learning resources', 'general', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('recording', 'Student research showcase', 'member', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('youtube', 'Field activity overview', 'event', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('recording', 'Chapter orientation', 'activity', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('youtube', 'Executive welcome', 'executive', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('recording', 'Career pathways discussion', 'member', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('youtube', 'Workshop recording', 'activity', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true),
  ('recording', 'Chapter event recap', 'event', 'https://www.youtube-nocookie.com/embed/ysz5S6PUM-U', true);

-- Synthetic staging members. Never load this seed into production.
insert into public.members (first_name, last_name, email, phone, programme, year_of_study, member_code, show_on_leaderboard, email_verified_at)
select 'Test' || n, 'Member' || n, 'test-member-' || n || '@example.com', '+23324' || lpad(n::text, 7, '0'),
  'BSc Petroleum Engineering', case when n % 5 = 0 then 'Postgraduate' else 'Year ' || (((n - 1) % 4) + 1)::text end,
  (100000 + n)::text, n <= 5, now()
from generate_series(1, 10) as n
on conflict (member_code) do nothing;

insert into public.merit_records (member_id, event_id, points, source, reason)
select m.id, e.id, 3, 'event_checkin', null
from public.members m cross join public.events e
where m.email like 'test-member-%@example.com' and e.slug = 'student-chapter-orientation'
on conflict do nothing;
