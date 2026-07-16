import { requireSupabase } from "../lib/supabase";
import type { Comment } from "../types";
import { normalizeCommentBody } from "./validation";

export const commentReadFields = "id,post_id,author_id,body,parent_id,quoted_text,created_at,author:profiles(id,display_name,role)";

export type ThreadedComment = {
  comment: Comment;
  depth: number;
};

export function linkCommentParents(rows: Comment[]) {
  const byId = new Map(rows.map((comment) => [comment.id, comment]));
  return rows.map((comment) => ({ ...comment, parent: comment.parent_id ? byId.get(comment.parent_id) : undefined }));
}

export function flattenCommentThreads(rows: Comment[]): ThreadedComment[] {
  const byId = new Map(rows.map((comment) => [comment.id, comment]));
  const children = new Map<string, Comment[]>();
  const roots: Comment[] = [];

  for (const comment of rows) {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      const siblings = children.get(comment.parent_id) ?? [];
      siblings.push(comment);
      children.set(comment.parent_id, siblings);
    } else {
      roots.push(comment);
    }
  }

  const result: ThreadedComment[] = [];
  const visited = new Set<string>();

  function visit(comment: Comment, depth: number) {
    if (visited.has(comment.id)) return;
    visited.add(comment.id);
    result.push({ comment, depth });
    for (const child of children.get(comment.id) ?? []) visit(child, depth + 1);
  }

  for (const root of roots) visit(root, 0);
  for (const comment of rows) visit(comment, 0);
  return result;
}

export async function listCommentsPage(postId: string, limit = 20) {
  const { data, error, count } = await requireSupabase()
    .from("comments")
    .select(commentReadFields, { count: "exact" })
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<Comment[]>();

  if (error) throw error;
  const comments = linkCommentParents([...(data ?? [])].reverse());
  return { comments, total: count ?? comments.length };
}

export async function listComments(postId: string) {
  return (await listCommentsPage(postId, 50)).comments;
}

export async function createComment(input: {
  post_id: string;
  author_id: string;
  body: string;
  parent_id?: string | null;
  quoted_text?: string | null;
}) {
  const normalized = {
    ...input,
    body: normalizeCommentBody(input.body),
    quoted_text: input.quoted_text?.trim().slice(0, 240) || null,
  };
  const { data, error } = await requireSupabase()
    .from("comments")
    .insert(normalized)
    .select()
    .single<Comment>();

  if (error) throw error;
  return data;
}

export async function deleteComment(id: string) {
  const { error } = await requireSupabase().from("comments").delete().eq("id", id);
  if (error) throw error;
}
