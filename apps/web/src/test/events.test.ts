import { cleanup, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { EventCard } from "../components/EventCard";
import { requireSupabase } from "../lib/supabase";
import { eventRosterSelect, listEvents, listHomepageEvents, localDayStartIso } from "../services/events";
import type { GuildEvent, Signup } from "../types";

vi.mock("../lib/supabase", () => ({ requireSupabase: vi.fn() }));

const mockedRequireSupabase = vi.mocked(requireSupabase);

describe("activity board helpers", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("uses local midnight so today's activities stay visible until the day ends", () => {
    const afternoon = new Date(2026, 6, 17, 22, 30, 0);

    expect(localDayStartIso(afternoon)).toBe(new Date(2026, 6, 17, 0, 0, 0).toISOString());
  });

  it("loads the event creator in the same homepage query", async () => {
    const returns = vi.fn().mockResolvedValue({ data: [], error: null });
    const chain = {
      select: vi.fn(),
      gte: vi.fn(),
      neq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(() => ({ returns })),
    };
    chain.select.mockReturnValue(chain);
    chain.gte.mockReturnValue(chain);
    chain.neq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    mockedRequireSupabase.mockReturnValue({ from: () => chain } as never);

    await listHomepageEvents(3);

    expect(chain.select).toHaveBeenCalledWith(eventRosterSelect);
    expect(eventRosterSelect).toContain("creator:profiles");
    expect(eventRosterSelect).toContain("signups(");
    expect(eventRosterSelect).toContain("character:characters(");
    expect(chain.limit).toHaveBeenCalledWith(3);
  });

  it("only loads unfinished activities from today onward", async () => {
    const returns = vi.fn().mockResolvedValue({ data: [], error: null });
    const chain = {
      select: vi.fn(),
      gte: vi.fn(),
      neq: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(() => ({ returns })),
    };
    chain.select.mockReturnValue(chain);
    chain.gte.mockReturnValue(chain);
    chain.neq.mockReturnValue(chain);
    chain.order.mockReturnValue(chain);
    mockedRequireSupabase.mockReturnValue({ from: () => chain } as never);

    await listEvents(20);

    expect(chain.gte).toHaveBeenCalledWith("starts_at", localDayStartIso());
    expect(chain.neq).toHaveBeenCalledWith("status", "finished");
    expect(chain.order).toHaveBeenCalledWith("starts_at", { ascending: true });
    expect(chain.order).toHaveBeenCalledWith("created_at", { referencedTable: "signups", ascending: true });
  });

  it("does not show a false zero signup count while the homepage roster is loading", () => {
    render(createElement(
      MemoryRouter,
      { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      createElement(EventCard, { event: {
          id: "raid-1",
          title: "TOC+ZUG",
          raid_name: "TOC+ZUG",
          starts_at: "2026-07-17T20:00:00+08:00",
          capacity: 25,
          description: null,
          status: "open",
          created_by: "member-1",
          created_at: "2026-07-16T20:00:00+08:00",
          updated_at: "2026-07-16T20:00:00+08:00",
        } }),
    ));

    expect(screen.getByText("阵容读取中")).toBeTruthy();
    expect(screen.queryByText("0/25 人 · 缺口待确认")).toBeNull();
  });

  it("uses the readable healing label beside member avatars", () => {
    const event = {
      id: "raid-1",
      title: "TOC+ZUG",
      raid_name: "TOC+ZUG",
      starts_at: "2026-07-17T20:00:00+08:00",
      capacity: 25,
      description: null,
      status: "open",
      created_by: "member-1",
      created_at: "2026-07-16T20:00:00+08:00",
      updated_at: "2026-07-16T20:00:00+08:00",
    } as GuildEvent;
    const signups = [{
      id: "signup-1",
      user_id: "member-1",
      combat_role: "N",
      status: "已报名",
      character: { name: "奶妈角色" },
    }] as Signup[];

    render(createElement(
      MemoryRouter,
      { future: { v7_startTransition: true, v7_relativeSplatPath: true } },
      createElement(EventCard, { event, signups }),
    ));

    expect(screen.getByText("奶妈角色").parentElement?.textContent).toContain("治疗");
  });
});
