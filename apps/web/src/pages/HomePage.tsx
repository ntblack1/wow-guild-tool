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
import { getCurrentUser } from "../services/auth";
import { listHomepageEvents } from "../services/events";
import { eventsExcept, isEventToday, nextEvent } from "../services/format";
import { listPosts, selectHomepageNotice } from "../services/posts";
import { listReports } from "../services/reports";
import { listSignupsForEvents, signupsByEvent } from "../services/signups";
import type { GuildEvent, Post, Report, Signup } from "../types";

const GuildMemberShowcase = lazy(() => import("../components/GuildMemberShowcase").then((module) => ({ default: module.GuildMemberShowcase })));

export function HomePage() {
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [latestReport, setLatestReport] = useState<Report | null>(null);
  const [signupMap, setSignupMap] = useState<Record<string, Signup[]>>({});
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const todayEvents = events.filter((event) => isEventToday(event));
  const featuredEvent = todayEvents[0] ?? nextEvent(events);
  const followupEvents = eventsExcept(events, featuredEvent).slice(0, 3);
  const notice = selectHomepageNotice(posts);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    async function loadHome() {
      const [eventResult, postResult, reportResult, userResult] = await Promise.allSettled([
        listHomepageEvents(6),
        listPosts(3),
        listReports(1),
        getCurrentUser(),
      ]);
      const eventRows = eventResult.status === "fulfilled" ? eventResult.value : [];
      const postRows = postResult.status === "fulfilled" ? postResult.value : [];
      const reportRows = reportResult.status === "fulfilled" ? reportResult.value : [];
      const user = userResult.status === "fulfilled" ? userResult.value : null;
      setEvents(eventRows);
      setPosts(postRows);
      setLatestReport(reportRows[0] ?? null);
      setUserId(user?.id ?? "");

      if ([eventResult, postResult, reportResult].some((result) => result.status === "rejected")) {
        setError("部分大厅内容暂时未能读取，可以继续使用其他功能。");
      }
      setLoading(false);

      const today = eventRows.find((event) => isEventToday(event));
      const featured = today ?? nextEvent(eventRows);
      const eventIds = [...new Set([featured?.id, ...eventRows.slice(0, 3).map((event) => event.id)].filter((id): id is string => Boolean(id)))];
      try {
        const signupRows = await listSignupsForEvents(eventIds);
        setSignupMap(signupsByEvent(eventIds, signupRows));
      } catch {
        setError("报名阵容暂时未能读取，活动和其他功能仍可正常使用。");
      }
    }

    void loadHome();
  }, []);

  return (
    <section className="space-y-5">
      <section className="space-y-3">
        <SectionTitle eyebrow={todayEvents.length ? "TODAY" : "NEXT RAID"} title={todayEvents.length ? "今日活动" : "下一场活动"} />
        {loading ? (
          <LoadingState />
        ) : featuredEvent ? (
          <EventCard currentUserId={userId} event={featuredEvent} key={featuredEvent.id} prominent signups={signupMap[featuredEvent.id]} />
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

      <HeroBanner />

      {!isSupabaseConfigured ? (
        <ErrorState message="当前是未配置 Supabase 的本地界面预览。填写环境变量后会读取真实活动和帖子。" />
      ) : null}
      {error ? <ErrorState message={error} /> : null}
      <DeferredSection minHeight={360}>
        <Suspense fallback={<LoadingState />}><GuildMemberShowcase /></Suspense>
      </DeferredSection>

      <div className="grid gap-4 md:grid-cols-2">
        <NoticeCard post={notice} />
        <RankCard report={latestReport} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-3">
          <SectionTitle eyebrow="Upcoming" title="后续活动" />
          {followupEvents.length ? (
            followupEvents.map((event) => <EventCard currentUserId={userId} event={event} key={event.id} signups={signupMap[event.id]} />)
          ) : (
            <EmptyState title="暂无其他活动" description="有新开团时会显示在这里。" />
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
