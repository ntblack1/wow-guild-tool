import { requireSupabase } from "../lib/supabase";
import type { EventInput, GuildEvent } from "../types";
import { normalizeEventUpdate, normalizeNewEventInput } from "./validation";

const eventSelect = "*, creator:profiles!events_created_by_fkey(id, display_name)";

export function localDayStartIso(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export async function listEvents(limit = 20) {
  const { data, error } = await requireSupabase()
    .from("events")
    .select(eventSelect)
    .gte("starts_at", localDayStartIso())
    .neq("status", "finished")
    .order("starts_at", { ascending: true })
    .limit(limit)
    .returns<GuildEvent[]>();

  if (error) throw error;
  return data ?? [];
}

export async function listHomepageEvents(limit = 6) {
  const { data, error } = await requireSupabase()
    .from("events")
    .select(eventSelect)
    .gte("starts_at", localDayStartIso())
    .neq("status", "finished")
    .order("starts_at", { ascending: true })
    .limit(limit)
    .returns<GuildEvent[]>();

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
