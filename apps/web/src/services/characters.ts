import { requireSupabase } from "../lib/supabase";
import type { CharacterInput, GuildCharacter } from "../types";
import { compressImageForUpload } from "./images";

const avatarBucket = "character-avatars";

export async function uploadCharacterAvatar(userId: string, characterId: string, file: File) {
  const optimizedFile = await compressImageForUpload(file, 900);
  const path = `${userId}/${characterId}.webp`;
  const client = requireSupabase();
  const { error } = await client.storage.from(avatarBucket).upload(path, optimizedFile, {
    cacheControl: "3600",
    contentType: optimizedFile.type,
    upsert: true,
  });

  if (error) {
    if (/bucket.*not found|does not exist/i.test(error.message)) {
      throw new Error("头像存储尚未启用，请执行 Supabase 的头像更新 SQL。");
    }
    throw error;
  }
  return `${client.storage.from(avatarBucket).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}

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

export async function deleteCharacter(id: string, userId?: string, avatarUrl?: string | null) {
  const { error } = await requireSupabase().from("characters").delete().eq("id", id);
  if (error) throw error;
  if (userId && avatarUrl) {
    await requireSupabase().storage.from(avatarBucket).remove([`${userId}/${id}.webp`]);
  }
}
