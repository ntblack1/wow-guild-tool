import type { WclMonthlyReport, WclRaidBrief } from "../data/wclRaidBriefs";

export type WclDeathRank = {
  deaths: number;
  names: string[];
  rank: number;
};

export function getWclMonthlyDeathStats(reports: WclMonthlyReport[]) {
  const totals = new Map<string, number>();

  reports.forEach((report) => {
    report.deathEntries.forEach((entry) => {
      totals.set(entry.name, (totals.get(entry.name) ?? 0) + entry.deaths);
    });
  });

  const ranking = [...totals.entries()]
    .map(([name, deaths]) => ({ name, deaths }))
    .sort((left, right) => right.deaths - left.deaths || left.name.localeCompare(right.name, "zh-CN"));
  const deathCounts = [...new Set(ranking.map((entry) => entry.deaths))];
  const topRanks: WclDeathRank[] = deathCounts.slice(0, 2).map((deaths, index) => ({
    deaths,
    names: ranking.filter((entry) => entry.deaths === deaths).map((entry) => entry.name),
    rank: index + 1,
  }));

  return {
    firstPlace: topRanks[0] ?? null,
    participantWithDeathsCount: ranking.length,
    ranking,
    reportCount: reports.length,
    secondPlace: topRanks[1] ?? null,
    totalDeaths: ranking.reduce((total, entry) => total + entry.deaths, 0),
  };
}

export function getWclRaidBriefStats(brief: WclRaidBrief) {
  const totalDeaths = brief.deathEntries.reduce((total, entry) => total + entry.deaths, 0);
  const topDeathCount = Math.max(0, ...brief.deathEntries.map((entry) => entry.deaths));
  const deathLeaders = brief.deathEntries
    .filter((entry) => entry.deaths === topDeathCount && topDeathCount > 0)
    .map((entry) => entry.name);
  const guildTopDeathCount = Math.max(0, ...brief.guildMembers.map((member) => member.deaths));
  const guildDeathLeaders = brief.guildMembers
    .filter((member) => member.deaths === guildTopDeathCount && guildTopDeathCount > 0)
    .map((member) => member.name);
  const guildSurvivors = brief.guildMembers.filter((member) => member.deaths === 0).length;
  const guildSurvivalRate = brief.guildMembers.length ? guildSurvivors / brief.guildMembers.length : 0;

  // 趣味分：首领击杀最多 70 分，已匹配工会成员零阵亡率 20 分，整团死亡控制最多 10 分。
  const rednessScore = Math.round(
    Math.min(70, brief.bossKills * 5)
      + guildSurvivalRate * 20
      + Math.max(0, 10 - totalDeaths / 2),
  );
  const rednessLabel = rednessScore >= 90 ? "红得发亮" : rednessScore >= 75 ? "有点红" : "继续攒人品";

  return {
    deathLeaders,
    guildDeathLeaders,
    guildSurvivors,
    guildTopDeathCount,
    rednessLabel,
    rednessScore,
    topDeathCount,
    totalDeaths,
  };
}
