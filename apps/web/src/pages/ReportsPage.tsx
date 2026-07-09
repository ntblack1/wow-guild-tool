import { Quote, ScrollText, Sparkles, Trophy } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { GuildCard } from "../components/GuildCard";
import { SectionTitle } from "../components/SectionTitle";

const reports = [
  {
    title: "小八播报：今晚战报待更新",
    content: "战报系统第一版先保留展示位，后续接入 Supabase reports 表记录红手、黑手、金句和活动关联。",
  },
];

export function ReportsPage() {
  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-guild-muted">副本记录室</p>
        <h1 className="text-3xl font-black text-guild-ink">副本战报</h1>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <GuildCard className="bg-guild-panelSoft/85">
          <Trophy className="h-6 w-6 text-guild-gold" />
          <p className="mt-3 text-xs font-bold text-guild-muted">今日红手</p>
          <h2 className="mt-1 text-xl font-black text-guild-ink">待揭晓</h2>
        </GuildCard>
        <GuildCard>
          <Sparkles className="h-6 w-6 text-guild-mint" />
          <p className="mt-3 text-xs font-bold text-guild-muted">今日黑手</p>
          <h2 className="mt-1 text-xl font-black text-guild-ink">先不点名</h2>
        </GuildCard>
        <GuildCard className="bg-guild-blueSoft/70">
          <Quote className="h-6 w-6 text-guild-ink" />
          <p className="mt-3 text-xs font-bold text-guild-muted">今日金句</p>
          <h2 className="mt-1 text-xl font-black text-guild-ink">“再来一把就过。”</h2>
        </GuildCard>
      </div>

      <section className="space-y-3">
        <SectionTitle eyebrow="Reports" title="历史战报" />
        {reports.length ? (
          reports.map((report) => (
            <GuildCard key={report.title}>
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-guild-gold shadow-sm">
                  <ScrollText className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-black text-guild-ink">{report.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-guild-muted">{report.content}</p>
                </div>
              </div>
            </GuildCard>
          ))
        ) : (
          <EmptyState title="暂无战报" description="第一场活动结束后，小八会在这里播报。" />
        )}
      </section>
    </section>
  );
}
