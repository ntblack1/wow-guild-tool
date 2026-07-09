import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { createComment, listComments } from "../services/comments";
import { formatDateTime } from "../services/format";
import { getPost } from "../services/posts";
import type { Comment, Post } from "../types";

export function PostDetailPage() {
  const { postId = "" } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userId, setUserId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setPost(await getPost(postId));
    setComments(await listComments(postId));
    const user = await getCurrentUser();
    setUserId(user?.id ?? "");
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !postId) return;
    refresh()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "读取帖子失败"))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (!userId || !body.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createComment(postId, userId, body.trim());
      setBody("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "评论失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;
  if (!post) return <EmptyState title="帖子不存在" description="这个帖子可能已经被删除。" />;

  return (
    <section className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <article className="guild-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-guild-muted">{post.category}</p>
            <h1 className="mt-1 text-2xl font-black text-guild-gold">{post.title}</h1>
          </div>
          {post.is_pinned ? <StatusBadge>置顶</StatusBadge> : null}
        </div>
        <p className="mt-3 text-xs text-guild-muted">
          {post.author?.display_name ?? "匿名成员"} · {formatDateTime(post.created_at)} · {post.comment_count ?? comments.length} 条评论
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{post.body}</p>
      </article>
      <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
        <h2 className="font-bold text-guild-ink">评论</h2>
        {!userId ? (
          <div className="grid gap-3">
            <ErrorState message="请先登录后再评论。" />
            <Link className="guild-button text-center" to="/auth">去登录</Link>
          </div>
        ) : (
          <>
            <Field label="内容">
              <textarea className="guild-input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
            </Field>
            <button className="guild-button" disabled={submitting || !body.trim()}>发表评论</button>
          </>
        )}
      </form>
      <div className="space-y-3">
        {comments.length ? comments.map((comment) => (
          <article className="guild-card" key={comment.id}>
            <p className="text-sm text-guild-muted">
              {comment.author?.display_name ?? "匿名成员"} · {formatDateTime(comment.created_at)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
          </article>
        )) : <EmptyState title="暂无评论" description="还没人接话。" />}
      </div>
    </section>
  );
}
