import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { EventCard } from "../components/EventCard";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { SectionTitle } from "../components/SectionTitle";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { createEvent, listEvents } from "../services/events";
import { eventRoleNeeds } from "../services/format";
import { listEventSignups } from "../services/signups";
import type { EventInput, GuildEvent, Signup } from "../types";

const filters = ["全部", "报名中", "即将开始", "已结束"] as const;
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
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [signupMap, setSignupMap] = useState<Record<string, Signup[]>>({});
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState<EventInput>(initialInput);
  const [raidChoice, setRaidChoice] = useState<string>(raidPresets[0]);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("全部");

  const filteredEvents = useMemo(() => {
    return events.filter((guildEvent) => {
      if (filter === "全部") return true;
      if (filter === "报名中") return guildEvent.status === "open";
      if (filter === "即将开始") {
        return guildEvent.status !== "finished" && new Date(guildEvent.starts_at).getTime() >= Date.now();
      }
      if (filter === "已结束") return guildEvent.status === "finished";
      return true;
    });
  }, [events, filter]);

  async function refresh() {
    const eventRows = await listEvents();
    setEvents(eventRows);

    const signupEntries = await Promise.all(
      eventRows.map(async (guildEvent) => [guildEvent.id, await listEventSignups(guildEvent.id)] as const),
    );
    setSignupMap(Object.fromEntries(signupEntries));

    const user = await getCurrentUser();
    setUserId(user?.id ?? "");
  }

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    refresh()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "读取活动失败"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (!userId || creating || !input.raid_name.trim()) return;
    setCreating(true);
    setError("");
    setMessage("");
    try {
      await createEvent(userId, {
        ...input,
        title: input.raid_name.trim(),
        raid_name: input.raid_name.trim(),
        status: "open",
      });
      setInput(initialInput());
      setRaidChoice(raidPresets[0]);
      setMessage("活动已发布，可以开始报名了。");
      await refresh();
    } catch (caught) {
      const detail = caught instanceof Error
        ? caught.message
        : typeof caught === "object" && caught !== null && "message" in caught
          ? String(caught.message)
          : "";
      setError(/row-level security|permission|42501/i.test(detail)
        ? "活动创建权限还没有更新，请在 Supabase 执行最新权限 SQL。"
        : `创建活动失败${detail ? `：${detail}` : "，请刷新页面后再试。"}`);
    } finally {
      setCreating(false);
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-guild-muted">开团板</p>
        <h1 className="text-3xl font-black text-guild-ink">活动报名</h1>
      </div>
      {error ? <ErrorState message={error} /> : null}
      {message ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700">{message}</p> : null}
      {userId ? (
        <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
          <h2 className="font-black text-guild-ink">发起活动</h2>
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
              <input className="guild-input" type="number" min={1} value={input.capacity} onChange={(e) => setInput({ ...input, capacity: Number(e.target.value) })} required />
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
      ) : (
        <div className="guild-card grid gap-3">
          <ErrorState message="登录后即可发起活动。" />
          <Link className="guild-button text-center" to="/auth">去登录</Link>
        </div>
      )}
      <section className="space-y-3">
        <SectionTitle eyebrow="Events" title="活动列表" />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item ? "bg-guild-gold text-white shadow-soft" : "bg-white/80 text-guild-muted"
              }`}
              key={item}
              onClick={() => setFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {filteredEvents.length ? filteredEvents.map((guildEvent) => {
            const signups = signupMap[guildEvent.id] ?? [];
            return (
              <EventCard
                event={guildEvent}
                key={guildEvent.id}
                roleNeed={eventRoleNeeds(signups, guildEvent.capacity)}
                signups={signups}
                signupCount={signups.length}
              />
            );
          }) : <EmptyState title="暂无活动" description="登录后可以发起第一个工会活动。" />}
        </div>
      </section>
    </section>
  );
}
