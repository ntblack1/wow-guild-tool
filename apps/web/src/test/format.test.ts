import { describe, expect, it } from "vitest";
import {
  eventsExcept,
  buildRosterShareText,
  describeSignupConflict,
  eventActionLabel,
  eventFilterFromValue,
  eventRoleComposition,
  eventRoleNeeds,
  eventSignupSummary,
  eventViewSearch,
  forumCategoryFromValue,
  forumQueryFromValue,
  forumSortModeFromValue,
  forumViewSearch,
  groupSignupsByRole,
  isEventToday,
  nextEvent,
  sortPostsForForum,
  statusLabel,
  suggestedSignupStatus,
  toDateTimeLocalValue,
  userRoleLabel,
} from "../services/format";
import type { GuildEvent, Post, Signup } from "../types";

describe("format helpers", () => {
  it("groups signups by combat role", () => {
    const signups = [
      { id: "1", combat_role: "T" },
      { id: "2", combat_role: "N" },
      { id: "3", combat_role: "DPS" },
      { id: "4", combat_role: "DPS" },
    ] as Signup[];

    const grouped = groupSignupsByRole(signups);

    expect(grouped.T).toHaveLength(1);
    expect(grouped.N).toHaveLength(1);
    expect(grouped.DPS).toHaveLength(2);
  });

  it("returns readable event status labels", () => {
    expect(statusLabel("draft")).toBe("草稿");
    expect(statusLabel("open")).toBe("报名中");
    expect(statusLabel("closed")).toBe("已锁定");
    expect(statusLabel("finished")).toBe("已结束");
    expect(statusLabel("unknown")).toBe("unknown");
  });

  it("uses accurate activity card actions and preserves activity filters", () => {
    expect(eventActionLabel("open", false)).toBe("立即报名 →");
    expect(eventActionLabel("closed", false)).toBe("查看当前阵容 →");
    expect(eventActionLabel("finished", false)).toBe("查看活动结果 →");
    expect(eventActionLabel("finished", true)).toBe("查看我的报名 →");
    expect(eventFilterFromValue("我的报名")).toBe("我的报名");
    expect(eventFilterFromValue("unknown")).toBe("全部");
    expect(eventViewSearch("我的报名")).toBe("?filter=%E6%88%91%E7%9A%84%E6%8A%A5%E5%90%8D");
  });

  it("returns readable guild permission labels", () => {
    expect(userRoleLabel("member")).toBe("普通成员");
    expect(userRoleLabel("leader")).toBe("团长");
    expect(userRoleLabel("admin")).toBe("管理员");
  });

  it("describes simple roster needs from current signups", () => {
    const signups = [
      { id: "1", combat_role: "T" },
      { id: "2", combat_role: "DPS" },
      { id: "3", combat_role: "DPS" },
    ] as Signup[];

    expect(eventRoleNeeds(signups)).toBe("缺治疗");
    expect(eventRoleNeeds([...signups, { id: "4", combat_role: "N" } as Signup])).toBe("阵容已成型");
  });

  it("calculates role targets and ignores leave signups in composition", () => {
    const signups = [
      { id: "1", combat_role: "T", status: "已报名" },
      { id: "2", combat_role: "N", status: "请假" },
      { id: "3", combat_role: "DPS", status: "已确认" },
    ] as Signup[];

    expect(eventRoleComposition(signups, 10)).toEqual({
      activeCount: 2,
      counts: { T: 1, N: 0, DPS: 1 },
      targets: { T: 2, N: 2, DPS: 6 },
      percent: 20,
    });
  });

  it("keeps standby and leave signups outside the formal roster", () => {
    const signups = [
      { id: "1", combat_role: "T", status: "已确认" },
      { id: "2", combat_role: "N", status: "替补" },
      { id: "3", combat_role: "DPS", status: "请假" },
    ] as Signup[];

    expect(eventSignupSummary(signups)).toEqual({ activeCount: 1, standbyCount: 1, leaveCount: 1 });
    expect(suggestedSignupStatus(signups, 1)).toBe("替补");
    expect(eventRoleComposition(signups, 5).counts).toEqual({ T: 1, N: 0, DPS: 0 });
  });

  it("sorts forum posts with pinned posts first and hot posts by comment count", () => {
    const posts = [
      { id: "old", is_pinned: false, created_at: "2026-07-01T00:00:00Z", comment_count: 10 },
      { id: "new", is_pinned: false, created_at: "2026-07-02T00:00:00Z", comment_count: 1 },
      { id: "pin", is_pinned: true, created_at: "2026-06-01T00:00:00Z", comment_count: 0 },
    ] as Array<Post & { comment_count: number }>;

    expect(sortPostsForForum(posts, "最新").map((post) => post.id)).toEqual(["pin", "new", "old"]);
    expect(sortPostsForForum(posts, "热门").map((post) => post.id)).toEqual(["pin", "old", "new"]);
  });

  it("keeps valid forum filters in a compact query string", () => {
    expect(forumCategoryFromValue("副本攻略")).toBe("副本攻略");
    expect(forumSortModeFromValue("热门")).toBe("热门");
    expect(forumQueryFromValue("  TOC 攻略  ")).toBe("TOC 攻略");
    expect(forumViewSearch("副本攻略", "热门", "TOC 攻略")).toBe("?category=%E5%89%AF%E6%9C%AC%E6%94%BB%E7%95%A5&sort=%E7%83%AD%E9%97%A8&q=TOC+%E6%94%BB%E7%95%A5");
  });

  it("falls back safely for unknown forum filters", () => {
    expect(forumCategoryFromValue("unknown")).toBe("全部");
    expect(forumSortModeFromValue("unknown")).toBe("最新");
    expect(forumQueryFromValue(" ")).toBe("");
    expect(forumViewSearch("全部", "最新")).toBe("");
  });

  it("returns a friendly duplicate signup message", () => {
    expect(describeSignupConflict("duplicate key value violates unique constraint")).toBe(
      "你已经报名过该活动，无需重复报名。",
    );
    expect(describeSignupConflict("network failed")).toBe("报名失败，请稍后再试。");
  });

  it("finds today's activity and the next open activity", () => {
    const now = new Date("2026-07-15T12:00:00+08:00");
    const events = [
      { id: "past", starts_at: "2026-07-14T20:00:00+08:00", status: "open" },
      { id: "today", starts_at: "2026-07-15T20:00:00+08:00", status: "open" },
      { id: "later", starts_at: "2026-07-16T20:00:00+08:00", status: "open" },
    ] as GuildEvent[];

    expect(isEventToday(events[1]!, now)).toBe(true);
    expect(isEventToday(events[0]!, now)).toBe(false);
    expect(nextEvent(events, now)?.id).toBe("today");
    expect(eventsExcept(events, events[1]).map((event) => event.id)).toEqual(["past", "later"]);
    expect(eventsExcept(events, null)).toEqual(events);
  });

  it("formats an event time for a datetime-local editor", () => {
    const value = "2026-07-16T12:00:00.000Z";
    const expected = new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    expect(toDateTimeLocalValue(value)).toBe(expected);
  });

  it("builds a WeChat-ready roster grouped by role and signup status", () => {
    const event = {
      title: "TOC+ZUG",
      starts_at: "2026-07-16T20:00:00+08:00",
      capacity: 25,
    } as GuildEvent;
    const signups = [
      { combat_role: "T", status: "已确认", note: "主坦", character: { name: "灰烬之心", class_name: "圣骑士", spec: "防护" } },
      { combat_role: "N", status: "已报名", character: { name: "清风袭人", class_name: "牧师", spec: "神圣" } },
      { combat_role: "DPS", status: "替补", character: { name: "火的很蒂法" } },
      { combat_role: "DPS", status: "请假", note: "今晚加班", character: { name: "小黑娃" } },
    ] as Signup[];

    const text = buildRosterShareText(event, signups, "https://example.com/events/1");

    expect(text).toContain("【八块腹肌工会】TOC+ZUG");
    expect(text).toContain("坦克（1）");
    expect(text).toContain("灰烬之心｜圣骑士 · 防护 · 已确认｜备注：主坦");
    expect(text).toContain("输出（0）\n- 待补");
    expect(text).toContain("替补（1）\n1. 火的很蒂法");
    expect(text).toContain("请假（1）\n1. 小黑娃｜备注：今晚加班");
    expect(text).toContain("活动链接：https://example.com/events/1");
  });
});
