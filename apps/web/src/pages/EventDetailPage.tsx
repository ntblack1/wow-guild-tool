import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Flag, HeartPulse, Lock, Pencil, Shield, Sparkles, Swords, Unlock, X } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CalendarDownloadButton } from "../components/CalendarDownloadButton";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { Field } from "../components/Field";
import { LoadingState } from "../components/LoadingState";
import { RosterCopyButton } from "../components/RosterCopyButton";
import { SectionTitle } from "../components/SectionTitle";
import { ShareButton } from "../components/ShareButton";
import { SignupEditor } from "../components/SignupEditor";
import { StatusBadge } from "../components/StatusBadge";
import { isSupabaseConfigured } from "../lib/supabase";
import { authPath, getCurrentUser } from "../services/auth";
import { listCharacters } from "../services/characters";
import { friendlyError } from "../services/errors";
import { getEvent, updateEvent } from "../services/events";
import { describeSignupConflict, eventRoleComposition, eventRoleNeeds, eventSignupSummary, formatEventDateTime, groupSignupsByRole, isActiveRosterSignup, statusLabel, suggestedSignupStatus, toDateTimeLocalValue } from "../services/format";
import { getProfile } from "../services/profiles";
import { createSignup, deleteSignup, listEventSignups, updateOwnSignup, updateSignupStatus } from "../services/signups";
import { validateEventCapacityAgainstRoster } from "../services/validation";
import { signupStatuses, type CombatRole, type EventInput, type EventStatus, type GuildCharacter, type GuildEvent, type Profile, type Signup, type SignupStatus } from "../types";

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
  const location = useLocation();
  const eventsHref = `/events${location.search}`;
  const [guildEvent, setGuildEvent] = useState<GuildEvent | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [characters, setCharacters] = useState<GuildCharacter[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [signupRole, setSignupRole] = useState<CombatRole>("DPS");
  const [signupNote, setSignupNote] = useState("");
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [editingSignup, setEditingSignup] = useState(false);
  const [editingEvent, setEditingEvent] = useState(false);
  const [eventInput, setEventInput] = useState<EventInput | null>(null);
  const [error, setError] = useState("");
  const canManage = profile?.role === "admin" || profile?.role === "leader";
  const canManageEvent = canManage || guildEvent?.created_by === userId;
  const grouped = useMemo(() => groupSignupsByRole(signups.filter(isActiveRosterSignup)), [signups]);
  const deferredSignups = useMemo(() => signups.filter((signup) => !isActiveRosterSignup(signup)), [signups]);
  const signupSummary = useMemo(() => eventSignupSummary(signups), [signups]);
  const composition = useMemo(
    () => eventRoleComposition(signups, guildEvent?.capacity ?? 1),
    [guildEvent?.capacity, signups],
  );
  const mySignup = signups.find((signup) => signup.user_id === userId) ?? null;
  const selectedCharacter = characters.find((character) => character.id === characterId) ?? null;
  const nextSignupStatus = suggestedSignupStatus(signups, guildEvent?.capacity ?? 1);

  async function refresh() {
    const [eventRow, signupRows, user] = await Promise.all([
      getEvent(eventId),
      listEventSignups(eventId),
      getCurrentUser(),
    ]);
    setGuildEvent(eventRow);
    setSignups(signupRows);
    setUserId(user?.id ?? "");
    if (user) {
      const [profileRow, rows] = await Promise.all([getProfile(user.id), listCharacters(user.id)]);
      setProfile(profileRow);
      setCharacters(rows);
      const nextCharacterId = rows.some((character) => character.id === characterId) ? characterId : rows[0]?.id ?? "";
      setCharacterId(nextCharacterId);
      setSignupRole(rows.find((character) => character.id === nextCharacterId)?.combat_role ?? "DPS");
    } else {
      setProfile(null);
      setCharacters([]);
      setCharacterId("");
    }
  }

  async function retryRefresh() {
    setError("");
    try {
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "读取活动详情失败，请稍后重试。"));
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured || !eventId) return;
    refresh()
      .catch((caught) => setError(friendlyError(caught, "读取活动详情失败，请稍后重试。")))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (guildEvent) document.title = `${guildEvent.title}｜八块腹肌工会活动`;
  }, [guildEvent]);

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
        combat_role: signupRole,
        note: signupNote.trim() || null,
        status: nextSignupStatus,
      });
      setSignupNote("");
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
      setConfirmingCancel(false);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "取消报名失败，请稍后重试。"));
    } finally {
      setSubmitting(false);
    }
  }

  function startEditingSignup() {
    if (!mySignup) return;
    setConfirmingCancel(false);
    setCharacterId(mySignup.character_id);
    setSignupRole(mySignup.combat_role);
    setSignupNote(mySignup.note ?? "");
    setEditingSignup(true);
  }

  async function handleUpdateMySignup() {
    if (!mySignup || !selectedCharacter || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await updateOwnSignup(mySignup.id, {
        character_id: selectedCharacter.id,
        combat_role: signupRole,
        note: signupNote.trim() || null,
      });
      setEditingSignup(false);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "修改报名失败，请确认活动仍在报名中后再试。"));
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
      setError(friendlyError(caught, "修改报名状态失败，请稍后重试。"));
    }
  }

  function startEditingEvent() {
    if (!guildEvent) return;
    setConfirmingFinish(false);
    setEventInput({
      title: guildEvent.title,
      raid_name: guildEvent.raid_name,
      starts_at: toDateTimeLocalValue(guildEvent.starts_at),
      capacity: guildEvent.capacity,
      description: guildEvent.description,
      status: guildEvent.status,
    });
    setEditingEvent(true);
  }

  async function handleUpdateEvent(eventSubmit: FormEvent) {
    eventSubmit.preventDefault();
    if (!eventInput || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      validateEventCapacityAgainstRoster(eventInput.capacity, signupSummary.activeCount);
      await updateEvent(eventId, {
        ...eventInput,
        title: eventInput.raid_name.trim(),
        raid_name: eventInput.raid_name.trim(),
      });
      setEditingEvent(false);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "修改活动失败，请稍后重试。"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEventStatus(status: EventStatus) {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await updateEvent(eventId, { status });
      setConfirmingFinish(false);
      await refresh();
    } catch (caught) {
      setError(friendlyError(caught, "修改活动状态失败，请稍后重试。"));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isSupabaseConfigured) return <ErrorState message="请先配置 Supabase 环境变量。" />;
  if (loading) return <LoadingState />;
  if (!guildEvent) return (
    <section className="space-y-4">
      <Link className="guild-button-secondary min-h-9 gap-1 px-3 py-1" to={eventsHref}>
        <ChevronLeft className="h-4 w-4" /> 返回活动列表
      </Link>
      <EmptyState title="活动不存在" description="这个活动可能已经被删除，请返回活动列表查看其他开团。" />
    </section>
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link className="guild-button-secondary min-h-9 gap-1 px-3 py-1" to={eventsHref}>
            <ChevronLeft className="h-4 w-4" /> 返回活动列表
          </Link>
          <ShareButton title={`${guildEvent.title}｜八块腹肌工会活动`} text={`${formatEventDateTime(guildEvent.starts_at)} 开团，点击查看阵容并报名。`} />
          {guildEvent.status !== "finished" ? <CalendarDownloadButton event={guildEvent} /> : null}
          <RosterCopyButton event={guildEvent} signups={signups} />
        </div>
        <nav aria-label="页面层级" className="flex min-w-0 items-center gap-1.5 text-xs font-bold text-guild-muted">
          <Link className="shrink-0 hover:text-guild-gold" to={eventsHref}>活动报名</Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-44 truncate text-guild-ink sm:max-w-80">{guildEvent.title}</span>
        </nav>
      </div>
      {error ? <ErrorState message={error} onRetry={retryRefresh} /> : null}
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
            {formatEventDateTime(guildEvent.starts_at)} · 上限 {guildEvent.capacity} 人 · {signupSummary.activeCount} 人占位 · {eventRoleNeeds(signups, guildEvent.capacity)}
            {signupSummary.standbyCount ? ` · 替补 ${signupSummary.standbyCount}` : ""}
            {signupSummary.leaveCount ? ` · 请假 ${signupSummary.leaveCount}` : ""}
          </p>
          <p className="mt-2 text-sm font-semibold text-guild-muted">发起人：{guildEvent.creator?.display_name ?? "工会成员"}</p>
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

      {canManageEvent ? (
        <section className="guild-card grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-guild-gold">活动管理</p>
              <h2 className="font-black text-guild-ink">管理我发起的活动</h2>
            </div>
            {!editingEvent && guildEvent.status !== "finished" ? <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" onClick={startEditingEvent} type="button"><Pencil className="h-3.5 w-3.5" /> 编辑信息</button> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {guildEvent.status === "open" ? <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" disabled={submitting} onClick={() => { setConfirmingFinish(false); void handleEventStatus("closed"); }} type="button"><Lock className="h-3.5 w-3.5" /> 锁定报名</button> : null}
            {guildEvent.status === "closed" || guildEvent.status === "draft" ? <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1" disabled={submitting} onClick={() => { setConfirmingFinish(false); void handleEventStatus("open"); }} type="button"><Unlock className="h-3.5 w-3.5" /> 开放报名</button> : null}
            {guildEvent.status !== "finished" && !confirmingFinish ? <button className="guild-button-secondary min-h-9 gap-1 px-3 py-1 text-rose-500" disabled={submitting} onClick={() => setConfirmingFinish(true)} type="button"><Flag className="h-3.5 w-3.5" /> 结束活动</button> : null}
          </div>
          {guildEvent.status === "finished" ? <p className="rounded-md border border-guild-line bg-guild-panelSoft p-3 text-sm font-bold text-guild-muted">活动已结束，报名阵容和分享链接仍可查看。</p> : null}
          {confirmingFinish ? (
            <div className="grid gap-3 rounded-md border border-rose-200 bg-rose-50/80 p-3">
              <div>
                <p className="font-black text-rose-700">确认结束这场活动？</p>
                <p className="mt-1 text-sm text-rose-600">结束后会停止报名，并立即从活动列表隐藏。</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="guild-button-secondary" disabled={submitting} onClick={() => setConfirmingFinish(false)} type="button">暂不结束</button>
                <button className="guild-button bg-rose-600" disabled={submitting} onClick={() => void handleEventStatus("finished")} type="button">{submitting ? "处理中" : "确认结束"}</button>
              </div>
            </div>
          ) : null}
          {editingEvent && eventInput ? (
            <form className="grid gap-3 border-t border-guild-line pt-3" onSubmit={handleUpdateEvent}>
              <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-guild-ink">编辑活动</h3><button className="inline-flex items-center gap-1 text-xs font-bold text-guild-muted" onClick={() => setEditingEvent(false)} type="button"><X className="h-3.5 w-3.5" /> 取消</button></div>
              <Field label="副本/活动名称"><input className="guild-input" maxLength={40} onChange={(event) => setEventInput({ ...eventInput, raid_name: event.target.value, title: event.target.value })} required value={eventInput.raid_name} /></Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="开团时间"><input className="guild-input" onChange={(event) => setEventInput({ ...eventInput, starts_at: event.target.value })} required type="datetime-local" value={eventInput.starts_at} /></Field>
                <Field label={`人数上限（不少于当前 ${signupSummary.activeCount} 人）`}><input className="guild-input" min={Math.max(1, signupSummary.activeCount)} max={40} onChange={(event) => setEventInput({ ...eventInput, capacity: Number(event.target.value) })} required type="number" value={eventInput.capacity} /></Field>
              </div>
              <Field label="活动说明（选填）"><textarea className="guild-input" maxLength={300} onChange={(event) => setEventInput({ ...eventInput, description: event.target.value })} rows={3} value={eventInput.description ?? ""} /></Field>
              <button className="guild-button" disabled={submitting || !eventInput.raid_name.trim()}>{submitting ? "保存中" : "保存活动修改"}</button>
            </form>
          ) : null}
        </section>
      ) : null}

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
            <Link className="guild-button text-center" to={authPath(`/events/${eventId}${location.search}`)}>去登录</Link>
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
                <CharacterAvatar avatarUrl={mySignup.character?.avatar_url} name={mySignup.character?.name ?? "我"} positionX={mySignup.character?.avatar_position_x} positionY={mySignup.character?.avatar_position_y} />
                <div>
                <p className="font-bold text-guild-ink">{mySignup.character?.name ?? "我的角色"}</p>
                <p className="mt-1 text-sm text-guild-muted">
                  {mySignup.character?.class_name} · {mySignup.character?.spec} · {roleTitles[mySignup.combat_role]}
                </p>
                </div>
              </div>
              <StatusBadge>{mySignup.status}</StatusBadge>
            </div>
            <p className={`mt-3 text-sm font-bold ${mySignup.status === "替补" || mySignup.status === "请假" ? "text-guild-muted" : "text-emerald-700"}`}>
              {mySignup.status === "替补" ? "你当前是替补，团长确认后会更新状态" : mySignup.status === "请假" ? "你已请假，本次不占正式名额" : "你已在本场活动阵容中"}
            </p>
            {mySignup.note ? <p className="mt-2 rounded-md bg-guild-panelSoft px-3 py-2 text-sm text-guild-muted">备注：{mySignup.note}</p> : null}
            {editingSignup ? (
              <div className="mt-4 grid gap-3 border-t border-guild-line pt-4">
                <SignupEditor
                  characterId={characterId}
                  characters={characters}
                  combatRole={signupRole}
                  hint={`报名状态“${mySignup.status}”会保持不变，不会重新排队。`}
                  note={signupNote}
                  onCharacterSelect={(character) => { setCharacterId(character.id); setSignupRole(character.combat_role); }}
                  onCombatRoleChange={setSignupRole}
                  onNoteChange={setSignupNote}
                  onSubmit={() => void handleUpdateMySignup()}
                  submitLabel={`保存修改 · ${selectedCharacter?.name ?? "我的角色"}`}
                  submitting={submitting}
                />
                <button className="guild-button-secondary" disabled={submitting} onClick={() => setEditingSignup(false)} type="button">放弃修改</button>
              </div>
            ) : confirmingCancel ? (
              <div className="mt-3 grid gap-2 rounded-md border border-rose-200 bg-rose-50/80 p-3">
                <p className="text-sm font-bold text-rose-600">确定取消本场报名吗？取消后席位可能被其他成员补上。</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="guild-button min-h-9 bg-rose-500 px-3 py-1 hover:bg-rose-600" disabled={submitting} onClick={() => void handleCancelSignup()} type="button">
                    {submitting ? "取消中" : "确认取消"}
                  </button>
                  <button className="guild-button-secondary min-h-9 px-3 py-1" disabled={submitting} onClick={() => setConfirmingCancel(false)} type="button">保留报名</button>
                </div>
              </div>
            ) : (
              <div className={`mt-3 grid gap-2 ${guildEvent.status === "open" ? "grid-cols-2" : ""}`}>
                {guildEvent.status === "open" ? <button className="guild-button-secondary min-h-9" disabled={submitting} onClick={startEditingSignup} type="button"><Pencil className="h-3.5 w-3.5" /> 修改报名</button> : null}
                <button className="guild-button-secondary min-h-9 text-rose-500" disabled={submitting} onClick={() => setConfirmingCancel(true)} type="button">取消报名</button>
              </div>
            )}
          </div>
        ) : guildEvent.status !== "open" ? (
          <div className="mt-4 rounded-md border border-guild-line bg-white/75 p-4 text-center">
            <Lock className="mx-auto h-5 w-5 text-guild-gold" />
            <p className="mt-2 font-black text-guild-ink">当前活动已停止报名</p>
            <p className="mt-1 text-sm text-guild-muted">活动发起人重新开放后即可报名。</p>
          </div>
        ) : (
          <div className="mt-4">
            <SignupEditor
              characterId={characterId}
              characters={characters}
              combatRole={signupRole}
              hint={nextSignupStatus === "替补" ? "正式名额已满，本次报名将自动进入替补。" : "报名后可以修改或取消，团长会在阵容中确认状态。"}
              note={signupNote}
              onCharacterSelect={(character) => { setCharacterId(character.id); setSignupRole(character.combat_role); }}
              onCombatRoleChange={setSignupRole}
              onNoteChange={setSignupNote}
              onSubmit={() => void handleSignup()}
              submitLabel={selectedCharacter ? `${nextSignupStatus === "替补" ? "报名替补" : "确认报名"} · ${selectedCharacter.name}` : "确认报名"}
              submitting={submitting}
            />
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
                      <CharacterAvatar avatarUrl={signup.character?.avatar_url} className="h-8 w-8" name={signup.character?.name ?? "未"} positionX={signup.character?.avatar_position_x} positionY={signup.character?.avatar_position_y} />
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
      {deferredSignups.length ? (
        <section className="guild-card">
          <SectionTitle title={`替补与请假 ${deferredSignups.length} 人`} />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {deferredSignups.map((signup) => (
              <div className="rounded-md bg-white/70 p-3" key={signup.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <CharacterAvatar avatarUrl={signup.character?.avatar_url} className="h-8 w-8" name={signup.character?.name ?? "未"} positionX={signup.character?.avatar_position_x} positionY={signup.character?.avatar_position_y} />
                    <span className="truncate font-semibold text-guild-ink">{signup.character?.name ?? "未知角色"}</span>
                  </div>
                  <StatusBadge>{signup.status}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-guild-muted">{signup.character?.class_name ?? "未知职业"} · {roleTitles[signup.combat_role]}</p>
                {signup.note ? <p className="mt-2 text-sm text-guild-muted">{signup.note}</p> : null}
                {canManage ? (
                  <select className="guild-input mt-2 min-h-9 text-sm" value={signup.status} onChange={(event) => void handleStatusChange(signup, event.target.value as SignupStatus)}>
                    {signupStatuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
