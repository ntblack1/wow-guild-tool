import { describe, expect, it } from "vitest";
import { buildEventCalendar, eventCalendarFilename } from "../services/calendar";
import type { GuildEvent } from "../types";

const event = {
  id: "raid-1",
  title: "TOC+ZUG；开荒",
  raid_name: "TOC/ZUG",
  starts_at: "2026-07-17T20:00:00+08:00",
  description: "提前集合\n带好药水",
} as GuildEvent;

describe("event calendar", () => {
  it("builds a UTF-8 calendar event with a 30 minute reminder", () => {
    const contents = buildEventCalendar(event, "https://example.com/events/raid-1", new Date("2026-07-16T00:00:00Z"));

    expect(contents).toContain("DTSTART:20260717T120000Z");
    expect(contents).toContain("DTEND:20260717T150000Z");
    expect(contents).toContain("SUMMARY:八块腹肌｜TOC+ZUG；开荒");
    expect(contents).toContain("提前集合\\n带好药水\\n活动详情：https://example.com/events/raid-1");
    expect(contents).toContain("TRIGGER:-PT30M");
    expect(contents.endsWith("\r\n")).toBe(true);
  });

  it("creates a filesystem-safe Chinese filename", () => {
    expect(eventCalendarFilename(event)).toBe("八块腹肌-TOC-ZUG.ics");
  });

  it("rejects an invalid activity time", () => {
    expect(() => buildEventCalendar({ ...event, starts_at: "invalid" }, "https://example.com")).toThrow("活动时间无效");
  });
});
