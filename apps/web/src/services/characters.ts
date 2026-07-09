import { requireSupabase } from "../lib/supabase";
import type { CharacterInput, GuildCharacter } from "../types";

export async function listCharacters(userId: string) {
  const { data, error } = await requireSupabase()
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .returns<GuildCharacter[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createCharacter(userId: string, input: CharacterInput) {
  const { data, error } = await requireSupabase()
    .from("characters")
    .insert({ ...input, user_id: userId })
    .select()
    .single<GuildCharacter>();

  if (error) throw error;
  return data;
}

export async function updateCharacter(id: string, input: CharacterInput) {
  const { data, error } = await requireSupabase()
    .from("characters")
    .update(input)
    .eq("id", id)
    .select()
    .single<GuildCharacter>();

  if (error) throw error;
  return data;
}

export async function deleteCharacter(id: string) {
  const { error } = await requireSupabase().from("characters").delete().eq("id", id);
  if (error) throw error;
}
