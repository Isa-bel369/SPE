-- Local development data. Keep it out of production.

insert into public.site_content (key, body) values
  ('home_hero_title', 'Where energy minds come together.'),
  ('home_hero_intro', 'We are the SPE UMaT Student Chapter: a community of future energy professionals learning, leading, and building connections that move the industry forward.'),
  ('home_hero_image', 'gallery/campus-briefing.jpg'),
  ('home_hero_alt', 'Students working together at a university chapter activity.'),
  ('home_hero_caption', 'Curiosity today. Leadership tomorrow.'),
  ('home_intro', 'SPE brings together people who shape the future of energy. At UMaT, that mission comes to life through technical workshops, industry engagement, peer learning, and service to our community.'),
  ('about_heading', 'WE ARE SPE UMAT'),
  ('about_hero_image', 'gallery/campus-briefing.jpg'),
  ('about_hero_alt', 'SPE UMaT chapter members working together.'),
  ('about_chapter', 'SPE UMaT is the student chapter of SPE at the University of Mines and Technology, Tarkwa. The chapter hosts technical talks, software workshops, field exposure, outreach, and a merit programme that recognises consistent contribution.'),
  ('about_mission', 'To collect, disseminate, and exchange technical knowledge concerning the exploration, development, and production of oil and gas resources, and related technologies, for the public benefit; and to provide opportunities for professionals to enhance their technical and professional competence.'),
  ('about_vision', 'To be a society of professional excellence, providing its members the highest quality lifelong learning, and continuous personal and professional growth.'),
  ('about_benefits', 'SPE UMaT members can take part in technical talks, software workshops, field exposure, outreach, professional learning, and chapter service.'),
  ('contact_info', 'Petroleum Engineering Department, University of Mines and Technology, Tarkwa, Ghana.')
on conflict (key) do update set body = excluded.body;

insert into public.events (title, slug, description, starts_at, ends_at, location, cover_image_url, points, is_published)
values
  ('Jubilee Field Technical Visit', 'jubilee-field-technical-visit', 'A guided technical visit focused on offshore operations, health, safety and environment, and production systems.', '2026-11-08 07:30:00+00', '2026-11-08 15:30:00+00', 'Tarkwa Campus / Field departure', 'gallery/field-conversations.jpg', 3, true),
  ('Petrel Fundamentals Workshop', 'petrel-fundamentals-workshop', 'Hands-on introduction to subsurface modelling for members preparing for internships.', '2026-10-28 14:00:00+00', '2026-10-28 17:00:00+00', 'Petroleum Computer Lab', 'gallery/lab-session.jpg', 3, true),
  ('New Member Induction Night', 'new-member-induction-night', 'Welcome session for new SPE UMaT members, executive briefing, and networking.', '2026-11-21 17:00:00+00', '2026-11-21 20:00:00+00', 'Auditorium Annex', null, 3, true)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  location = excluded.location,
  cover_image_url = excluded.cover_image_url,
  points = excluded.points,
  is_published = excluded.is_published;

insert into public.news_posts (title, slug, body, is_published, published_at)
values
  ('SPE UMaT opens 2026/27 membership window', 'spe-umat-opens-2026-27-membership-window', 'Membership registration is open for students interested in the SPE UMaT Student Chapter. New members can take part in chapter learning and activities.', true, '2026-10-10 12:00:00+00'),
  ('Paper contest coaching starts this month', 'paper-contest-coaching-starts-this-month', 'The Technical Committee will host weekly coaching for students preparing SPE paper contest abstracts.', true, '2026-10-05 12:00:00+00')
on conflict (slug) do update set
  title = excluded.title,
  body = excluded.body,
  is_published = excluded.is_published,
  published_at = excluded.published_at;

insert into public.media_items (type, title, category, url, is_published)
select v.type, v.title, v.category, v.url, true
from (values
  ('youtube', 'SPE International: Who we are', 'general', 'https://www.youtube-nocookie.com/embed/oY59wE3N1nM'),
  ('recording', 'HSE toolbox talk recording', 'activity', 'https://www.youtube-nocookie.com/embed/Scxs7L0vhZ4')
) as v(type, title, category, url)
where not exists (select 1 from public.media_items existing where existing.url = v.url);
