import { requireSupabase } from "../lib/supabase";
import type { CombatRole, Signup, SignupStatus } from "../types";

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
}) {
  const { data, error } = await requireSupabase()
    .from("signups")
    .insert({ ...input, status: "已报名" satisfies SignupStatus })
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

export async function deleteSignup(id: string) {
  const { error } = await requireSupabase().from("signups").delete().eq("id", id);
  if (error) throw error;
}
