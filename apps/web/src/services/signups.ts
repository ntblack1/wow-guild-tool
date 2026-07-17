import { requireSupabase } from "../lib/supabase";
import type { CombatRole, GuildCharacter, GuildEvent, Signup, SignupStatus } from "../types";

export const myUpcomingSignupReadFields = "id,event_id,character_id,user_id,combat_role,note,status,created_at,updated_at,character:characters(id,name,class_name,spec,combat_role,avatar_url,avatar_position_x,avatar_position_y),event:events!inner(id,title,raid_name,starts_at,capacity,status)";

export type MyUpcomingSignup = Pick<
  Signup,
  "id" | "event_id" | "character_id" | "user_id" | "combat_role" | "note" | "status" | "created_at" | "updated_at"
> & {
  character?: Pick<GuildCharacter, "id" | "name" | "class_name" | "spec" | "combat_role" | "avatar_url" | "avatar_position_x" | "avatar_position_y">;
  event: Pick<GuildEvent, "id" | "title" | "raid_name" | "starts_at" | "capacity" | "status">;
};

export async function listEventSignups(eventId: string) {
  const { data, error } = await requireSupabase()
    .from("signups")
    .select("*, character:characters(*)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true })
    .returns<Signup[]>();

  if (error) throw error;
  return data ?? [];
}

export async function listSignupsForEvents(eventIds: string[]) {
  if (!eventIds.length) return [];
  const { data, error } = await requireSupabase()
    .from("signups")
    .select("*, character:characters(*)")
    .in("event_id", eventIds)
    .order("created_at", { ascending: true })
    .returns<Signup[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getMyNextSignup(userId: string, now = new Date()) {
  const { data, error } = await requireSupabase()
    .from("signups")
    .select(myUpcomingSignupReadFields)
    .eq("user_id", userId)
    .neq("status", "请假")
    .gte("event.starts_at", now.toISOString())
    .neq("event.status", "finished")
    .order("starts_at", { referencedTable: "event", ascending: true })
    .limit(1)
    .maybeSingle<MyUpcomingSignup>();

  if (error) throw error;
  return data;
}

export function signupsByEvent(eventIds: string[], signups: Signup[]) {
  const grouped = Object.fromEntries(eventIds.map((eventId) => [eventId, [] as Signup[]]));
  for (const signup of signups) grouped[signup.event_id]?.push(signup);
  return grouped;
}

export async function createSignup(input: {
  event_id: string;
  character_id: string;
  user_id: string;
  combat_role: CombatRole;
  note: string | null;
  status?: SignupStatus;
}) {
  const { data, error } = await requireSupabase()
    .from("signups")
    .insert({ ...input, status: input.status ?? ("已报名" satisfies SignupStatus) })
    .select()
    .single<Signup>();

  if (error) throw error;
  return data;
}

export async function updateSignupStatus(id: string, status: SignupStatus) {
  const { data, error } = await requireSupabase()
    .from("signups")
    .update({ status })
    .eq("id", id)
    .select()
    .single<Signup>();

  if (error) throw error;
  return data;
}

export async function updateOwnSignup(id: string, input: {
  character_id: string;
  combat_role: CombatRole;
  note: string | null;
}) {
  const { data, error } = await requireSupabase()
    .rpc("update_own_signup", {
      p_signup_id: id,
      p_character_id: input.character_id,
      p_combat_role: input.combat_role,
      p_note: input.note,
    })
    .single<Signup>();

  if (error) throw error;
  return data;
}

export async function deleteSignup(id: string) {
  const { error } = await requireSupabase().from("signups").delete().eq("id", id);
  if (error) throw error;
}
