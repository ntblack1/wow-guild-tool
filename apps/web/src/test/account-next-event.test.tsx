import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthPage } from "../pages/AuthPage";

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");
  return {
    ...actual,
    getCurrentUser: vi.fn().mockResolvedValue({ id: "member-1", displayName: "小黑娃", username: "xiaoheiwa" }),
  };
});
vi.mock("../services/profiles", () => ({ getProfile: vi.fn().mockResolvedValue({ role: "member" }) }));
vi.mock("../services/signups", () => ({
  getMyNextSignup: vi.fn().mockResolvedValue({
    id: "signup-1",
    event_id: "event-1",
    character_id: "character-1",
    user_id: "member-1",
    combat_role: "N",
    note: null,
    status: "已确认",
    created_at: "2026-07-16T10:00:00+08:00",
    updated_at: "2026-07-16T10:00:00+08:00",
    character: {
      id: "character-1",
      name: "奶遍全团",
      class_name: "牧师",
      spec: "神圣",
      combat_role: "N",
      avatar_url: null,
      avatar_position_x: 50,
      avatar_position_y: 50,
    },
    event: {
      id: "event-1",
      title: "TOC+ZUG",
      raid_name: "TOC+ZUG",
      starts_at: "2026-07-18T20:00:00+08:00",
      capacity: 25,
      status: "open",
    },
  }),
}));

afterEach(cleanup);

describe("account activity summary", () => {
  it("shows the signed-in member's next raid and links to its roster", async () => {
    render(<MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}><AuthPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole("heading", { name: "我的下一场" })).toBeTruthy());
    const eventLink = screen.getByRole("link", { name: /TOC\+ZUG/ });
    expect(eventLink.getAttribute("href")).toBe("/events/event-1");
    expect(eventLink.textContent).toContain("奶遍全团");
    expect(eventLink.textContent).toContain("已确认");
  });
});
