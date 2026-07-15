alter table public.profiles add column if not exists showcase_image_url text;
alter table public.profiles add column if not exists showcase_position_x integer not null default 50;
alter table public.profiles add column if not exists showcase_position_y integer not null default 50;
alter table public.profiles add column if not exists showcase_caption text;
alter table public.profiles drop constraint if exists profiles_showcase_position_x_check;
alter table public.profiles add constraint profiles_showcase_position_x_check check (showcase_position_x between 0 and 100);
alter table public.profiles drop constraint if exists profiles_showcase_position_y_check;
alter table public.profiles add constraint profiles_showcase_position_y_check check (showcase_position_y between 0 and 100);

alter table public.characters add column if not exists avatar_position_x integer not null default 50;
alter table public.characters add column if not exists avatar_position_y integer not null default 50;
alter table public.characters drop constraint if exists characters_avatar_position_x_check;
alter table public.characters add constraint characters_avatar_position_x_check check (avatar_position_x between 0 and 100);
alter table public.characters drop constraint if exists characters_avatar_position_y_check;
alter table public.characters add constraint characters_avatar_position_y_check check (avatar_position_y between 0 and 100);

alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete set null;
alter table public.comments add column if not exists quoted_text text;
create index if not exists comments_parent_id_idx on public.comments(parent_id);

drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments" on public.comments
for delete to authenticated using (author_id = auth.uid() or public.is_guild_manager());

revoke update on public.profiles from anon, authenticated;
grant update (display_name, showcase_image_url, showcase_position_x, showcase_position_y, showcase_caption) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-showcase', 'member-showcase', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "member showcase readable" on storage.objects;
drop policy if exists "members upload own showcase" on storage.objects;
drop policy if exists "members update own showcase" on storage.objects;
drop policy if exists "members delete own showcase" on storage.objects;

create policy "member showcase readable" on storage.objects
for select to anon, authenticated using (bucket_id = 'member-showcase');

create policy "members upload own showcase" on storage.objects
for insert to authenticated with check (
  bucket_id = 'member-showcase' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "members update own showcase" on storage.objects
for update to authenticated using (
  bucket_id = 'member-showcase' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'member-showcase' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "members delete own showcase" on storage.objects
for delete to authenticated using (
  bucket_id = 'member-showcase' and (storage.foldername(name))[1] = auth.uid()::text
);
