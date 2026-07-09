import { Sparkles } from "lucide-react";
import { GuildCard } from "./GuildCard";

export function RankCard() {
  return (
    <GuildCard>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-guild-blueSoft text-guild-ink">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-bold text-guild-muted">今日黑红榜</p>
          <h3 className="mt-1 font-black text-guild-ink">红手：待揭晓 · 黑手：先不点名</h3>
          <p className="mt-2 text-sm text-guild-muted">战报系统会在后续记录掉落、名场面和今日金句。</p>
        </div>
      </div>
    </GuildCard>
  );
}
