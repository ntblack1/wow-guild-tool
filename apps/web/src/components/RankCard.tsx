import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { latestReportSummary } from "../services/reports";
import type { Report } from "../types";
import { GuildCard } from "./GuildCard";

type RankCardProps = {
  report: Report | null;
};

export function RankCard({ report }: RankCardProps) {
  const summary = latestReportSummary(report ? [report] : []);

  return (
    <GuildCard>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-guild-blueSoft text-guild-ink">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-guild-muted">最新战报</p>
          {report ? (
            <>
              <h3 className="mt-1 line-clamp-1 font-black text-guild-ink">{report.title}</h3>
              <p className="mt-2 text-sm text-guild-muted">红手：{summary.redStar} · 黑手：{summary.blackStar}</p>
              {report.quote ? <p className="mt-1 line-clamp-2 text-sm font-semibold text-guild-gold">“{report.quote}”</p> : null}
            </>
          ) : <h3 className="mt-1 font-black text-guild-ink">暂无副本战报</h3>}
          <Link className="mt-3 inline-flex text-xs font-bold text-guild-gold" to="/reports">查看战报 →</Link>
        </div>
      </div>
    </GuildCard>
  );
}
