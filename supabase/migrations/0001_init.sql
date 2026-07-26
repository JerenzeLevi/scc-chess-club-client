-- SCC Chess Club schema: profiles, tournaments, ladder, casual play rooms.

create type member_role as enum ('member', 'admin');
create type event_format as enum ('swiss', 'round_robin');
create type event_status as enum ('draft', 'active', 'completed');
create type pairing_result as enum ('pending', 'white', 'black', 'draw');
create type room_status as enum ('waiting', 'active', 'finished');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  role member_role not null default 'member',
  rating integer not null default 1200,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  format event_format not null default 'swiss',
  status event_status not null default 'draft',
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table event_registrations (
  event_id uuid not null references events (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create table rounds (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  round_number integer not null,
  created_at timestamptz not null default now(),
  unique (event_id, round_number)
);

create table pairings (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references rounds (id) on delete cascade,
  white_id uuid references profiles (id),
  black_id uuid references profiles (id), -- null means white has a bye
  result pairing_result not null default 'pending',
  created_at timestamptz not null default now()
);

create table ladder_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  event_id uuid references events (id) on delete set null,
  rating_before integer not null,
  rating_after integer not null,
  created_at timestamptz not null default now()
);

create table game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  fen text not null default 'start',
  pgn text not null default '',
  white_id uuid references profiles (id),
  black_id uuid references profiles (id),
  status room_status not null default 'waiting',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security

alter table profiles enable row level security;
alter table events enable row level security;
alter table event_registrations enable row level security;
alter table rounds enable row level security;
alter table pairings enable row level security;
alter table ladder_history enable row level security;
alter table game_rooms enable row level security;

create function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles: everyone can read (public ladder), only the owner or an admin can update.
create policy "profiles are publicly readable" on profiles for select using (true);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "admins update any profile" on profiles for update using (public.is_admin());

-- events: publicly readable, only admins write.
create policy "events are publicly readable" on events for select using (true);
create policy "admins manage events" on events for all using (public.is_admin()) with check (public.is_admin());

-- event_registrations: publicly readable; members can register themselves, admins manage all.
create policy "registrations are publicly readable" on event_registrations for select using (true);
create policy "members register themselves" on event_registrations for insert with check (auth.uid() = profile_id);
create policy "members unregister themselves" on event_registrations for delete using (auth.uid() = profile_id);
create policy "admins manage registrations" on event_registrations for all using (public.is_admin()) with check (public.is_admin());

-- rounds & pairings: publicly readable, only admins write.
create policy "rounds are publicly readable" on rounds for select using (true);
create policy "admins manage rounds" on rounds for all using (public.is_admin()) with check (public.is_admin());

create policy "pairings are publicly readable" on pairings for select using (true);
create policy "admins manage pairings" on pairings for all using (public.is_admin()) with check (public.is_admin());

-- ladder_history: publicly readable, only admins/system write.
create policy "ladder history is publicly readable" on ladder_history for select using (true);
create policy "admins manage ladder history" on ladder_history for all using (public.is_admin()) with check (public.is_admin());

-- game_rooms: publicly readable/joinable by any authenticated member.
create policy "game rooms are publicly readable" on game_rooms for select using (true);
create policy "authenticated users create rooms" on game_rooms for insert with check (auth.uid() is not null);
create policy "players update their own room" on game_rooms for update
  using (auth.uid() = white_id or auth.uid() = black_id or white_id is null or black_id is null);
