import { requireSupabase } from "../lib/supabase";
import type { ForumCategory, Post, PostInput } from "../types";
import { normalizePostInput } from "./validation";

type PostRow = Post & {
  comments?: Array<{ count: number }>;
};

export const postReadFields = "id,title,body,category,author_id,is_pinned,created_at,updated_at,author:profiles(id,display_name,role),comments(count)";

function withCommentCount(row: PostRow): Post {
  return {
    ...row,
    comment_count: row.comments?.[0]?.count ?? row.comment_count ?? 0,
  };
}

export function selectHomepageNotice(posts: Post[]) {
  return posts.find((post) => post.is_pinned)
    ?? posts.find((post) => post.category === "开团通知")
    ?? null;
}

export async function listPosts(limit = 20, category?: ForumCategory, searchQuery = "") {
  let query = requireSupabase()
    .from("posts")
    .select(postReadFields)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (category) query = query.eq("category", category);
  if (searchQuery) {
    const escaped = searchQuery.replace(/[%_]/g, "\\$&");
    query = query.ilike("title", `%${escaped}%`);
  }

  const { data, error } = await query
    .limit(limit)
    .returns<PostRow[]>();

  if (error) throw error;
  return (data ?? []).map(withCommentCount);
}

export async function getPost(id: string) {
  const { data, error } = await requireSupabase()
    .from("posts")
    .select(postReadFields)
    .eq("id", id)
    .single<PostRow>();

  if (error) throw error;
  return withCommentCount(data);
}

export async function createPost(userId: string, input: PostInput) {
  const normalized = normalizePostInput(input);
  const { data, error } = await requireSupabase()
    .from("posts")
    .insert({ ...normalized, author_id: userId })
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

export async function updatePost(id: string, input: PostInput) {
  const normalized = normalizePostInput(input);
  const { data, error } = await requireSupabase()
    .from("posts")
    .update(normalized)
    .eq("id", id)
    .select()
    .single<Post>();

  if (error) throw error;
  return data;
}

export async function deletePost(id: string) {
  const { error } = await requireSupabase().from("posts").delete().eq("id", id);
  if (error) throw error;
}
