create extension if not exists "pgcrypto";

-- The first test version stored password hashes in a public table. Supabase Auth
-- now owns all credentials and sessions, so that table must no longer exist.
drop table if exists public.guild_accounts;

create table if not exists public.profiles (
  id uuid primary key,
  display_name text not null default '八块腹肌成员',
  role text not null default 'member' check (role in ('member', 'leader', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  class_name text not null,
  spec text not null,
  combat_role text not null check (combat_role in ('T', 'N', 'DPS')),
  item_level integer check (item_level is null or item_level >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  raid_name text not null,
  starts_at timestamptz not null,
  capacity integer not null default 25 check (capacity > 0),
  description text,
  status text not null default 'open' check (status in ('draft', 'open', 'closed', 'finished')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  character_id uuid not null references public.characters(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  combat_role text not null check (combat_role in ('T', 'N', 'DPS')),
  note text,
  status text not null default '已报名' check (status in ('已报名', '已确认', '替补', '请假')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, character_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  category text not null check (category in ('开团通知', '副本攻略', '插件宏区', '装备交易', '吐槽大会', '战报区')),
  author_id uuid not null references public.profiles(id) on delete cascade,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  event_id uuid references public.events(id) on delete set null,
  red_star text,
  black_star text,
  quote text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Keep older test databases aligned with the current Chinese enum values.
alter table public.profiles alter column display_name set default '八块腹肌成员';
alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('member', 'leader', 'admin'));
alter table public.characters drop constraint if exists characters_combat_role_check;
alter table public.characters add constraint characters_combat_role_check check (combat_role in ('T', 'N', 'DPS'));
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('draft', 'open', 'closed', 'finished'));
alter table public.signups alter column status set default '已报名';
alter table public.signups drop constraint if exists signups_status_check;
alter table public.signups add constraint signups_status_check check (status in ('已报名', '已确认', '替补', '请假'));
alter table public.posts drop constraint if exists posts_category_check;
alter table public.posts add constraint posts_category_check check (category in ('开团通知', '副本攻略', '插件宏区', '装备交易', '吐槽大会', '战报区'));

create index if not exists characters_user_id_idx on public.characters(user_id);
create index if not exists events_starts_at_idx on public.events(starts_at);
create index if not exists signups_event_id_idx on public.signups(event_id);
create index if not exists posts_pinned_created_idx on public.posts(is_pinned desc, created_at desc);
create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_guild_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), '八块腹肌成员'),
    'member'
  )
  on conflict (id) do update set display_name = excluded.display_name;
  return new;
end;
$$;

create or replace function public.is_guild_manager(checking_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = checking_user and role in ('leader', 'admin')
  );
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_guild_user();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at before update on public.characters
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists signups_set_updated_at on public.signups;
create trigger signups_set_updated_at before update on public.signups
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at before update on public.posts
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.events enable row level security;
alter table public.signups enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

-- Remove every policy name used by earlier MVP revisions.
drop policy if exists "profiles readable by signed in users" on public.profiles;
drop policy if exists "profiles readable" on public.profiles;
drop policy if exists "users update own profile" on public.profiles;
drop policy if exists "guild users update profiles" on public.profiles;
drop policy if exists "guild users insert profiles" on public.profiles;
drop policy if exists "characters readable" on public.characters;
drop policy if exists "users manage own characters" on public.characters;
drop policy if exists "guild users manage characters" on public.characters;
drop policy if exists "users create own characters" on public.characters;
drop policy if exists "users update own characters" on public.characters;
drop policy if exists "users delete own characters" on public.characters;
drop policy if exists "events readable" on public.events;
drop policy if exists "admins create events" on public.events;
drop policy if exists "guild users create events" on public.events;
drop policy if exists "admins update events" on public.events;
drop policy if exists "guild users update events" on public.events;
drop policy if exists "managers create events" on public.events;
drop policy if exists "managers update events" on public.events;
drop policy if exists "signups readable" on public.signups;
drop policy if exists "users create own signups" on public.signups;
drop policy if exists "guild users create signups" on public.signups;
drop policy if exists "users update own signups" on public.signups;
drop policy if exists "guild users update signups" on public.signups;
drop policy if exists "users delete own signups" on public.signups;
drop policy if exists "guild users delete signups" on public.signups;
drop policy if exists "managers update signups" on public.signups;
drop policy if exists "users or managers delete signups" on public.signups;
drop policy if exists "posts readable" on public.posts;
drop policy if exists "users create own posts" on public.posts;
drop policy if exists "guild users create posts" on public.posts;
drop policy if exists "users or admins update posts" on public.posts;
drop policy if exists "guild users update posts" on public.posts;
drop policy if exists "managers update posts" on public.posts;
drop policy if exists "comments readable" on public.comments;
drop policy if exists "users create own comments" on public.comments;
drop policy if exists "guild users create comments" on public.comments;
drop policy if exists "reports readable" on public.reports;
drop policy if exists "admins create reports" on public.reports;
drop policy if exists "guild users create reports" on public.reports;
drop policy if exists "admins update reports" on public.reports;
drop policy if exists "guild users update reports" on public.reports;
drop policy if exists "managers create reports" on public.reports;
drop policy if exists "managers update reports" on public.reports;

create policy "profiles readable" on public.profiles
for select to anon, authenticated using (true);

create policy "users update own profile" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "characters readable" on public.characters
for select to anon, authenticated using (true);

create policy "users create own characters" on public.characters
for insert to authenticated with check (user_id = auth.uid());

create policy "users update own characters" on public.characters
for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "users delete own characters" on public.characters
for delete to authenticated using (user_id = auth.uid());

create policy "events readable" on public.events
for select to anon, authenticated using (true);

create policy "managers create events" on public.events
for insert to authenticated
with check (public.is_guild_manager() and created_by = auth.uid());

create policy "managers update events" on public.events
for update to authenticated
using (public.is_guild_manager())
with check (public.is_guild_manager());

create policy "signups readable" on public.signups
for select to anon, authenticated using (true);

create policy "users create own signups" on public.signups
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.characters
    where characters.id = character_id and characters.user_id = auth.uid()
  )
  and exists (
    select 1 from public.events
    where events.id = event_id and events.status = 'open'
  )
);

create policy "managers update signups" on public.signups
for update to authenticated
using (public.is_guild_manager())
with check (public.is_guild_manager());

create policy "users or managers delete signups" on public.signups
for delete to authenticated
using (user_id = auth.uid() or public.is_guild_manager());

create policy "posts readable" on public.posts
for select to anon, authenticated using (true);

create policy "users create own posts" on public.posts
for insert to authenticated with check (author_id = auth.uid() and is_pinned = false);

create policy "managers update posts" on public.posts
for update to authenticated
using (public.is_guild_manager())
with check (public.is_guild_manager());

create policy "comments readable" on public.comments
for select to anon, authenticated using (true);

create policy "users create own comments" on public.comments
for insert to authenticated with check (author_id = auth.uid());

create policy "reports readable" on public.reports
for select to anon, authenticated using (true);

create policy "managers create reports" on public.reports
for insert to authenticated
with check (public.is_guild_manager() and created_by = auth.uid());

create policy "managers update reports" on public.reports
for update to authenticated
using (public.is_guild_manager())
with check (public.is_guild_manager());

-- A member may rename their profile, but role changes remain SQL-admin only.
revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;
grant execute on function public.is_guild_manager(uuid) to anon, authenticated;
