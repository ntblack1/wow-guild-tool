import type { GuildEvent } from "../types";

const raidDurationMs = 3 * 60 * 60 * 1000;

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function formatIcsDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function eventCalendarFilename(event: Pick<GuildEvent, "raid_name">) {
  const safeName = event.raid_name.replace(/[\\/:*?"<>|]+/g, "-").trim() || "工会活动";
  return `八块腹肌-${safeName}.ics`;
}

export function buildEventCalendar(
  event: Pick<GuildEvent, "id" | "title" | "raid_name" | "starts_at" | "description">,
  eventUrl: string,
  now = new Date(),
) {
  const startsAt = new Date(event.starts_at);
  if (Number.isNaN(startsAt.getTime())) throw new Error("活动时间无效，暂时无法加入日历。");
  const endsAt = new Date(startsAt.getTime() + raidDurationMs);
  const description = [event.description?.trim(), `活动详情：${eventUrl}`].filter(Boolean).join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//八块腹肌工会//活动日历//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.id)}@wow-guild-tool.pages.dev`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(startsAt)}`,
    `DTEND:${formatIcsDate(endsAt)}`,
    `SUMMARY:${escapeIcsText(`八块腹肌｜${event.title}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `URL:${eventUrl}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:八块腹肌工会活动将在 30 分钟后开始",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadEventCalendar(event: GuildEvent, eventUrl = window.location.href) {
  const contents = buildEventCalendar(event, eventUrl);
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = eventCalendarFilename(event);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
