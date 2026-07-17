import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EventDetailPage } from "../pages/EventDetailPage";
import type { GuildEvent } from "../types";

const mocks = vi.hoisted(() => {
  const characters = [
    { id: "character-1", user_id: "member-1", name: "神圣牧师", class_name: "牧师", spec: "神圣", combat_role: "N", item_level: 245, note: null, avatar_url: null, avatar_position_x: 50, avatar_position_y: 50, created_at: "", updated_at: "" },
    { id: "character-2", user_id: "member-1", name: "备用坦克", class_name: "圣骑士", spec: "防护", combat_role: "T", item_level: 242, note: null, avatar_url: null, avatar_position_x: 50, avatar_position_y: 50, created_at: "", updated_at: "" },
  ];
  const signup = {
    id: "signup-1",
    event_id: "event-1",
    character_id: "character-1",
    user_id: "member-1",
    combat_role: "N",
    note: "主治疗",
    status: "已确认",
    created_at: "",
    updated_at: "",
    character: characters[0],
  };
  return { characters, signup, updateOwnSignup: vi.fn(), listEventSignups: vi.fn() };
});

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");
  return { ...actual, getCurrentUser: vi.fn().mockResolvedValue({ id: "member-1", displayName: "治疗一号", username: "healer" }) };
});
vi.mock("../services/events", () => ({
  getEvent: vi.fn().mockResolvedValue({
    id: "event-1",
    title: "TOC+ZUG",
    raid_name: "TOC+ZUG",
    starts_at: "2026-07-18T20:00:00+08:00",
    capacity: 25,
    description: null,
    status: "open",
    created_by: "leader-1",
    created_at: "2026-07-16T12:00:00+08:00",
    updated_at: "2026-07-16T12:00:00+08:00",
  } satisfies GuildEvent),
  updateEvent: vi.fn(),
}));

vi.mock("../services/characters", () => ({ listCharacters: vi.fn().mockResolvedValue(mocks.characters) }));
vi.mock("../services/profiles", () => ({ getProfile: vi.fn().mockResolvedValue({ id: "member-1", role: "member" }) }));
vi.mock("../services/signups", () => ({
  createSignup: vi.fn(),
  deleteSignup: vi.fn(),
  listEventSignups: mocks.listEventSignups,
  updateOwnSignup: mocks.updateOwnSignup,
  updateSignupStatus: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listEventSignups.mockResolvedValue([mocks.signup]);
  mocks.updateOwnSignup.mockResolvedValue(mocks.signup);
});

afterEach(cleanup);

describe("member signup editing", () => {
  it("lets a member switch their own character without changing confirmation status", async () => {
    render(
      <MemoryRouter initialEntries={["/events/event-1"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes><Route path="/events/:eventId" element={<EventDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("button", { name: "修改报名" });
    fireEvent.click(screen.getByRole("button", { name: "修改报名" }));
    expect(screen.getByText(/报名状态“已确认”会保持不变/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /备用坦克/ }));
    fireEvent.click(screen.getByRole("button", { name: "保存修改 · 备用坦克" }));

    await waitFor(() => expect(mocks.updateOwnSignup).toHaveBeenCalledWith("signup-1", {
      character_id: "character-2",
      combat_role: "T",
      note: "主治疗",
    }));
  });
});
