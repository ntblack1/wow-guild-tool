import { describe, expect, it } from "vitest";
import { latestReportSummary } from "../services/reports";
import type { Report } from "../types";

describe("raid report helpers", () => {
  it("uses the latest report for the red hand, black hand, and quote summary", () => {
    const reports = [{ red_star: "小黑娃", black_star: "老冻人民", quote: "说这些" }] as Report[];

    expect(latestReportSummary(reports)).toEqual({
      redStar: "小黑娃",
      blackStar: "老冻人民",
      quote: "说这些",
    });
  });

  it("shows useful placeholders before the first report", () => {
    expect(latestReportSummary([])).toEqual({
      redStar: "待揭晓",
      blackStar: "先不点名",
      quote: "再来一把就过。",
    });
  });
});
