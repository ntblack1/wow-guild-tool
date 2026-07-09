import { Megaphone } from "lucide-react";
import { GuildCard } from "./GuildCard";

export function NoticeCard() {
  return (
    <GuildCard className="bg-guild-panelSoft/85">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-guild-gold shadow-sm">
          <Megaphone className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold text-guild-muted">今日公告</p>
          <h3 className="mt-1 font-black text-guild-ink">晚上活动前记得修装、带药水和好心情。</h3>
        </div>
      </div>
    </GuildCard>
  );
}
