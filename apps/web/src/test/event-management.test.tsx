import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EventDetailPage } from "../pages/EventDetailPage";
import type { GuildEvent } from "../types";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");
  return { ...actual, getCurrentUser: mocks.getCurrentUser };
});
vi.mock("../services/events", () => ({ getEvent: mocks.getEvent, updateEvent: mocks.updateEvent }));
vi.mock("../services/characters", () => ({ listCharacters: vi.fn().mockResolvedValue([]) }));
vi.mock("../services/profiles", () => ({
  getProfile: vi.fn().mockResolvedValue({ id: "member-1", display_name: "发起人", role: "member" }),
}));
vi.mock("../services/signups", () => ({
  createSignup: vi.fn(),
  deleteSignup: vi.fn(),
  listEventSignups: vi.fn().mockResolvedValue([]),
  updateSignupStatus: vi.fn(),
}));

const eventRow: GuildEvent = {
  id: "event-1",
  title: "TOC+ZUG",
  raid_name: "TOC+ZUG",
  starts_at: "2026-07-17T20:00:00+08:00",
  capacity: 25,
  description: null,
  status: "open",
  created_by: "member-1",
  created_at: "2026-07-16T12:00:00+08:00",
  updated_at: "2026-07-16T12:00:00+08:00",
  creator: { id: "member-1", display_name: "发起人" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getCurrentUser.mockResolvedValue({ id: "member-1", displayName: "发起人", username: "leader" });
  mocks.getEvent.mockResolvedValue(eventRow);
  mocks.updateEvent.mockResolvedValue({ ...eventRow, status: "finished" });
});

afterEach(() => cleanup());

describe("event creator management", () => {
  it("requires confirmation before an event disappears from the active list", async () => {
    render(
      <MemoryRouter initialEntries={["/events/event-1"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes><Route path="/events/:eventId" element={<EventDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "管理我发起的活动" });
    fireEvent.click(screen.getByRole("button", { name: "结束活动" }));

    expect(screen.getByText("确认结束这场活动？")).toBeTruthy();
    expect(mocks.updateEvent).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "确认结束" }));
    await waitFor(() => expect(mocks.updateEvent).toHaveBeenCalledWith("event-1", { status: "finished" }));
  });
});
