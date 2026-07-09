import { requireSupabase } from "../lib/supabase";
import type { Profile } from "../types";

export async function getProfile(userId: string) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) throw error;
  return data;
}
