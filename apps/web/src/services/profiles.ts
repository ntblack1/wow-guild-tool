import { requireSupabase } from "../lib/supabase";
import type { Profile } from "../types";
import { compressImageForUpload } from "./images";

const showcaseBucket = "member-showcase";

export async function getProfile(userId: string) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle<Profile>();

  if (error) throw error;
  return data;
}

export async function listShowcaseProfiles(limit = 12) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("*")
    .not("showcase_image_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit)
    .returns<Profile[]>();

  if (error) throw error;
  return data ?? [];
}

export async function uploadShowcaseImage(userId: string, file: File) {
  const optimizedFile = await compressImageForUpload(file, 1400);
  const path = `${userId}/showcase.webp`;
  const client = requireSupabase();
  const { error } = await client.storage.from(showcaseBucket).upload(path, optimizedFile, {
    cacheControl: "3600",
    contentType: optimizedFile.type,
    upsert: true,
  });

  if (error) throw error;
  return `${client.storage.from(showcaseBucket).getPublicUrl(path).data.publicUrl}?v=${Date.now()}`;
}

export async function updateShowcaseProfile(userId: string, input: {
  showcase_image_url: string;
  showcase_position_x: number;
  showcase_position_y: number;
  showcase_caption: string;
}) {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select()
    .single<Profile>();

  if (error) throw error;
  return data;
}
