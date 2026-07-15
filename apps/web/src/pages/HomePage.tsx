import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { DeferredSection } from "../components/DeferredSection";
import { HeroBanner } from "../components/HeroBanner";
import { LoadingState } from "../components/LoadingState";
import { NoticeCard } from "../components/NoticeCard";
import { RankCard } from "../components/RankCard";
import { SectionTitle } from "../components/SectionTitle";
import { isSupabaseConfigured } from "../lib/supabase";
import { listHomepageEvents } from "../services/events";
import { isEventToday, nextEvent } from "../services/format";
import { listPosts } from "../services/posts";
import { listSignupsForEvents, signupsByEvent } from "../services/signups";
import type { GuildEvent, Post, Signup } from "../types";

const GuildMemberShowcase = lazy(() => import("../components/GuildMemberShowcase").then((module) => ({ default: module.GuildMemberShowcase })));

export function HomePage() {
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [signupMap, setSignupMap] = useState<Record<string, Signup[]>>({});
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const todayEvents = events.filter((event) => isEventToday(event));
  const featuredEvent = todayEvents[0] ?? nextEvent(events);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([listHomepageEvents(6), listPosts(3)])
      .then(async ([eventRows, postRows]) => {
        const today = eventRows.find((event) => isEventToday(event));
        const featured = today ?? nextEvent(eventRows);
        const eventIds = [...new Set([featured?.id, ...eventRows.slice(0, 3).map((event) => event.id)].filter((id): id is string => Boolean(id)))];
        const signupRows = await listSignupsForEvents(eventIds);
        setEvents(eventRows);
        setPosts(postRows);
        setSignupMap(signupsByEvent(eventIds, signupRows));
      })
      .catch((caught) => setError(caught instanceof Error ? caught.message : "读取失败"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="space-y-5">
      <HeroBanner />

      <section className="space-y-3">
        <SectionTitle eyebrow={todayEvents.length ? "TODAY" : "NEXT RAID"} title={todayEvents.length ? "今日活动" : "下一场活动"} />
        {featuredEvent ? (
          <EventCard event={featuredEvent} key={featuredEvent.id} prominent signups={signupMap[featuredEvent.id] ?? []} />
        ) : (
          <Link className="block rounded-guild border border-dashed border-guild-gold/60 bg-guild-panelSoft p-4 text-guild-ink" to="/events">
            <p className="font-black">今天还没有活动</p>
            <p className="mt-1 text-sm text-guild-muted">登录后就能发起第一场活动。</p>
          </Link>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-4">
        <Link className="guild-card block" to="/events">
          <h2 className="font-black text-guild-ink">活动报名</h2>
          <p className="mt-1 text-sm text-guild-muted">查看开团和当前阵容</p>
        </Link>
        <Link className="guild-card block" to="/forum">
          <h2 className="font-black text-guild-ink">工会论坛</h2>
          <p className="mt-1 text-sm text-guild-muted">通知、攻略、交易和战报</p>
        </Link>
        <Link className="guild-card block" to="/reports">
          <h2 className="font-black text-guild-ink">副本战报</h2>
          <p className="mt-1 text-sm text-guild-muted">红手黑手和今日金句</p>
        </Link>
        <Link className="guild-card block" to="/characters">
          <h2 className="font-black text-guild-ink">我的角色</h2>
          <p className="mt-1 text-sm text-guild-muted">维护报名用的角色</p>
        </Link>
      </div>

      {!isSupabaseConfigured ? (
        <ErrorState message="当前是未配置 Supabase 的本地界面预览。填写环境变量后会读取真实活动和帖子。" />
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      {loading ? <LoadingState /> : null}

      <DeferredSection minHeight={360}>
        <Suspense fallback={<LoadingState />}><GuildMemberShowcase /></Suspense>
      </DeferredSection>

      <div className="grid gap-4 md:grid-cols-2">
        <NoticeCard />
        <RankCard />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle eyebrow="Today" title="最近活动" />
          {events.length ? (
            events.slice(0, 3).map((event) => <EventCard event={event} key={event.id} signups={signupMap[event.id] ?? []} />)
          ) : (
            <EmptyState title="暂无活动" description="等团长发布第一场活动。" />
          )}
        </section>
        <section className="space-y-3">
          <SectionTitle eyebrow="Forum" title="最新帖子" />
          {posts.length ? (
            posts.map((post) => (
              <Link className="guild-card block" key={post.id} to={`/forum/${post.id}`}>
                <p className="text-xs text-guild-muted">{post.category}</p>
                <h3 className="mt-1 font-black text-guild-ink">{post.title}</h3>
              </Link>
            ))
          ) : (
            <EmptyState title="暂无帖子" description="第一条吐槽正在路上。" />
          )}
        </section>
      </div>
    </section>
  );
}
