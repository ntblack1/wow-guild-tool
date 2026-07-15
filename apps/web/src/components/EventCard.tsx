import { CalendarClock, HeartPulse, Shield, Swords, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { eventRoleComposition, eventRoleNeeds, formatDateTime, statusLabel } from "../services/format";
import type { GuildEvent, Signup } from "../types";
import { StatusBadge } from "./StatusBadge";

type EventCardProps = {
  event: GuildEvent;
  signupCount?: number;
  roleNeed?: string;
  signups?: Signup[];
  prominent?: boolean;
};

const roleItems = [
  { key: "T", label: "T", icon: Shield, color: "text-sky-600" },
  { key: "N", label: "治疗", icon: HeartPulse, color: "text-emerald-600" },
  { key: "DPS", label: "DPS", icon: Swords, color: "text-rose-500" },
] as const;

export function EventCard({ event, signupCount = 0, roleNeed = "缺口待确认", signups, prominent = false }: EventCardProps) {
  const composition = eventRoleComposition(signups ?? [], event.capacity);
  const count = signups ? signups.length : signupCount;
  const need = signups ? eventRoleNeeds(signups, event.capacity) : roleNeed;

  return (
    <Link className={`guild-card block ${prominent ? "border-guild-gold/60 bg-[linear-gradient(135deg,#FFF0D6,#FFFFFF_60%,#BEE7FF)] shadow-soft" : ""}`} to={`/events/${event.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-guild-gold">{event.raid_name}</p>
          <h3 className="mt-1 text-lg font-black text-guild-ink">{event.title}</h3>
        </div>
        <StatusBadge>{statusLabel(event.status)}</StatusBadge>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-guild-muted">
        <span className="inline-flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-guild-gold" />
          {formatDateTime(event.starts_at)}
        </span>
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-guild-mint" />
          {count}/{event.capacity} 人 · {need}
        </span>
      </div>
      {signups ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {roleItems.map(({ key, label, icon: Icon, color }) => (
            <span className="flex min-w-0 items-center justify-center gap-1 rounded-md bg-white/75 px-2 py-2 text-xs font-bold" key={key}>
              <Icon className={`h-4 w-4 ${color}`} />
              {label} {composition.counts[key]}/{composition.targets[key]}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-guild-line/70">
        <div className="h-full rounded-full bg-guild-mint" style={{ width: `${signups ? composition.percent : Math.min(100, (count / event.capacity) * 100)}%` }} />
      </div>
      <span className="mt-4 inline-flex text-sm font-black text-guild-gold">{prominent ? "立即报名 →" : "立即查看并报名 →"}</span>
    </Link>
  );
}
