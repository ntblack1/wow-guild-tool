import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eraser, Home, PenLine, Search, X } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { ForumPostCard } from "../components/ForumPostCard";
import { LoadingState } from "../components/LoadingState";
import { SectionTitle } from "../components/SectionTitle";
import { isSupabaseConfigured } from "../lib/supabase";
import { authPath, getCurrentUser } from "../services/auth";
import { clearForumPostDraft, loadForumPostDraft, saveForumPostDraft } from "../services/drafts";
import { friendlyError } from "../services/errors";
import { forumCategoryFromValue, forumQueryFromValue, forumSortModeFromValue, forumViewSearch, sortPostsForForum } from "../services/format";
import { createPost, listPosts, togglePostPinned } from "../services/posts";
import { getProfile } from "../services/profiles";
import { forumCategories, type ForumCategory, type ForumSortMode, type Post, type PostInput, type Profile } from "../types";

const initialInput: PostInput = {
  title: "",
  body: "",
  category: "开团通知",
};

const categoryFilters = ["全部", ...forumCategories] as const;
const sortModes: ForumSortMode[] = ["最新", "热门"];
const postPageSize = 20;

export function ForumPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState("");
  const [initialDraft] = useState(() => loadForumPostDraft());
  const [input, setInput] = useState<PostInput>(() => initialDraft ?? initialInput);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [postLimit, setPostLimit] = useState(postPageSize);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [composerOpen, setComposerOpen] = useState(Boolean(initialDraft));
  const categoryFilter = forumCategoryFromValue(searchParams.get("category"));
  const sortMode = forumSortModeFromValue(searchParams.get("sort"));
  const searchQuery = forumQueryFromValue(searchParams.get("q"));
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const forumSearch = forumViewSearch(categoryFilter, sortMode, searchQuery);
  const canManage = profile?.role === "admin" || profile?.role === "leader";

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter((post) => categoryFilter === "全部" || post.category === categoryFilter);
    return sortPostsForForum(filtered, sortMode);
  }, [categoryFilter, posts, sortMode]);

  async function loadPosts(limit: number) {
    const rows = await listPosts(limit + 1, categoryFilter === "全部" ? undefined : categoryFilter, searchQuery);
    setPosts(rows.slice(0, limit));
    setHasMorePosts(rows.length > limit);
  }

  async function refresh(limit = postLimit) {
    const [rows, user] = await Promise.all([
      listPosts(limit + 1, categoryFilter === "全部" ? undefined : categoryFilter, searchQuery),
      getCurrentUser(),
    ]);
    setPosts(rows.slice(0, limit));
    setHasMorePosts(rows.length > limit);
    setUserId(user?.id ?? "");
    setLoading(false);
    if (!user) {
      setProfile(null);
      return;
    }
    setProfile(await getProfile(user.id).catch(() => null));
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
    if (!isSupabaseConfigured) return;
    setSearchDraft(searchQuery);
    setPostLimit(postPageSize);
    refresh(postPageSize)
      .catch((caught) => setError(friendlyError(caught, "读取帖子失败，请稍后重试。")))
      .finally(() => setLoading(false));
  }, [categoryFilter, searchQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => saveForumPostDraft(input), 450);
    return () => window.clearTimeout(timer);
  }, [input]);

  function changeForumView(category: (typeof categoryFilters)[number], mode: ForumSortMode, query = searchQuery) {
    setPostLimit(postPageSize);
    setSearchParams(forumViewSearch(category, mode, query));
  }

  function handleSearch(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    changeForumView(categoryFilter, sortMode, forumQueryFromValue(searchDraft));
  }

  async function handleLoadMore() {
    if (loadingMore || !hasMorePosts) return;
    const nextLimit = postLimit + postPageSize;
    setLoadingMore(true);
    setError("");
    try {
      await loadPosts(nextLimit);
      setPostLimit(nextLimit);
    } catch (caught) {
      setError(friendlyError(caught, "加载更多帖子失败，请稍后重试。"));
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSubmit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (!userId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const createdPost = await createPost(userId, input);
      clearForumPostDraft();
      setInput(initialInput);
      setComposerOpen(false);
      navigate({ pathname: `/forum/${createdPost.id}`, search: forumSearch });
    } catch (caught) {
      setError(friendlyError(caught, "发帖失败，请稍后再试。"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTogglePinned(post: Post) {
    setError("");
    try {
      await togglePostPinned(post.id, !post.is_pinned);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "修改置顶状态失败，请稍后重试。"));
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link className="guild-button-secondary min-h-9 gap-1 px-3 py-1" to="/">
          <ChevronLeft className="h-4 w-4" /> 返回工会大厅
        </Link>
        <nav aria-label="页面层级" className="flex items-center gap-1.5 text-xs font-bold text-guild-muted">
          <Link className="inline-flex items-center gap-1 hover:text-guild-gold" to="/"><Home className="h-3.5 w-3.5" /> 工会大厅</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span aria-current="page" className="text-guild-ink">工会论坛</span>
        </nav>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-guild-muted">炉边闲聊</p>
          <h1 className="text-3xl font-black text-guild-ink">工会论坛</h1>
        </div>
        <button
          className="guild-button shrink-0 gap-1.5 px-3 sm:px-4"
          onClick={() => setComposerOpen((current) => !current)}
          type="button"
        >
          {composerOpen ? <X className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
          {composerOpen ? "收起" : "发布新帖"}
        </button>
      </div>
      {error ? <ErrorState message={error} onRetry={retryRefresh} /> : null}
      {composerOpen ? (
        <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-guild-gold">NEW POST</p>
              <h2 className="font-black text-guild-ink">发布新帖</h2>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={() => setComposerOpen(false)} type="button">
              <X className="h-3.5 w-3.5" /> 取消
            </button>
          </div>
          {!userId ? (
            <div className="grid gap-3">
              <ErrorState message="请先登录后再发帖。" />
              <Link className="guild-button text-center" to={authPath(`/forum${forumSearch}`)}>去登录</Link>
            </div>
          ) : (
            <>
              <Field label="板块">
                <select className="guild-input" value={input.category} onChange={(e) => setInput({ ...input, category: e.target.value as ForumCategory })}>
                  {forumCategories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </Field>
              <Field label="标题">
                <input className="guild-input" minLength={2} maxLength={80} placeholder="一句话说明要聊什么" value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} required />
              </Field>
              <Field label="正文">
                <textarea className="guild-input" maxLength={10000} placeholder="分享通知、攻略或工会趣事" rows={5} value={input.body} onChange={(e) => setInput({ ...input, body: e.target.value })} required />
              </Field>
              {input.title.trim() || input.body.trim() ? (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-guild-muted">
                  <span>草稿自动保存在当前设备，7 天内可恢复。</span>
                  <button className="inline-flex min-h-9 items-center gap-1 font-bold text-rose-500" onClick={() => { clearForumPostDraft(); setInput(initialInput); }} type="button">
                    <Eraser className="h-3.5 w-3.5" /> 清空草稿
                  </button>
                </div>
              ) : null}
              <button className="guild-button" disabled={submitting || !input.title.trim() || !input.body.trim()}>
                {submitting ? "发布中..." : "发布帖子"}
              </button>
            </>
          )}
        </form>
      ) : null}
      <section className="space-y-3">
        <SectionTitle
          eyebrow="Forum"
          title="帖子流"
          action={
            <div className="rounded-full bg-white/80 p-1 text-xs font-bold shadow-sm">
              {sortModes.map((mode) => (
                <button
                  className={`rounded-full px-3 py-1 ${sortMode === mode ? "bg-guild-gold text-white" : "text-guild-muted"}`}
                  key={mode}
                  onClick={() => changeForumView(categoryFilter, mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          }
        />
        <form className="flex gap-2" role="search" onSubmit={handleSearch}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">搜索帖子标题</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-guild-muted" />
            <input
              className="guild-input pl-10 pr-10"
              maxLength={40}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="搜索通知、攻略或帖子标题"
              type="search"
              value={searchDraft}
            />
            {searchDraft ? (
              <button
                aria-label="清空搜索"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center text-guild-muted"
                onClick={() => {
                  setSearchDraft("");
                  if (searchQuery) changeForumView(categoryFilter, sortMode, "");
                }}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
          <button className="guild-button shrink-0 px-4" type="submit">搜索</button>
        </form>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((category) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoryFilter === category ? "bg-guild-gold text-white shadow-soft" : "bg-white/80 text-guild-muted"
              }`}
              key={category}
              onClick={() => changeForumView(category, sortMode)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {visiblePosts.length ? visiblePosts.map((post) => (
            <div key={post.id}>
              <ForumPostCard post={post} search={forumSearch} />
              {canManage ? (
                <button className="guild-button-secondary mt-3 min-h-9" onClick={() => void handleTogglePinned(post)} type="button">
                  {post.is_pinned ? "取消置顶" : "置顶"}
                </button>
              ) : null}
            </div>
          )) : <EmptyState title={searchQuery ? "没有找到相关帖子" : "暂无帖子"} description={searchQuery ? "换个短一点的关键词试试。" : "来发第一条开荒心得。"} />}
        </div>
        {hasMorePosts ? (
          <button className="guild-button-secondary w-full" disabled={loadingMore} onClick={() => void handleLoadMore()} type="button">
            {loadingMore ? "加载中..." : "加载更多帖子"}
          </button>
        ) : null}
      </section>
    </section>
  );
}
