alter table public.characters add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('character-avatars', 'character-avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "character avatars readable" on storage.objects;
drop policy if exists "members upload own character avatars" on storage.objects;
drop policy if exists "members update own character avatars" on storage.objects;
drop policy if exists "members delete own character avatars" on storage.objects;

create policy "character avatars readable" on storage.objects
for select to anon, authenticated using (bucket_id = 'character-avatars');

create policy "members upload own character avatars" on storage.objects
for insert to authenticated with check (
  bucket_id = 'character-avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "members update own character avatars" on storage.objects
for update to authenticated using (
  bucket_id = 'character-avatars' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'character-avatars' and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "members delete own character avatars" on storage.objects
for delete to authenticated using (
  bucket_id = 'character-avatars' and (storage.foldername(name))[1] = auth.uid()::text
);
