import { requireSupabase } from "../lib/supabase";
import type { EventInput, GuildEvent } from "../types";

export async function listEvents(limit = 20) {
  const { data, error } = await requireSupabase()
    .from("events")
    .select("*")
    .order("starts_at", { ascending: true })
    .limit(limit)
    .returns<GuildEvent[]>();

  if (error) throw error;
  return data ?? [];
}

export async function listHomepageEvents(limit = 6) {
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data, error } = await requireSupabase()
    .from("events")
    .select("*")
    .gte("starts_at", cutoff)
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
    .select("*")
    .eq("id", id)
    .single<GuildEvent>();

  if (error) throw error;
  return data;
}

export async function createEvent(userId: string, input: EventInput) {
  const { data, error } = await requireSupabase()
    .from("events")
    .insert({ ...input, starts_at: new Date(input.starts_at).toISOString(), created_by: userId })
    .select()
    .single<GuildEvent>();

  if (error) throw error;
  return data;
}
