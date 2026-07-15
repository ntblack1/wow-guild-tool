import { useEffect, useMemo, useState } from "react";
import { Check, HeartPulse, Shield, Sparkles, Swords } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { SectionTitle } from "../components/SectionTitle";
import { StatusBadge } from "../components/StatusBadge";
import { isSupabaseConfigured } from "../lib/supabase";
import { getCurrentUser } from "../services/auth";
import { listCharacters } from "../services/characters";
import { getEvent } from "../services/events";
import { describeSignupConflict, eventRoleComposition, eventRoleNeeds, formatDateTime, groupSignupsByRole, statusLabel } from "../services/format";
import { getProfile } from "../services/profiles";
import { createSignup, deleteSignup, listEventSignups, updateSignupStatus } from "../services/signups";
import { signupStatuses, type GuildCharacter, type GuildEvent, type Profile, type Signup, type SignupStatus } from "../types";

const roleTitles = {
  T: "坦克",
  N: "治疗",
  DPS: "输出",
} as const;

const roleIcons = {
  T: Shield,
  N: HeartPulse,
  DPS: Swords,
} as const;

export function EventDetailPage() {
  const { eventId = "" } = useParams();
  const [guildEvent, setGuildEvent] = useState<GuildEvent | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [characters, setCharacters] = useState<GuildCharacter[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const canManage = profile?.role === "admin" || profile?.role === "leader";
  const grouped = useMemo(() => groupSignupsByRole(signups), [signups]);
  const composition = useMemo(
    () => eventRoleComposition(signups, guildEvent?.capacity ?? 1),
    [guildEvent?.capacity, signups],
  );
  const mySignup = signups.find((signup) => signup.user_id === userId) ?? null;
  const selectedCharacter = characters.find((character) => character.id === characterId) ?? null;

  async function refresh() {
    setGuildEvent(await getEvent(eventId));
    setSignups(await listEventSignups(eventId));
    const user = await getCurrentUser();
    setUserId(user?.id ?? "");
    if (user) {
      setProfile(await getProfile(user.id));
      const rows = await listCharacters(user.id);
      setCharacters(rows);
      setCharacterId((current) => current || rows[0]?.id || "");
    } else {
      setProfile(null);
      setCharacters([]);
      setCharacterId("");
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !eventId) return;
    refresh()
      .catch((caught) => setError(caught instanceof Error ? caught.message : "读取活动详情失败"))
      .finally(() => setLoading(false));
  }, [eventId]);

  async function handleSignup() {
    const character = characters.find((item) => item.id === characterId);
    if (!userId || !character || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await createSignup({
        event_id: eventId,
        character_id: character.id,
        user_id: userId,
        combat_role: character.combat_role,
        note: null,
      });
      await refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught);
      setError(describeSignupConflict(message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelSignup() {
    if (!mySignup || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await deleteSignup(mySignup.id);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "取消报名失败");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(signup: Signup, status: SignupStatus) {
    setError("");
    try {
      await updateSignupStatus(signup.id, status);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "修改报名状态失败");
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;
  if (!guildEvent) return <EmptyState title="活动不存在" description="这个活动可能已经被删除。" />;

  return (
    <section className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <article className="guild-card overflow-hidden p-0">
        <div className="h-36 bg-[linear-gradient(135deg,#BEE7FF,#FFD89A_52%,#FFF0D6)]" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-guild-muted">{guildEvent.raid_name}</p>
              <h1 className="text-2xl font-black text-guild-ink">{guildEvent.title}</h1>
            </div>
            <StatusBadge>{statusLabel(guildEvent.status)}</StatusBadge>
          </div>
          <p className="mt-3 text-sm text-guild-muted">
            {formatDateTime(guildEvent.starts_at)} · 上限 {guildEvent.capacity} 人 · {signups.length} 人已报名 · {eventRoleNeeds(signups, guildEvent.capacity)}
          </p>
          {guildEvent.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{guildEvent.description}</p> : null}
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-guild-line/70">
            <div className="h-full rounded-full bg-guild-mint" style={{ width: `${composition.percent}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["T", "N", "DPS"] as const).map((role) => {
              const Icon = roleIcons[role];
              return (
                <div className="rounded-md bg-white/75 px-2 py-2 text-center" key={role}>
                  <Icon className="mx-auto h-4 w-4 text-guild-gold" />
                  <p className="mt-1 text-xs font-black">{roleTitles[role]} {composition.counts[role]}/{composition.targets[role]}</p>
                </div>
              );
            })}
          </div>
        </div>
      </article>

      <section className="overflow-hidden rounded-guild border border-guild-gold/40 bg-[linear-gradient(135deg,#FFF0D6,#FFFFFF_54%,#BEE7FF)] p-4 shadow-glow">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-guild-gold text-white shadow-soft"><Sparkles className="h-4 w-4" /></span>
          <div>
            <p className="text-xs font-bold text-guild-gold">RAID SIGNUP</p>
            <h2 className="font-black text-guild-ink">快速报名</h2>
          </div>
        </div>
        {!userId ? (
          <div className="mt-4 grid gap-3">
            <ErrorState message="请先登录后再报名。" />
            <Link className="guild-button text-center" to="/auth">去登录</Link>
          </div>
        ) : !characters.length ? (
          <div className="mt-4 grid gap-3">
            <ErrorState message="你还没有角色，请先创建角色。" />
            <Link className="guild-button text-center" to="/characters">先创建角色</Link>
          </div>
        ) : mySignup ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-white/80 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <CharacterAvatar avatarUrl={mySignup.character?.avatar_url} name={mySignup.character?.name ?? "我"} />
                <div>
                <p className="font-bold text-guild-ink">{mySignup.character?.name ?? "我的角色"}</p>
                <p className="mt-1 text-sm text-guild-muted">
                  {mySignup.character?.class_name} · {mySignup.character?.spec} · {roleTitles[mySignup.combat_role]}
                </p>
                </div>
              </div>
              <StatusBadge>{mySignup.status}</StatusBadge>
            </div>
            <p className="mt-3 text-sm font-bold text-emerald-700">你已在本场活动阵容中</p>
            <button className="guild-button-secondary mt-3 min-h-9" disabled={submitting} onClick={handleCancelSignup} type="button">
              取消报名
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <div>
              <p className="mb-2 text-sm font-bold text-guild-ink">1. 选择出战角色</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {characters.map((character) => {
                  const Icon = roleIcons[character.combat_role];
                  const selected = character.id === characterId;
                  return (
                    <button
                      aria-pressed={selected}
                      className={`flex min-h-16 items-center gap-3 rounded-md border p-3 text-left transition ${selected ? "border-guild-gold bg-guild-panelSoft" : "border-guild-line bg-white/70"}`}
                      key={character.id}
                      onClick={() => setCharacterId(character.id)}
                      type="button"
                    >
                      <CharacterAvatar avatarUrl={character.avatar_url} className="h-10 w-10" name={character.name} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-black text-guild-ink">{character.name}</span>
                        <span className="flex items-center gap-1 truncate text-xs text-guild-muted"><Icon className="h-3.5 w-3.5 text-guild-gold" />{character.class_name} · {character.spec} · {roleTitles[character.combat_role]}</span>
                      </span>
                      {selected ? <Check className="h-5 w-5 shrink-0 text-emerald-600" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <button className="guild-button min-h-14 text-base" disabled={submitting || !characterId} onClick={() => void handleSignup()} type="button">
              {submitting ? "报名中" : selectedCharacter ? `立即用 ${selectedCharacter.name} 报名` : "2. 立即报名"}
            </button>
            <p className="text-center text-xs text-guild-muted">报名后可随时取消，团长会在阵容中确认状态。</p>
          </div>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        {(["T", "N", "DPS"] as const).map((role) => (
          <section className="guild-card" key={role}>
            <SectionTitle title={`${roleTitles[role]} ${composition.counts[role]}/${composition.targets[role]}`} />
            <div className="mt-3 space-y-2">
              {grouped[role].length ? grouped[role].map((signup) => (
                <div className="rounded-md bg-white/70 p-3" key={signup.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CharacterAvatar avatarUrl={signup.character?.avatar_url} className="h-8 w-8" name={signup.character?.name ?? "未"} />
                      <span className="truncate font-semibold text-guild-ink">{signup.character?.name ?? "未知角色"}</span>
                    </div>
                    <StatusBadge>{signup.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-guild-muted">
                    {signup.character?.class_name ?? "未知职业"} · {signup.character?.spec ?? "未知天赋"}
                    {signup.character?.item_level ? ` · ${signup.character.item_level} 装等` : ""}
                  </p>
                  {signup.note ? <p className="mt-2 text-sm text-guild-muted">{signup.note}</p> : null}
                  {canManage ? (
                    <select className="guild-input mt-2 min-h-9 text-sm" value={signup.status} onChange={(e) => void handleStatusChange(signup, e.target.value as SignupStatus)}>
                      {signupStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                  ) : null}
                </div>
              )) : <p className="text-sm text-guild-muted">暂无报名</p>}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
