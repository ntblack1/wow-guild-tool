import { requireSupabase } from "../lib/supabase";
import type { Post, PostInput } from "../types";

type PostRow = Post & {
  comments?: Array<{ count: number }>;
};

function withCommentCount(row: PostRow): Post {
  return {
    ...row,
    comment_count: row.comments?.[0]?.count ?? row.comment_count ?? 0,
  };
}

export async function listPosts(limit = 20) {
  const { data, error } = await requireSupabase()
    .from("posts")
    .select("*, author:profiles(*), comments(count)")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<PostRow[]>();

  if (error) throw error;
  return (data ?? []).map(withCommentCount);
}

export async function getPost(id: string) {
  const { data, error } = await requireSupabase()
    .from("posts")
    .select("*, author:profiles(*), comments(count)")
    .eq("id", id)
    .single<PostRow>();

  if (error) throw error;
  return withCommentCount(data);
}

export async function createPost(userId: string, input: PostInput) {
  const { data, error } = await requireSupabase()
    .from("posts")
    .insert({ ...input, author_id: userId })
    .select()
    .single<Post>();

  if (error) throw error;
  return data;
}

export async function togglePostPinned(id: string, isPinned: boolean) {
  const { data, error } = await requireSupabase()
    .from("posts")
    .update({ is_pinned: isPinned })
    .eq("id", id)
    .select()
    .single<Post>();

  if (error) throw error;
  return data;
}
