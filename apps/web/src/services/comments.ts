import { requireSupabase } from "../lib/supabase";
import type { Comment } from "../types";

export async function listComments(postId: string) {
  const { data, error } = await requireSupabase()
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .returns<Comment[]>();

  if (error) throw error;
  return data ?? [];
}

export async function createComment(postId: string, authorId: string, body: string) {
  const { data, error } = await requireSupabase()
    .from("comments")
    .insert({ post_id: postId, author_id: authorId, body })
    .select()
    .single<Comment>();

  if (error) throw error;
  return data;
}
