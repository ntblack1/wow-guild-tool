import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, ChevronLeft, ChevronRight, Home, Pencil, Quote, Reply, Trash2, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { ShareButton } from "../components/ShareButton";
import { StatusBadge } from "../components/StatusBadge";
import { isSupabaseConfigured } from "../lib/supabase";
import { authPath, getCurrentUser } from "../services/auth";
import { createComment, deleteComment, flattenCommentThreads, listCommentsPage } from "../services/comments";
import { friendlyError } from "../services/errors";
import { formatDateTime } from "../services/format";
import { deletePost, getPost, updatePost } from "../services/posts";
import { forumCategories, type Comment, type ForumCategory, type Post, type PostInput } from "../types";

const commentPageSize = 20;

export function PostDetailPage() {
  const { postId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const forumHref = `/forum${location.search}`;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [commentLimit, setCommentLimit] = useState(commentPageSize);
  const [userId, setUserId] = useState("");
  const [body, setBody] = useState("");
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [quotedText, setQuotedText] = useState("");
  const [editingPost, setEditingPost] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmingCommentDeleteId, setConfirmingCommentDeleteId] = useState("");
  const [deletingComment, setDeletingComment] = useState(false);
  const [postInput, setPostInput] = useState<PostInput>({ title: "", body: "", category: "开团通知" });
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [error, setError] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const threadedComments = useMemo(() => flattenCommentThreads(comments), [comments]);

  async function refresh(limit = commentLimit) {
    const [postRow, commentPage, user] = await Promise.all([
      getPost(postId),
      listCommentsPage(postId, limit),
      getCurrentUser(),
    ]);
    setPost(postRow);
    setComments(commentPage.comments);
    setCommentTotal(commentPage.total);
    setUserId(user?.id ?? "");
  }

  async function retryRefresh() {
    setError("");
    try {
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "读取帖子失败，请稍后重试。"));
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !postId) return;
    refresh(commentPageSize)
      .catch((caught) => setError(friendlyError(caught, "读取帖子失败，请稍后重试。")))
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    if (post) document.title = `${post.title}｜八块腹肌工会论坛`;
  }, [post]);

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
      setError(friendlyError(caught, "评论失败，请稍后再试。"));
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
    if (deletingComment) return;
    setDeletingComment(true);
    setError("");
    try {
      await deleteComment(comment.id);
      setConfirmingCommentDeleteId("");
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "删除评论失败，请稍后重试。"));
    } finally {
      setDeletingComment(false);
    }
  }

  async function handleLoadEarlier() {
    if (loadingEarlier || comments.length >= commentTotal) return;
    const nextLimit = Math.min(commentLimit + commentPageSize, commentTotal);
    setLoadingEarlier(true);
    setError("");
    try {
      const page = await listCommentsPage(postId, nextLimit);
      setComments(page.comments);
      setCommentTotal(page.total);
      setCommentLimit(nextLimit);
    } catch (caught) {
      setError(friendlyError(caught, "加载更早评论失败，请稍后重试。"));
    } finally {
      setLoadingEarlier(false);
    }
  }

  async function handleUpdatePost(event: FormEvent) {
    event.preventDefault();
    if (!post || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await updatePost(post.id, postInput);
      setEditingPost(false);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "修改帖子失败，请稍后重试。"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePost() {
    if (!post || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await deletePost(post.id);
      navigate(forumHref, { replace: true });
    } catch (caught) {
      setError(friendlyError(caught, "删除帖子失败，请稍后重试。"));
      setSubmitting(false);
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;
  if (!post) return (
    <section className="space-y-4">
      <Link className="guild-button-secondary min-h-9 gap-1 px-3 py-1" to={forumHref}>
        <ChevronLeft className="h-4 w-4" /> 返回论坛
      </Link>
      <EmptyState title="帖子不存在" description="这个帖子可能已经被删除，请返回论坛查看其他帖子。" />
    </section>
  );

  return (
    <section className="space-y-4">
      <div className="sticky top-[61px] z-[9] -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-guild-line/70 bg-guild-bg/95 px-2 py-2 shadow-sm backdrop-blur-xl md:top-[105px]">
        <div className="flex items-center gap-2">
          <Link className="guild-button-secondary min-h-9 gap-1 px-3 py-1" to={forumHref}>
            <ChevronLeft className="h-4 w-4" /> 返回论坛
          </Link>
          <ShareButton title={`${post.title}｜八块腹肌工会论坛`} text={`${post.author?.display_name ?? "工会成员"} 发布了新帖子。`} />
        </div>
        <nav aria-label="页面层级" className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-guild-muted">
          <Link className="inline-flex shrink-0 items-center gap-1 hover:text-guild-gold" to="/">
            <Home className="h-3.5 w-3.5" /> 工会大厅
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link className="shrink-0 hover:text-guild-gold" to={forumHref}>工会论坛</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span aria-current="page" className="max-w-28 truncate text-guild-ink sm:max-w-64">{post.title}</span>
        </nav>
      </div>
      {error ? <ErrorState message={error} onRetry={retryRefresh} /> : null}
      <article className="guild-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-guild-muted">{post.category}</p>
            <h1 className="mt-1 text-2xl font-black text-guild-gold">{post.title}</h1>
          </div>
          {post.is_pinned ? <StatusBadge>置顶</StatusBadge> : null}
        </div>
        <p className="mt-3 text-xs text-guild-muted">
          {post.author?.display_name ?? "匿名成员"} · {formatDateTime(post.created_at)} · {post.comment_count ?? commentTotal} 条评论
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">{post.body}</p>
        {userId ? (
          <button className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-guild-gold" onClick={() => openComposer(null, true)} type="button">
            <Quote className="h-3.5 w-3.5" /> 引用主楼
          </button>
        ) : null}
        {post.author_id === userId ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-guild-line pt-4">
            {!post.is_pinned ? (
              <button
                className="guild-button-secondary min-h-9 gap-1 px-3 py-1"
                onClick={() => {
                  setPostInput({ title: post.title, body: post.body, category: post.category });
                  setEditingPost(true);
                  setConfirmingDelete(false);
                }}
                type="button"
              >
                <Pencil className="h-3.5 w-3.5" /> 编辑帖子
              </button>
            ) : null}
            {confirmingDelete ? (
              <>
                <button className="guild-button min-h-9 bg-rose-500 px-3 py-1 hover:bg-rose-600" disabled={submitting} onClick={() => void handleDeletePost()} type="button">确认删除</button>
                <button className="guild-button-secondary min-h-9 px-3 py-1" onClick={() => setConfirmingDelete(false)} type="button">取消</button>
              </>
            ) : (
              <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1 text-rose-500" onClick={() => { setConfirmingDelete(true); setEditingPost(false); }} type="button"><Trash2 className="h-3.5 w-3.5" /> 删除帖子</button>
            )}
          </div>
        ) : null}
      </article>
      {editingPost ? (
        <form className="guild-card grid gap-3" onSubmit={handleUpdatePost}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-black text-guild-ink">编辑帖子</h2>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={() => setEditingPost(false)} type="button"><X className="h-3.5 w-3.5" /> 取消</button>
          </div>
          <Field label="板块">
            <select className="guild-input" onChange={(event) => setPostInput({ ...postInput, category: event.target.value as ForumCategory })} value={postInput.category}>
              {forumCategories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </Field>
          <Field label="标题"><input className="guild-input" minLength={2} maxLength={80} onChange={(event) => setPostInput({ ...postInput, title: event.target.value })} required value={postInput.title} /></Field>
          <Field label="正文"><textarea className="guild-input" maxLength={10000} onChange={(event) => setPostInput({ ...postInput, body: event.target.value })} required rows={7} value={postInput.body} /></Field>
          <button className="guild-button" disabled={submitting || !postInput.title.trim() || !postInput.body.trim()}>{submitting ? "保存中" : "保存修改"}</button>
        </form>
      ) : null}
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
            <Link className="guild-button text-center" to={authPath(`/forum/${postId}${location.search}`)}>去登录</Link>
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
        {commentTotal > comments.length ? (
          <button className="guild-button-secondary w-full" disabled={loadingEarlier} onClick={() => void handleLoadEarlier()} type="button">
            {loadingEarlier ? "加载中..." : `加载更早评论（还有 ${commentTotal - comments.length} 条）`}
          </button>
        ) : null}
        {comments.length ? threadedComments.map(({ comment, depth }) => (
          <article
            aria-label={depth ? `${comment.author?.display_name ?? "成员"} 的回复` : `${comment.author?.display_name ?? "成员"} 的评论`}
            className={`guild-card ${depth ? "border-l-4 border-l-guild-gold/55 bg-white/65" : ""}`}
            key={comment.id}
            style={{ marginLeft: `${Math.min(depth, 2) * 12}px` }}
          >
            <p className="text-sm text-guild-muted">
              {comment.author?.display_name ?? "匿名成员"} · {formatDateTime(comment.created_at)}
            </p>
            {comment.parent_id ? (
              <p className="mt-2 rounded-md bg-guild-panelSoft px-3 py-2 text-xs font-bold text-guild-muted">
                ↳ 回复 @{comment.parent?.author?.display_name ?? "较早的评论"}
              </p>
            ) : null}
            {comment.quoted_text ? <blockquote className="mt-2 rounded-md border-l-4 border-guild-gold bg-white/65 p-3 text-xs leading-5 text-guild-muted">{comment.quoted_text}</blockquote> : null}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{comment.body}</p>
            {userId ? (
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
                <button className="inline-flex items-center gap-1 text-guild-gold" onClick={() => openComposer(comment)} type="button"><Reply className="h-3.5 w-3.5" /> 回复</button>
                <button className="inline-flex items-center gap-1 text-guild-muted" onClick={() => openComposer(comment, true)} type="button"><Quote className="h-3.5 w-3.5" /> 引用</button>
                {comment.author_id === userId ? (
                  confirmingCommentDeleteId === comment.id ? (
                    <span className="inline-flex flex-wrap items-center gap-2 rounded-md bg-rose-50 px-2 py-1 text-rose-600">
                      <span>确定删除？</span>
                      <button className="font-black" disabled={deletingComment} onClick={() => void handleDeleteComment(comment)} type="button">{deletingComment ? "删除中" : "确认"}</button>
                      <button className="text-guild-muted" disabled={deletingComment} onClick={() => setConfirmingCommentDeleteId("")} type="button">保留</button>
                    </span>
                  ) : (
                    <button className="inline-flex items-center gap-1 text-rose-500" onClick={() => setConfirmingCommentDeleteId(comment.id)} type="button"><Trash2 className="h-3.5 w-3.5" /> 删除</button>
                  )
                ) : null}
              </div>
            ) : null}
          </article>
        )) : <EmptyState title="暂无评论" description="还没人接话。" />}
      </div>
      <nav aria-label="帖子末尾导航" className="flex items-center justify-between border-t border-guild-line pt-4">
        <Link className="guild-button-secondary min-h-10 gap-1 px-3 py-1" to={forumHref}>
          <ChevronLeft className="h-4 w-4" /> 返回论坛
        </Link>
        <button
          className="inline-flex min-h-10 items-center gap-1 px-2 text-sm font-bold text-guild-muted hover:text-guild-gold"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          type="button"
        >
          <ArrowUp className="h-4 w-4" /> 回到顶部
        </button>
      </nav>
    </section>
  );
}
