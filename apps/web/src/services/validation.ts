import { forumCategories, type EventInput, type PostInput } from "../types";

function requiredText(value: string, label: string, maxLength: number, minLength = 1) {
  const normalized = value.trim();
  if (normalized.length < minLength) throw new Error(`${label}至少需要 ${minLength} 个字。`);
  if (normalized.length > maxLength) throw new Error(`${label}最多 ${maxLength} 个字。`);
  return normalized;
}

export function normalizeNewEventInput(input: EventInput, now = new Date()): EventInput {
  const raidName = requiredText(input.raid_name, "活动名称", 40, 2);
  const startsAt = new Date(input.starts_at);
  if (Number.isNaN(startsAt.getTime())) throw new Error("请选择有效的开团时间。");
  if (startsAt.getTime() < now.getTime() - 60_000) throw new Error("开团时间不能早于当前时间。");
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 40) {
    throw new Error("活动人数需要填写 1–40 的整数。");
  }

  return {
    ...input,
    title: raidName,
    raid_name: raidName,
    starts_at: startsAt.toISOString(),
    description: input.description?.trim() || null,
  };
}

export function normalizeEventUpdate(input: Partial<EventInput>): Partial<EventInput> {
  const normalized = { ...input };
  if (input.raid_name !== undefined) normalized.raid_name = requiredText(input.raid_name, "活动名称", 40, 2);
  if (input.title !== undefined) normalized.title = requiredText(input.title, "活动标题", 40, 2);
  if (input.starts_at !== undefined) {
    const startsAt = new Date(input.starts_at);
    if (Number.isNaN(startsAt.getTime())) throw new Error("请选择有效的开团时间。");
    normalized.starts_at = startsAt.toISOString();
  }
  if (input.capacity !== undefined && (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 40)) {
    throw new Error("活动人数需要填写 1–40 的整数。");
  }
  if (input.description !== undefined) normalized.description = input.description?.trim() || null;
  return normalized;
}

export function normalizePostInput(input: PostInput): PostInput {
  if (!forumCategories.includes(input.category)) throw new Error("请选择有效的论坛板块。");
  return {
    title: requiredText(input.title, "帖子标题", 80, 2),
    body: requiredText(input.body, "帖子正文", 10000),
    category: input.category,
  };
}

export function normalizeCommentBody(body: string) {
  return requiredText(body, "评论内容", 2000);
}

export function validateEventCapacityAgainstRoster(capacity: number, activeSignupCount: number) {
  if (capacity < activeSignupCount) {
    throw new Error(`人数上限不能低于当前 ${activeSignupCount} 名正式报名成员。`);
  }
  return capacity;
}
