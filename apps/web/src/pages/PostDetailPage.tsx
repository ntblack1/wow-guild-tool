import { FormEvent, useEffect, useRef, useState } from "react";
import { Quote, Reply, Trash2, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { StatusBadge } from "../components/StatusBadge";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { createComment, deleteComment, listComments } from "../services/comments";
import { formatDateTime } from "../services/format";
import { getPost } from "../services/posts";
import type { Comment, Post } from "../types";

export function PostDetailPage() {
  const { postId = "" } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [userId, setUserId] = useState("");
  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [quotedText, setQuotedText] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

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
      await createComment({
        post_id: postId,
        author_id: userId,
        body: body.trim(),
        parent_id: replyTarget?.id ?? null,
        quoted_text: quotedText || null,
      });
      setBody("");
      setReplyTarget(null);
      setQuotedText("");
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "评论失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  function openComposer(target: Comment | null, quote = false) {
    setReplyTarget(target);
    setQuotedText(quote ? (target?.body ?? post?.body ?? "").slice(0, 240) : "");
    requestAnimationFrame(() => commentInputRef.current?.focus());
  }

  async function handleDeleteComment(comment: Comment) {
    setError("");
    try {
      await deleteComment(comment.id);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除评论失败");
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
        {userId ? (
          <button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-guild-gold" onClick={() => openComposer(null, true)} type="button">
            <Quote className="h-3.5 w-3.5" /> 引用主楼
          </button>
        ) : null}
      </article>
      <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-guild-ink">发表评论</h2>
          {replyTarget || quotedText ? (
            <button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={() => { setReplyTarget(null); setQuotedText(""); }} type="button">
              <X className="h-3.5 w-3.5" /> 取消回复
            </button>
          ) : null}
        </div>
        {!userId ? (
          <div className="grid gap-3">
            <ErrorState message="请先登录后再评论。" />
            <Link className="guild-button text-center" to="/auth">去登录</Link>
          </div>
        ) : (
          <>
            {replyTarget ? <p className="rounded-md bg-guild-panelSoft p-2 text-xs font-bold text-guild-muted">回复 @{replyTarget.author?.display_name ?? "成员"}</p> : null}
            {quotedText ? <blockquote className="rounded-md border-l-4 border-guild-gold bg-white/70 p-3 text-xs leading-5 text-guild-muted">{quotedText}</blockquote> : null}
            <Field label="内容">
              <textarea className="guild-input" maxLength={2000} ref={commentInputRef} rows={3} value={body} onChange={(e) => setBody(e.target.value)} required />
            </Field>
            <button className="guild-button" disabled={submitting || !body.trim()}>发表评论</button>
          </>
        )}
      </form>
      <div className="space-y-3">
        {comments.length >= 50 ? <p className="text-center text-xs text-guild-muted">为保证流畅，仅显示最新 50 条评论。</p> : null}
        {comments.length ? comments.map((comment) => (
          <article className="guild-card" key={comment.id}>
            <p className="text-sm text-guild-muted">
              {comment.author?.display_name ?? "匿名成员"} · {formatDateTime(comment.created_at)}
            </p>
            {comment.parent_id ? (
              <p className="mt-2 rounded-md bg-guild-panelSoft px-3 py-2 text-xs font-bold text-guild-muted">
                回复 @{comment.parent?.author?.display_name ?? "较早的评论"}
              </p>
            ) : null}
            {comment.quoted_text ? <blockquote className="mt-2 rounded-md border-l-4 border-guild-gold bg-white/65 p-3 text-xs leading-5 text-guild-muted">{comment.quoted_text}</blockquote> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
            {userId ? (
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
                <button className="inline-flex items-center gap-1 text-guild-gold" onClick={() => openComposer(comment)} type="button"><Reply className="h-3.5 w-3.5" /> 回复</button>
                <button className="inline-flex items-center gap-1 text-guild-muted" onClick={() => openComposer(comment, true)} type="button"><Quote className="h-3.5 w-3.5" /> 引用</button>
                {comment.author_id === userId ? <button className="inline-flex items-center gap-1 text-rose-500" onClick={() => void handleDeleteComment(comment)} type="button"><Trash2 className="h-3.5 w-3.5" /> 删除</button> : null}
              </div>
            ) : null}
          </article>
        )) : <EmptyState title="暂无评论" description="还没人接话。" />}
      </div>
    </section>
  );
}
