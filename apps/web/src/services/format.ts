import { eventFilters, forumCategories, type CombatRole, type EventFilter, type EventStatus, type ForumCategory, type ForumSortMode, type GuildEvent, type Post, type Signup, type UserRole } from "../types";

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const rosterRoleLabels: Record<CombatRole, string> = { T: "坦克", N: "治疗", DPS: "输出" };

export function buildRosterShareText(event: GuildEvent, signups: Signup[], url = "") {
  const active = signups.filter((signup) => signup.status !== "替补" && signup.status !== "请假");
  const lines = [
    `【八块腹肌工会】${event.title}`,
    `时间：${formatDateTime(event.starts_at)}`,
    `阵容：${active.length}/${event.capacity} 人`,
  ];

  for (const role of ["T", "N", "DPS"] as const) {
    const roleSignups = active.filter((signup) => signup.combat_role === role);
    lines.push("", `${rosterRoleLabels[role]}（${roleSignups.length}）`);
    if (!roleSignups.length) lines.push("- 待补");
    roleSignups.forEach((signup, index) => {
      const character = signup.character;
      const detail = [character?.class_name, character?.spec, signup.status].filter(Boolean).join(" · ");
      lines.push(`${index + 1}. ${character?.name ?? "未知角色"}${detail ? `｜${detail}` : ""}${signup.note ? `｜备注：${signup.note}` : ""}`);
    });
  }

  for (const status of ["替补", "请假"] as const) {
    const rows = signups.filter((signup) => signup.status === status);
    if (!rows.length) continue;
    lines.push("", `${status}（${rows.length}）`);
    rows.forEach((signup, index) => {
      lines.push(`${index + 1}. ${signup.character?.name ?? "未知角色"}${signup.note ? `｜备注：${signup.note}` : ""}`);
    });
  }

  if (url) lines.push("", `活动链接：${url}`);
  return lines.join("\n");
}

export function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function isEventToday(event: Pick<GuildEvent, "starts_at">, now = new Date()) {
  const date = new Date(event.starts_at);
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

export function nextEvent(events: GuildEvent[], now = new Date()) {
  return events.find((event) => event.status === "open" && new Date(event.starts_at).getTime() >= now.getTime()) ?? null;
}

export function eventsExcept(events: GuildEvent[], excluded?: Pick<GuildEvent, "id"> | null) {
  return excluded ? events.filter((event) => event.id !== excluded.id) : events;
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

export function isActiveRosterSignup(signup: Pick<Signup, "status">) {
  return signup.status !== "替补" && signup.status !== "请假";
}

export function eventSignupSummary(signups: Signup[]) {
  return {
    activeCount: signups.filter(isActiveRosterSignup).length,
    standbyCount: signups.filter((signup) => signup.status === "替补").length,
    leaveCount: signups.filter((signup) => signup.status === "请假").length,
  };
}

export function suggestedSignupStatus(signups: Signup[], capacity: number) {
  return eventSignupSummary(signups).activeCount >= capacity ? "替补" : "已报名";
}

export function eventRoleComposition(signups: Signup[], capacity: number) {
  const activeSignups = signups.filter(isActiveRosterSignup);
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

export function eventActionLabel(status: EventStatus, hasSignup: boolean) {
  if (hasSignup) return "查看我的报名 →";
  if (status === "open") return "立即报名 →";
  if (status === "finished") return "查看活动结果 →";
  return "查看当前阵容 →";
}

export function eventFilterFromValue(value: string | null): EventFilter {
  return eventFilters.includes(value as EventFilter) ? value as EventFilter : "全部";
}

export function eventViewSearch(filter: EventFilter) {
  if (filter === "全部") return "";
  return `?filter=${encodeURIComponent(filter)}`;
}

export function userRoleLabel(role: UserRole) {
  return {
    member: "普通成员",
    leader: "团长",
    admin: "管理员",
  }[role];
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

export function forumCategoryFromValue(value: string | null): ForumCategory | "全部" {
  return forumCategories.includes(value as ForumCategory) ? value as ForumCategory : "全部";
}

export function forumSortModeFromValue(value: string | null): ForumSortMode {
  return value === "热门" ? "热门" : "最新";
}

export function forumQueryFromValue(value: string | null) {
  return value?.trim().slice(0, 40) ?? "";
}

export function forumViewSearch(category: ForumCategory | "全部", sortMode: ForumSortMode, searchQuery = "") {
  const params = new URLSearchParams();
  if (category !== "全部") params.set("category", category);
  if (sortMode !== "最新") params.set("sort", sortMode);
  const normalizedQuery = forumQueryFromValue(searchQuery);
  if (normalizedQuery) params.set("q", normalizedQuery);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function describeSignupConflict(message: string) {
  if (/duplicate|unique|already|23505/i.test(message)) {
    return "你已经报名过该活动，无需重复报名。";
  }

  return "报名失败，请稍后再试。";
}
