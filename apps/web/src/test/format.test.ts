import { describe, expect, it } from "vitest";
import {
  describeSignupConflict,
  eventRoleComposition,
  eventRoleNeeds,
  groupSignupsByRole,
  isEventToday,
  nextEvent,
  sortPostsForForum,
  statusLabel,
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

  it("sorts forum posts with pinned posts first and hot posts by comment count", () => {
    const posts = [
      { id: "old", is_pinned: false, created_at: "2026-07-01T00:00:00Z", comment_count: 10 },
      { id: "new", is_pinned: false, created_at: "2026-07-02T00:00:00Z", comment_count: 1 },
      { id: "pin", is_pinned: true, created_at: "2026-06-01T00:00:00Z", comment_count: 0 },
    ] as Array<Post & { comment_count: number }>;

    expect(sortPostsForForum(posts, "最新").map((post) => post.id)).toEqual(["pin", "new", "old"]);
    expect(sortPostsForForum(posts, "热门").map((post) => post.id)).toEqual(["pin", "old", "new"]);
  });

  it("returns a friendly duplicate signup message", () => {
    expect(describeSignupConflict("duplicate key value violates unique constraint")).toBe(
      "这个角色已经报名过该活动。",
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
  });
});
