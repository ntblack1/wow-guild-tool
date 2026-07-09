create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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

alter table public.profiles alter column display_name set default '八块腹肌成员';
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
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create or replace function public.is_guild_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'leader')
  );
$$;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), '八块腹肌成员'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.events enable row level security;
alter table public.signups enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;

drop policy if exists "profiles readable by signed in users" on public.profiles;
create policy "profiles readable by signed in users" on public.profiles
for select to authenticated using (true);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users insert own profile" on public.profiles;
create policy "users insert own profile" on public.profiles
for insert to authenticated with check (id = auth.uid());

drop policy if exists "characters readable" on public.characters;
create policy "characters readable" on public.characters
for select to authenticated using (true);

drop policy if exists "users manage own characters" on public.characters;
create policy "users manage own characters" on public.characters
for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "events readable" on public.events;
create policy "events readable" on public.events
for select to anon, authenticated using (true);

drop policy if exists "admins create events" on public.events;
create policy "admins create events" on public.events
for insert to authenticated with check (public.is_guild_admin() and created_by = auth.uid());

drop policy if exists "admins update events" on public.events;
create policy "admins update events" on public.events
for update to authenticated using (public.is_guild_admin()) with check (public.is_guild_admin());

drop policy if exists "signups readable" on public.signups;
create policy "signups readable" on public.signups
for select to anon, authenticated using (true);

drop policy if exists "users create own signups" on public.signups;
create policy "users create own signups" on public.signups
for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "users update own signups" on public.signups;
create policy "users update own signups" on public.signups
for update to authenticated
using (user_id = auth.uid() or public.is_guild_admin())
with check (user_id = auth.uid() or public.is_guild_admin());

drop policy if exists "users delete own signups" on public.signups;
create policy "users delete own signups" on public.signups
for delete to authenticated using (user_id = auth.uid() or public.is_guild_admin());

drop policy if exists "posts readable" on public.posts;
create policy "posts readable" on public.posts
for select to anon, authenticated using (true);

drop policy if exists "users create own posts" on public.posts;
create policy "users create own posts" on public.posts
for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "users or admins update posts" on public.posts;
create policy "users or admins update posts" on public.posts
for update to authenticated
using (author_id = auth.uid() or public.is_guild_admin())
with check (author_id = auth.uid() or public.is_guild_admin());

drop policy if exists "comments readable" on public.comments;
create policy "comments readable" on public.comments
for select to anon, authenticated using (true);

drop policy if exists "users create own comments" on public.comments;
create policy "users create own comments" on public.comments
for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "reports readable" on public.reports;
create policy "reports readable" on public.reports
for select to anon, authenticated using (true);

drop policy if exists "admins create reports" on public.reports;
create policy "admins create reports" on public.reports
for insert to authenticated with check (public.is_guild_admin() and created_by = auth.uid());

drop policy if exists "admins update reports" on public.reports;
create policy "admins update reports" on public.reports
for update to authenticated using (public.is_guild_admin()) with check (public.is_guild_admin());
