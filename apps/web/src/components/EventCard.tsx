import { CalendarClock, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime, statusLabel } from "../services/format";
import type { GuildEvent } from "../types";
import { StatusBadge } from "./StatusBadge";

type EventCardProps = {
  event: GuildEvent;
  signupCount?: number;
  roleNeed?: string;
};

export function EventCard({ event, signupCount = 0, roleNeed = "缺口待确认" }: EventCardProps) {
  return (
    <Link className="guild-card block" to={`/events/${event.id}`}>
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
          {signupCount}/{event.capacity} 人 · {roleNeed}
        </span>
      </div>
      <span className="mt-4 inline-flex rounded-full bg-guild-gold px-4 py-2 text-sm font-bold text-white shadow-soft">
        查看报名
      </span>
    </Link>
  );
}
