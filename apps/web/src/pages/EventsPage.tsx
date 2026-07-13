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

const initialInput: EventInput = {
  title: "",
  raid_name: "",
  starts_at: "",
  capacity: 25,
  description: "",
  status: "open",
};

export function EventsPage() {
  const [events, setEvents] = useState<GuildEvent[]>([]);
  const [signupMap, setSignupMap] = useState<Record<string, Signup[]>>({});
  const [userId, setUserId] = useState("");
  const [input, setInput] = useState<EventInput>(initialInput);
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
    if (!userId) return;
    setError("");
    try {
      await createEvent(userId, input);
      setInput(initialInput);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建活动失败");
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
      {userId ? (
        <form className="guild-card grid gap-3" onSubmit={handleSubmit}>
          <h2 className="font-black text-guild-ink">发起活动</h2>
          <Field label="活动标题">
            <input className="guild-input" value={input.title} onChange={(e) => setInput({ ...input, title: e.target.value })} required />
          </Field>
          <Field label="副本名称">
            <input className="guild-input" value={input.raid_name} onChange={(e) => setInput({ ...input, raid_name: e.target.value })} required />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="开团时间">
              <input className="guild-input" type="datetime-local" value={input.starts_at} onChange={(e) => setInput({ ...input, starts_at: e.target.value })} required />
            </Field>
            <Field label="人数上限">
              <input className="guild-input" type="number" min={1} value={input.capacity} onChange={(e) => setInput({ ...input, capacity: Number(e.target.value) })} required />
            </Field>
          </div>
          <Field label="活动说明">
            <textarea className="guild-input" rows={3} value={input.description ?? ""} onChange={(e) => setInput({ ...input, description: e.target.value })} />
          </Field>
          <button className="guild-button">发布活动</button>
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
