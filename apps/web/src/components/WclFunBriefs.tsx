import { Crown, ExternalLink, Flame, Info, Medal, ShieldCheck, Skull, Swords, Users } from "lucide-react";
import { july2026WclDeathBoard, wclRaidBriefs } from "../data/wclRaidBriefs";
import { getWclMonthlyDeathStats, getWclRaidBriefStats } from "../services/wcl-raid-briefs";
import { GuildCard } from "./GuildCard";
import { SectionTitle } from "./SectionTitle";

function formatReportDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)} 月 ${Number(day)} 日`;
}

export function WclFunBriefs() {
  const monthlyStats = getWclMonthlyDeathStats(july2026WclDeathBoard.reports);
  const firstPlace = monthlyStats.firstPlace;
  const secondPlace = monthlyStats.secondPlace;

  return (
    <section className="space-y-3">
      <SectionTitle
        action={<span className="guild-pill shrink-0">数据来自 WCL</span>}
        eyebrow="MONTHLY WCL REPORT"
        title="本月战报"
      />

      <GuildCard className="overflow-hidden border-guild-gold/60 bg-[radial-gradient(circle_at_top_left,#FFE4B8,transparent_46%),linear-gradient(145deg,#FFF8EC,#FFFFFF_52%,#D7F0FF)] p-0">
        <article className="p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[0.16em] text-guild-ember">死亡次数月榜</p>
              <h3 className="mt-1 text-2xl font-black text-guild-ink">{july2026WclDeathBoard.monthLabel}</h3>
              <p className="mt-1 text-sm font-semibold text-guild-muted">
                以{july2026WclDeathBoard.characterName}参战的 {monthlyStats.reportCount} 份报告累计 · 共 {monthlyStats.totalDeaths} 次死亡
              </p>
            </div>
            <a className="inline-flex min-h-9 items-center gap-1 text-xs font-black text-guild-gold hover:text-guild-ember" href={july2026WclDeathBoard.characterUrl} rel="noreferrer" target="_blank">
              查看角色 WCL <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-2xl border border-amber-300/70 bg-amber-50/85 p-5 shadow-soft">
              <div className="flex items-center gap-2 text-sm font-black text-amber-700">
                <Crown className="h-5 w-5" /> 死亡第一名
              </div>
              <p className="mt-3 text-4xl font-black leading-tight text-guild-ink sm:text-5xl">{firstPlace?.names.join("、") ?? "无人"}</p>
              <p className="mt-2 text-xl font-black text-guild-ember">{firstPlace?.deaths ?? 0} 次死亡</p>
            </div>

            <div className="rounded-2xl border border-slate-300/80 bg-white/80 p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2 text-sm font-black text-slate-600">
                <Medal className="h-5 w-5" />
                <span>死亡第二名</span>
                {secondPlace && secondPlace.names.length > 1 ? <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs">{secondPlace.names.length} 人并列</span> : null}
              </div>
              <p className="mt-3 text-xl font-black leading-relaxed text-guild-ink sm:text-2xl">{secondPlace?.names.join("、") ?? "无人"}</p>
              <p className="mt-2 text-lg font-black text-slate-600">{secondPlace?.deaths ?? 0} 次死亡</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-guild-line/80 pt-4">
            {july2026WclDeathBoard.reports.map((report, index) => (
              <a className="guild-pill gap-1 hover:border-guild-gold hover:text-guild-gold" href={report.sourceUrl} key={report.id} rel="noreferrer" target="_blank">
                {formatReportDate(report.date)}{july2026WclDeathBoard.reports.filter((item) => item.date === report.date).length > 1
                  ? ` · 第 ${july2026WclDeathBoard.reports.filter((item, itemIndex) => item.date === report.date && itemIndex <= index).length} 份`
                  : ""}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </article>
      </GuildCard>

      <div className="flex gap-2 rounded-guild border border-guild-line bg-white/55 p-3 text-xs leading-5 text-guild-muted">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-guild-gold" />
        <p>
          “红度”是娱乐分：看首领击杀、已匹配工会成员零阵亡率和整团死亡数，不代表装备掉落运气。工会身份只按本网站角色或同日活动报名核对，没对上的人不乱认亲。
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {wclRaidBriefs.map((brief, index) => {
          const stats = getWclRaidBriefStats(brief);
          const raidDeathKing = stats.deathLeaders.length
            ? `${stats.deathLeaders.join("、")} · ${stats.topDeathCount} 死`
            : "全团零阵亡";
          const guildDeathKing = stats.guildDeathLeaders.length
            ? `${stats.guildDeathLeaders.join("、")} · ${stats.guildTopDeathCount} 死`
            : "无人，全员活着下班";

          return (
            <GuildCard
              className={index === 0 ? "overflow-hidden border-guild-gold/60 bg-[linear-gradient(145deg,#FFF0D6,#FFFFFF_58%,#BEE7FF)]" : "overflow-hidden"}
              key={brief.id}
            >
              <article>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-guild-muted">
                      {index === 0 ? <span className="rounded-full bg-guild-ember px-2 py-1 text-white">最新</span> : null}
                      <span>{formatReportDate(brief.date)}</span>
                      <span>·</span>
                      <span>{brief.sourceLabel}</span>
                    </div>
                    <h3 className="mt-2 text-xl font-black text-guild-ink">{brief.title}</h3>
                  </div>
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white bg-guild-panelSoft text-center shadow-soft">
                    <div>
                      <p className="text-2xl font-black leading-none text-guild-ember">{stats.rednessScore}</p>
                      <p className="mt-1 text-[10px] font-black text-guild-muted">{stats.rednessLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-white/70 p-3">
                    <Swords className="h-4 w-4 text-guild-gold" />
                    <p className="mt-2 text-xs font-bold text-guild-muted">首领击杀</p>
                    <p className="mt-0.5 font-black text-guild-ink">{brief.bossKills} 次</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <Users className="h-4 w-4 text-guild-sky" />
                    <p className="mt-2 text-xs font-bold text-guild-muted">已匹配工会成员</p>
                    <p className="mt-0.5 font-black text-guild-ink">{brief.guildMembers.length} 人</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <Skull className="h-4 w-4 text-guild-ember" />
                    <p className="mt-2 text-xs font-bold text-guild-muted">整团死亡王</p>
                    <p className="mt-0.5 font-black leading-5 text-guild-ink">{raidDeathKing}</p>
                  </div>
                  <div className="rounded-xl bg-white/70 p-3">
                    <ShieldCheck className="h-4 w-4 text-guild-mint" />
                    <p className="mt-2 text-xs font-bold text-guild-muted">工会死亡王</p>
                    <p className="mt-0.5 font-black leading-5 text-guild-ink">{guildDeathKing}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-black text-guild-muted">本次对上的自家人</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {brief.guildMembers.map((member) => (
                      <span className="guild-pill gap-1" key={member.name} title={member.matchNote}>
                        {member.deaths === 0 ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Skull className="h-3.5 w-3.5 text-guild-ember" />}
                        {member.name}{member.wclName ? `（WCL：${member.wclName}）` : ""} · {member.deaths} 死
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-guild-gold/25 bg-guild-panelSoft/65 p-3">
                  <div className="flex gap-2">
                    <Flame className="mt-0.5 h-4 w-4 shrink-0 text-guild-ember" />
                    <p className="text-sm font-bold leading-6 text-guild-ink">{brief.punchline}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-guild-line pt-3 text-xs text-guild-muted">
                  <span>整团共 {stats.totalDeaths} 次死亡 · 工会零死 {stats.guildSurvivors}/{brief.guildMembers.length}</span>
                  <a className="inline-flex min-h-9 items-center gap-1 font-black text-guild-gold hover:text-guild-ember" href={brief.sourceUrl} rel="noreferrer" target="_blank">
                    查看 WCL 死亡页 <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            </GuildCard>
          );
        })}
      </div>
    </section>
  );
}
