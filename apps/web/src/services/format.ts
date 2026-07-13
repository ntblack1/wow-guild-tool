import type { CombatRole, ForumSortMode, Post, Signup } from "../types";

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function groupSignupsByRole(signups: Signup[]) {
  const grouped: Record<CombatRole, Signup[]> = {
    T: [],
    N: [],
    DPS: [],
  };

  for (const signup of signups) {
    grouped[signup.combat_role].push(signup);
  }

  return grouped;
}

export function eventRoleComposition(signups: Signup[], capacity: number) {
  const activeSignups = signups.filter((signup) => signup.status !== "请假");
  const grouped = groupSignupsByRole(activeSignups);
  const tankTarget = capacity <= 5 ? 1 : 2;
  const healerTarget = Math.max(1, Math.round(capacity * 0.2));
  const targets: Record<CombatRole, number> = {
    T: tankTarget,
    N: healerTarget,
    DPS: Math.max(1, capacity - tankTarget - healerTarget),
  };

  return {
    activeCount: activeSignups.length,
    counts: {
      T: grouped.T.length,
      N: grouped.N.length,
      DPS: grouped.DPS.length,
    },
    targets,
    percent: Math.min(100, Math.round((activeSignups.length / Math.max(1, capacity)) * 100)),
  };
}

export function statusLabel(value: string) {
  const labels: Record<string, string> = {
    draft: "草稿",
    open: "报名中",
    closed: "已锁定",
    finished: "已结束",
  };

  return labels[value] ?? value;
}

export function eventRoleNeeds(signups: Signup[], capacity = 4) {
  const { counts, targets } = eventRoleComposition(signups, capacity);
  const needs: string[] = [];

  if (counts.T < targets.T) needs.push("T");
  if (counts.N < targets.N) needs.push("治疗");
  if (counts.DPS < targets.DPS) needs.push("DPS");

  return needs.length ? `缺${needs.join(" / ")}` : "阵容已成型";
}

export function sortPostsForForum<T extends Post>(posts: T[], mode: ForumSortMode) {
  return [...posts].sort((left, right) => {
    if (left.is_pinned !== right.is_pinned) return left.is_pinned ? -1 : 1;
    if (mode === "热门") {
      const commentDelta = (right.comment_count ?? 0) - (left.comment_count ?? 0);
      if (commentDelta !== 0) return commentDelta;
    }
    return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
  });
}

export function describeSignupConflict(message: string) {
  if (/duplicate|unique|already|23505/i.test(message)) {
    return "这个角色已经报名过该活动。";
  }

  return "报名失败，请稍后再试。";
}
