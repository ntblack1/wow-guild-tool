import { describe, expect, it } from "vitest";
import { july2026WclDeathBoard, wclRaidBriefs } from "../data/wclRaidBriefs";
import { getWclMonthlyDeathStats, getWclRaidBriefStats } from "../services/wcl-raid-briefs";

describe("WCL fun raid briefs", () => {
  it("aggregates all July reports and keeps every tied second-place player", () => {
    const stats = getWclMonthlyDeathStats(july2026WclDeathBoard.reports);

    expect(stats.reportCount).toBe(5);
    expect(stats.totalDeaths).toBe(30);
    expect(stats.participantWithDeathsCount).toBe(19);
    expect(stats.firstPlace).toEqual({ deaths: 3, names: ["东星小飘"], rank: 1 });
    expect(stats.secondPlace?.deaths).toBe(2);
    expect(stats.secondPlace?.names).toHaveLength(9);
    expect(stats.secondPlace?.names).toEqual(expect.arrayContaining([
      "安迪小鹜",
      "別说话灬吻我",
      "虫土土",
      "浮若梦生",
      "孤酌清风",
      "堇荼茹苡",
      "凌乱的发型",
      "麦兜小心",
      "梅林技师",
    ]));
  });

  it("uses distinct death totals as ranks instead of dropping ties", () => {
    const stats = getWclMonthlyDeathStats([
      {
        id: "sample",
        date: "2026-07-01",
        sourceUrl: "https://example.com",
        deathEntries: [
          { name: "甲", deaths: 3 },
          { name: "乙", deaths: 3 },
          { name: "丙", deaths: 2 },
        ],
      },
    ]);

    expect(stats.firstPlace).toEqual({ deaths: 3, names: ["甲", "乙"], rank: 1 });
    expect(stats.secondPlace).toEqual({ deaths: 2, names: ["丙"], rank: 2 });
  });

  it("finds tied raid death leaders and keeps the latest guild group death-free", () => {
    const stats = getWclRaidBriefStats(wclRaidBriefs[0]);

    expect(stats.deathLeaders).toEqual(["浮若梦生", "虫土土"]);
    expect(stats.topDeathCount).toBe(2);
    expect(stats.totalDeaths).toBe(13);
    expect(stats.guildDeathLeaders).toEqual([]);
    expect(stats.guildSurvivors).toBe(2);
    expect(stats.rednessLabel).toBe("红得发亮");
  });

  it("identifies the Ntblack report guild death leader without counting non-guild players", () => {
    const stats = getWclRaidBriefStats(wclRaidBriefs[1]);

    expect(stats.deathLeaders).toEqual(["开心小光头"]);
    expect(stats.totalDeaths).toBe(11);
    expect(stats.guildDeathLeaders).toEqual(["火的很蒂法"]);
    expect(stats.guildTopDeathCount).toBe(1);
    expect(stats.rednessScore).toBe(75);
  });
});
