import { CalendarClock, HeartPulse, Shield, Swords, UserRound, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { eventActionLabel, eventRoleComposition, eventRoleNeeds, eventSignupSummary, formatDateTime, statusLabel } from "../services/format";
import type { GuildEvent, Signup } from "../types";
import { CharacterAvatar } from "./CharacterAvatar";
import { StatusBadge } from "./StatusBadge";

type EventCardProps = {
  event: GuildEvent;
  signupCount?: number;
  roleNeed?: string;
  signups?: Signup[];
  prominent?: boolean;
  currentUserId?: string;
  search?: string;
};

const roleItems = [
  { key: "T", label: "T", icon: Shield, color: "text-sky-600" },
  { key: "N", label: "治疗", icon: HeartPulse, color: "text-emerald-600" },
  { key: "DPS", label: "DPS", icon: Swords, color: "text-rose-500" },
] as const;

const signupRoleLabels = { T: "T", N: "治疗", DPS: "DPS" } as const;

export function EventCard({ event, signupCount, roleNeed = "缺口待确认", signups, prominent = false, currentUserId, search = "" }: EventCardProps) {
  const composition = eventRoleComposition(signups ?? [], event.capacity);
  const summary = eventSignupSummary(signups ?? []);
  const rosterKnown = signups !== undefined || signupCount !== undefined;
  const count = signups ? summary.activeCount : signupCount ?? 0;
  const need = signups ? eventRoleNeeds(signups, event.capacity) : roleNeed;
  const mySignup = signups?.find((signup) => signup.user_id === currentUserId);

  return (
    <Link className={`guild-card block ${prominent ? "border-guild-gold/60 bg-[linear-gradient(135deg,#FFF0D6,#FFFFFF_60%,#BEE7FF)] shadow-soft" : ""}`} to={{ pathname: `/events/${event.id}`, search }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-guild-gold">{event.raid_name}</p>
          <h3 className="mt-1 text-lg font-black text-guild-ink">{event.title}</h3>
        </div>
        <StatusBadge>{statusLabel(event.status)}</StatusBadge>
      </div>
      {mySignup ? (
        <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-bold text-emerald-700">
          <CharacterAvatar avatarUrl={mySignup.character?.avatar_url} className="h-7 w-7" name={mySignup.character?.name ?? "我"} positionX={mySignup.character?.avatar_position_x} positionY={mySignup.character?.avatar_position_y} />
          <span className="min-w-0 truncate">我的报名：{mySignup.character?.name ?? "我的角色"} · {mySignup.status}</span>
        </div>
      ) : null}
      <div className="mt-4 grid gap-2 text-sm text-guild-muted">
        <span className="inline-flex items-center gap-2">
          <UserRound className="h-4 w-4 text-guild-gold" />
          发起人：{event.creator?.display_name ?? "工会成员"}
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-guild-gold" />
          {formatDateTime(event.starts_at)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-guild-mint" />
          {rosterKnown ? `${count}/${event.capacity} 人 · ${need}` : "阵容读取中"}
          {signups && summary.standbyCount ? ` · 替补 ${summary.standbyCount}` : ""}
          {signups && summary.leaveCount ? ` · 请假 ${summary.leaveCount}` : ""}
        </span>
      </div>
      {signups ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {roleItems.map(({ key, label, icon: Icon, color }) => (
              <span className="flex min-w-0 items-center justify-center gap-1 rounded-md bg-white/75 px-2 py-2 text-xs font-bold" key={key}>
                <Icon className={`h-4 w-4 ${color}`} />
                {label} {composition.counts[key]}/{composition.targets[key]}
              </span>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-white/80 bg-white/65 p-3">
            <p className="text-xs font-black text-guild-muted">已报名成员</p>
            {signups.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {signups.slice(0, 10).map((signup) => {
                  const character = signup.character;
                  return (
                    <span className={`flex min-w-0 items-center gap-2 rounded-full border border-guild-line bg-white/90 py-1 pl-1 pr-3 ${signup.status === "请假" ? "opacity-55" : ""}`} key={signup.id}>
                      <CharacterAvatar avatarUrl={character?.avatar_url} className="h-8 w-8" name={character?.name ?? "未"} positionX={character?.avatar_position_x} positionY={character?.avatar_position_y} />
                      <span className="max-w-28 truncate text-xs font-black text-guild-ink">{character?.name ?? "未知角色"}</span>
                      <span className="text-[11px] font-bold text-guild-muted">{signup.status === "替补" || signup.status === "请假" ? signup.status : signupRoleLabels[signup.combat_role]}</span>
                    </span>
                  );
                })}
                {signups.length > 10 ? <span className="guild-pill">还有 {signups.length - 10} 人</span> : null}
              </div>
            ) : <p className="mt-2 text-sm text-guild-muted">暂时没人报名，来坐第一把交椅。</p>}
          </div>
        </>
      ) : null}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-guild-line/70">
        <div
          className={`h-full rounded-full bg-guild-mint ${rosterKnown ? "" : "animate-pulse"}`}
          style={{ width: rosterKnown ? `${signups ? composition.percent : Math.min(100, (count / event.capacity) * 100)}%` : "24%" }}
        />
      </div>
      <span className="mt-4 inline-flex text-sm font-black text-guild-gold">{eventActionLabel(event.status, Boolean(mySignup))}</span>
    </Link>
  );
}
