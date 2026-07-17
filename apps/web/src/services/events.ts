import { requireSupabase } from "../lib/supabase";
import type { EventInput, GuildEvent, Signup } from "../types";
import { normalizeEventUpdate, normalizeNewEventInput } from "./validation";

const eventSelect = "id,title,raid_name,starts_at,capacity,description,status,created_by,created_at,updated_at,creator:profiles!events_created_by_fkey(id,display_name)";
export const eventRosterSelect = `${eventSelect},signups(id,event_id,character_id,user_id,combat_role,note,status,created_at,updated_at,character:characters(id,user_id,name,class_name,spec,combat_role,item_level,note,avatar_url,avatar_position_x,avatar_position_y,created_at,updated_at))`;

export type GuildEventWithSignups = GuildEvent & {
  signups: Signup[];
};

export function localDayStartIso(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function listEvents(limit = 20) {
  const { data, error } = await requireSupabase()
    .from("events")
    .select(eventRosterSelect)
    .gte("starts_at", localDayStartIso())
    .neq("status", "finished")
    .order("starts_at", { ascending: true })
    .order("created_at", { referencedTable: "signups", ascending: true })
    .limit(limit)
    .returns<GuildEventWithSignups[]>();

  if (error) throw error;
  return data ?? [];
}

export async function listHomepageEvents(limit = 6) {
  const { data, error } = await requireSupabase()
    .from("events")
    .select(eventRosterSelect)
    .gte("starts_at", localDayStartIso())
    .neq("status", "finished")
    .order("starts_at", { ascending: true })
    .order("created_at", { referencedTable: "signups", ascending: true })
    .limit(limit)
    .returns<GuildEventWithSignups[]>();

  if (error) throw error;
  return data ?? [];
}

export async function getEvent(id: string) {
  const { data, error } = await requireSupabase()
    .from("events")
    .select(eventSelect)
    .eq("id", id)
    .single<GuildEvent>();

  if (error) throw error;
  return data;
}

export async function createEvent(userId: string, input: EventInput) {
  const normalized = normalizeNewEventInput(input);
  const { data, error } = await requireSupabase()
    .from("events")
    .insert({ ...normalized, created_by: userId })
    .select(eventSelect)
    .single<GuildEvent>();

  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, input: Partial<EventInput>) {
  const payload = normalizeEventUpdate(input);
  const { data, error } = await requireSupabase()
    .from("events")
    .update(payload)
    .eq("id", id)
    .select(eventSelect)
    .single<GuildEvent>();

  if (error) throw error;
  return data;
}
