create or replace function public.update_own_signup(
  p_signup_id uuid,
  p_character_id uuid,
  p_combat_role text,
  p_note text
)
returns setof public.signups
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = 'P0001';
  end if;

  return query
  update public.signups as signup
  set
    character_id = p_character_id,
    combat_role = p_combat_role,
    note = nullif(left(trim(p_note), 120), '')
  where signup.id = p_signup_id
    and signup.user_id = auth.uid()
    and p_combat_role in ('T', 'N', 'DPS')
    and exists (
      select 1 from public.characters as character
      where character.id = p_character_id and character.user_id = auth.uid()
    )
    and exists (
      select 1 from public.events as guild_event
      where guild_event.id = signup.event_id and guild_event.status = 'open'
    )
  returning signup.*;

  if not found then
    raise exception 'SIGNUP_NOT_EDITABLE' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.update_own_signup(uuid, uuid, text, text) from public;
grant execute on function public.update_own_signup(uuid, uuid, text, text) to authenticated;
