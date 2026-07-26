-- Officer roster: dynamic, admin-managed, with 1:1 photo uploads.

create table officers (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  name text,
  photo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table officers enable row level security;

create policy "officers are publicly readable" on officers for select using (true);
create policy "admins manage officers" on officers for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed the standard officer roles so the roster has all positions from the start.
insert into officers (role, sort_order) values
  ('President', 0),
  ('Vice President', 1),
  ('Secretary', 2),
  ('Treasurer', 3),
  ('Auditor', 4),
  ('Mass Media Officer Internal', 5),
  ('Mass Media Officer External', 6);

-- Storage bucket for officer photos (1:1, admin write, public read).
insert into storage.buckets (id, name, public)
values ('officer-photos', 'officer-photos', true)
on conflict (id) do nothing;

create policy "officer photos are publicly readable" on storage.objects
  for select using (bucket_id = 'officer-photos');

create policy "admins upload officer photos" on storage.objects
  for insert with check (bucket_id = 'officer-photos' and public.is_admin());

create policy "admins update officer photos" on storage.objects
  for update using (bucket_id = 'officer-photos' and public.is_admin());

create policy "admins delete officer photos" on storage.objects
  for delete using (bucket_id = 'officer-photos' and public.is_admin());
