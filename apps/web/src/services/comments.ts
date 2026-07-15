import { requireSupabase } from "../lib/supabase";
import type { Comment } from "../types";

export function linkCommentParents(rows: Comment[]) {
  const byId = new Map(rows.map((comment) => [comment.id, comment]));
  return rows.map((comment) => ({ ...comment, parent: comment.parent_id ? byId.get(comment.parent_id) : undefined }));
}

export async function listComments(postId: string) {
  const { data, error } = await requireSupabase()
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<Comment[]>();

  if (error) throw error;
  const rows = [...(data ?? [])].reverse();
  return linkCommentParents(rows);
}

export async function createComment(input: {
  post_id: string;
  author_id: string;
  body: string;
  parent_id?: string | null;
  quoted_text?: string | null;
}) {
  const { data, error } = await requireSupabase()
    .from("comments")
    .insert(input)
    .select()
    .single<Comment>();

  if (error) throw error;
  return data;
}

export async function deleteComment(id: string) {
  const { error } = await requireSupabase().from("comments").delete().eq("id", id);
  if (error) throw error;
}
