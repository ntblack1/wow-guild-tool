import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { ForumPostCard } from "../components/ForumPostCard";
import { LoadingState } from "../components/LoadingState";
import { SectionTitle } from "../components/SectionTitle";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { sortPostsForForum } from "../services/format";
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

export function ForumPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState<PostInput>(initialInput);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilters)[number]>("全部");
  const [sortMode, setSortMode] = useState<ForumSortMode>("最新");
  const canManage = profile?.role === "admin" || profile?.role === "leader";

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter((post) => categoryFilter === "全部" || post.category === categoryFilter);
    return sortPostsForForum(filtered, sortMode);
  }, [categoryFilter, posts, sortMode]);

  async function refresh() {
    setPosts(await listPosts(20));
    const user = await getCurrentUser();
    setUserId(user?.id ?? "");
    setProfile(user ? await getProfile(user.id) : null);
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refresh()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "读取帖子失败"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (!userId || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createPost(userId, input);
      setInput(initialInput);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发帖失败，请稍后再试");
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
      setError(caught instanceof Error ? caught.message : "修改置顶失败");
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-guild-muted">炉边闲聊</p>
        <h1 className="text-3xl font-black text-guild-ink">工会论坛</h1>
      </div>
      {error ? <ErrorState message={error} /> : null}
      <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
        <h2 className="font-black text-guild-ink">发帖</h2>
        {!userId ? (
          <div className="grid gap-3">
            <ErrorState message="请先登录后再发帖。" />
            <Link className="guild-button text-center" to="/auth">去登录</Link>
          </div>
        ) : (
          <>
            <Field label="板块">
              <select className="guild-input" value={input.category} onChange={(e) => setInput({ ...input, category: e.target.value as ForumCategory })}>
                {forumCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="标题">
              <input className="guild-input" value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} required />
            </Field>
            <Field label="正文">
              <textarea className="guild-input" rows={5} value={input.body} onChange={(e) => setInput({ ...input, body: e.target.value })} required />
            </Field>
            <button className="guild-button" disabled={submitting}>发布帖子</button>
          </>
        )}
      </form>
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
                  onClick={() => setSortMode(mode)}
                  type="button"
                >
                  {mode}
                </button>
              ))}
            </div>
          }
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((category) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                categoryFilter === category ? "bg-guild-gold text-white shadow-soft" : "bg-white/80 text-guild-muted"
              }`}
              key={category}
              onClick={() => setCategoryFilter(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {visiblePosts.length ? visiblePosts.map((post) => (
            <div key={post.id}>
              <ForumPostCard post={post} />
              {canManage ? (
                <button className="guild-button-secondary mt-3 min-h-9" onClick={() => void handleTogglePinned(post)} type="button">
                  {post.is_pinned ? "取消置顶" : "置顶"}
                </button>
              ) : null}
            </div>
          )) : <EmptyState title="暂无帖子" description="来发第一条开荒心得。" />}
        </div>
      </section>
    </section>
  );
}
