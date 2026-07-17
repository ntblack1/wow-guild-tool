import { describe, expect, it } from "vitest";
import { wclRaidBriefs } from "../data/wclRaidBriefs";
import { getWclRaidBriefStats } from "../services/wcl-raid-briefs";

describe("WCL fun raid briefs", () => {
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
