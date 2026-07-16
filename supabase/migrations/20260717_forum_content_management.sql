alter table public.comments add column if not exists parent_id uuid references public.comments(id) on delete set null;
alter table public.comments add column if not exists quoted_text text;
create index if not exists comments_parent_id_idx on public.comments(parent_id);

drop policy if exists "users delete own comments" on public.comments;
create policy "users delete own comments" on public.comments
for delete to authenticated using (author_id = auth.uid() or public.is_guild_manager());

with ranked_event_signups as (
  select
    id,
    row_number() over (
      partition by event_id, user_id
      order by
        case status
          when '已确认' then 1
          when '已报名' then 2
          when '替补' then 3
          when '请假' then 4
          else 5
        end,
        created_at asc,
        id asc
    ) as duplicate_rank
  from public.signups
)
delete from public.signups
using ranked_event_signups
where public.signups.id = ranked_event_signups.id
  and ranked_event_signups.duplicate_rank > 1;

create unique index if not exists signups_event_user_unique_idx on public.signups(event_id, user_id);

drop policy if exists "users create own signups" on public.signups;
create policy "users create own signups" on public.signups
for insert to authenticated
with check (
  user_id = auth.uid()
  and status in ('已报名', '替补')
  and exists (
    select 1 from public.characters
    where characters.id = character_id and characters.user_id = auth.uid()
  )
  and exists (
    select 1 from public.events
    where events.id = event_id and events.status = 'open'
  )
);

drop policy if exists "authors update own unpinned posts" on public.posts;
drop policy if exists "authors or managers delete posts" on public.posts;

create policy "authors update own unpinned posts" on public.posts
for update to authenticated
using (author_id = auth.uid() and is_pinned = false)
with check (author_id = auth.uid() and is_pinned = false);

create policy "authors or managers delete posts" on public.posts
for delete to authenticated
using (author_id = auth.uid() or public.is_guild_manager());

drop policy if exists "creators update own events" on public.events;

create policy "creators update own events" on public.events
for update to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "managers delete reports" on public.reports;
create policy "managers delete reports" on public.reports
for delete to authenticated using (public.is_guild_manager());
