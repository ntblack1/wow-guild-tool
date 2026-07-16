import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, X } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { SectionTitle } from "../components/SectionTitle";
import { isSupabaseConfigured } from "../lib/supabase";
import { authPath, getCurrentUser } from "../services/auth";
import { friendlyError } from "../services/errors";
import { createEvent, listEvents } from "../services/events";
import { eventFilterFromValue, eventRoleNeeds, eventViewSearch, isEventToday } from "../services/format";
import { listSignupsForEvents, signupsByEvent } from "../services/signups";
import { eventFilters, type EventInput, type GuildEvent, type Signup } from "../types";

const raidPresets = ["TOC+ZUG", "NAXX加双龙", "风暴毒蛇摸奖"] as const;
const customRaidValue = "自定义";

function defaultStartTime() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(20, 0, 0, 0);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialInput(): EventInput {
  return {
    title: raidPresets[0],
    raid_name: raidPresets[0],
    starts_at: defaultStartTime(),
    capacity: 25,
    description: "",
    status: "open",
  };
}

export function EventsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [signupMap, setSignupMap] = useState<Record<string, Signup[]>>({});
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState<EventInput>(initialInput);
  const [raidChoice, setRaidChoice] = useState<string>(raidPresets[0]);
  const [creating, setCreating] = useState(false);
  const [eventCreatorOpen, setEventCreatorOpen] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [signupLoading, setSignupLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const filter = eventFilterFromValue(searchParams.get("filter"));
  const eventSearch = eventViewSearch(filter);
  const todayEvents = events.filter((guildEvent) => isEventToday(guildEvent));

  const filteredEvents = useMemo(() => {
    return events.filter((guildEvent) => {
      if (filter === "全部") return true;
      if (filter === "我的报名") {
        return (signupMap[guildEvent.id] ?? []).some((signup) => signup.user_id === userId && signup.status !== "请假");
      }
      if (filter === "报名中") return guildEvent.status === "open";
      if (filter === "即将开始") {
        return guildEvent.status !== "finished" && new Date(guildEvent.starts_at).getTime() >= Date.now();
      }
      return true;
    });
  }, [events, filter, signupMap, userId]);

  async function refresh() {
    const [eventRows, user] = await Promise.all([listEvents(), getCurrentUser()]);
    setEvents(eventRows);
    setUserId(user?.id ?? "");
    setLoading(false);

    const eventIds = eventRows.map((guildEvent) => guildEvent.id);
    try {
      setSignupMap(signupsByEvent(eventIds, await listSignupsForEvents(eventIds)));
    } catch {
      setError("活动已读取，但报名阵容暂时未能加载，请稍后刷新。");
    } finally {
      setSignupLoading(false);
    }
  }

  async function retryRefresh() {
    setError("");
    setSignupLoading(true);
    try {
      await refresh();
    } catch (caught) {
      setSignupLoading(false);
      setError(friendlyError(caught, "读取活动失败，请稍后重试。"));
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refresh()
      .catch((caught) => {
        setError(friendlyError(caught, "读取活动失败，请稍后重试。"));
        setSignupLoading(false);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (!userId || creating || !input.raid_name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const createdEvent = await createEvent(userId, {
        ...input,
        title: input.raid_name.trim(),
        raid_name: input.raid_name.trim(),
        status: "open",
      });
      setInput(initialInput());
      setRaidChoice(raidPresets[0]);
      setEventCreatorOpen(false);
      navigate(`/events/${createdEvent.id}`);
    } catch (caught) {
      const detail = caught instanceof Error
        ? caught.message
        : typeof caught === "object" && caught !== null && "message" in caught
          ? String(caught.message)
          : "";
      setError(/row-level security|permission|42501/i.test(detail)
        ? "活动创建权限还没有更新，请联系会长完成网站权限设置。"
        : friendlyError(caught, "创建活动失败，请刷新页面后再试。"));
    } finally {
      setCreating(false);
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-guild-muted">开团板</p>
          <h1 className="text-3xl font-black text-guild-ink">活动报名</h1>
        </div>
        <button className="guild-button shrink-0 gap-1.5 px-3 sm:px-4" onClick={() => setEventCreatorOpen((current) => !current)} type="button">
          {eventCreatorOpen ? <X className="h-4 w-4" /> : <CalendarPlus className="h-4 w-4" />}
          {eventCreatorOpen ? "收起" : "发起活动"}
        </button>
      </div>
      {error ? <ErrorState message={error} onRetry={retryRefresh} /> : null}
      <section className="space-y-3">
        <SectionTitle eyebrow="TODAY" title="今日活动" />
        {todayEvents.length ? todayEvents.map((guildEvent) => {
          const signups = signupMap[guildEvent.id];
          return <EventCard currentUserId={userId} event={guildEvent} key={guildEvent.id} prominent roleNeed={signups ? eventRoleNeeds(signups, guildEvent.capacity) : undefined} search={eventSearch} signups={signups} signupCount={signups?.length} />;
        }) : (
          <div className="rounded-guild border border-dashed border-guild-line bg-white/55 p-4">
            <p className="font-black text-guild-ink">今天暂无开团</p>
            <p className="mt-1 text-sm text-guild-muted">想开团？下面选择副本后即可发布。</p>
          </div>
        )}
      </section>
      {eventCreatorOpen && userId ? (
        <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-guild-gold">NEW RAID</p>
              <h2 className="font-black text-guild-ink">发起活动</h2>
            </div>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={() => setEventCreatorOpen(false)} type="button"><X className="h-3.5 w-3.5" /> 取消</button>
          </div>
          <Field label="副本/活动">
            <select
              className="guild-input"
              value={raidChoice}
              onChange={(event) => {
                const value = event.target.value;
                setRaidChoice(value);
                if (value !== customRaidValue) setInput({ ...input, title: value, raid_name: value });
                else setInput({ ...input, title: "", raid_name: "" });
              }}
            >
              {raidPresets.map((raid) => <option key={raid}>{raid}</option>)}
              <option>{customRaidValue}</option>
            </select>
          </Field>
          {raidChoice === customRaidValue ? (
            <Field label="自定义名称">
              <input
                className="guild-input"
                maxLength={40}
                placeholder="输入副本或活动名称"
                value={input.raid_name}
                onChange={(event) => setInput({ ...input, title: event.target.value, raid_name: event.target.value })}
                required
              />
            </Field>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="开团时间">
              <input className="guild-input" type="datetime-local" value={input.starts_at} onChange={(e) => setInput({ ...input, starts_at: e.target.value })} required />
            </Field>
            <Field label="人数上限">
              <input className="guild-input" type="number" min={1} max={40} value={input.capacity} onChange={(e) => setInput({ ...input, capacity: Number(e.target.value) })} required />
            </Field>
          </div>
          <details className="rounded-md border border-guild-line bg-white/60 p-3">
            <summary className="cursor-pointer text-sm font-bold text-guild-muted">补充说明（选填）</summary>
            <textarea
              className="guild-input mt-3"
              maxLength={300}
              placeholder="集合地点、特殊要求等"
              rows={2}
              value={input.description ?? ""}
              onChange={(e) => setInput({ ...input, description: e.target.value })}
            />
          </details>
          <button className="guild-button" disabled={creating || !input.raid_name.trim()}>
            {creating ? "发布中" : `发布 ${input.raid_name || "活动"}`}
          </button>
        </form>
      ) : eventCreatorOpen ? (
        <div className="guild-card grid gap-3">
          <ErrorState message="登录后即可发起活动。" />
          <Link className="guild-button text-center" to={authPath(`/events${eventSearch}`)}>去登录</Link>
        </div>
      ) : null}
      <section className="space-y-3">
        <SectionTitle eyebrow="Events" title="活动列表" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {eventFilters.filter((item) => item !== "我的报名" || userId).map((item) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item ? "bg-guild-gold text-white shadow-soft" : "bg-white/80 text-guild-muted"
              }`}
              key={item}
              onClick={() => setSearchParams(eventViewSearch(item))}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filter === "我的报名" && signupLoading ? <LoadingState /> : filteredEvents.length ? filteredEvents.map((guildEvent) => {
            const signups = signupMap[guildEvent.id];
            return (
              <EventCard
                event={guildEvent}
                currentUserId={userId}
                key={guildEvent.id}
                roleNeed={signups ? eventRoleNeeds(signups, guildEvent.capacity) : undefined}
                signups={signups}
                signupCount={signups?.length}
                search={eventSearch}
              />
            );
          }) : <EmptyState title="暂无活动" description="登录后可以发起第一个工会活动。" />}
        </div>
      </section>
    </section>
  );
}
