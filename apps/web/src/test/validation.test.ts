import { describe, expect, it } from "vitest";
import { normalizeCommentBody, normalizeEventUpdate, normalizeNewEventInput, normalizePostInput, validateEventCapacityAgainstRoster } from "../services/validation";
import type { EventInput, PostInput } from "../types";

const eventInput: EventInput = {
  title: "TOC+ZUG",
  raid_name: "TOC+ZUG",
  starts_at: "2026-07-16T20:00:00+08:00",
  capacity: 25,
  description: " 20:00 集合 ",
  status: "open",
};

describe("web form validation", () => {
  it("normalizes a new activity before writing it", () => {
    const normalized = normalizeNewEventInput(eventInput, new Date("2026-07-16T12:00:00+08:00"));
    expect(normalized.raid_name).toBe("TOC+ZUG");
    expect(normalized.description).toBe("20:00 集合");
    expect(normalized.starts_at).toBe("2026-07-16T12:00:00.000Z");
  });

  it("rejects past activities and invalid raid sizes", () => {
    expect(() => normalizeNewEventInput(eventInput, new Date("2026-07-17T12:00:00+08:00"))).toThrow("不能早于");
    expect(() => normalizeNewEventInput({ ...eventInput, capacity: 41 }, new Date("2026-07-16T12:00:00+08:00"))).toThrow("1–40");
    expect(() => normalizeEventUpdate({ capacity: 0 })).toThrow("1–40");
  });

  it("trims forum content and rejects empty text", () => {
    const post = normalizePostInput({ title: "  开荒提醒  ", body: "  晚上集合  ", category: "开团通知" } as PostInput);
    expect(post).toEqual({ title: "开荒提醒", body: "晚上集合", category: "开团通知" });
    expect(() => normalizePostInput({ title: " ", body: "正文", category: "开团通知" })).toThrow("至少需要 2 个字");
    expect(() => normalizeCommentBody("   ")).toThrow("评论内容");
  });

  it("does not allow an activity capacity below its active roster", () => {
    expect(validateEventCapacityAgainstRoster(25, 20)).toBe(25);
    expect(() => validateEventCapacityAgainstRoster(19, 20)).toThrow("不能低于当前 20 名正式报名成员");
  });
});
