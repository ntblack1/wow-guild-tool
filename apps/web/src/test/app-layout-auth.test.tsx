import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import type { GuildSessionUser } from "../services/auth";

const mocks = vi.hoisted(() => ({
  authCallback: null as ((user: GuildSessionUser | null) => void) | null,
  unsubscribe: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("../services/auth", () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null),
  subscribeToAuthChanges: vi.fn((callback: (user: GuildSessionUser | null) => void) => {
    mocks.authCallback = callback;
    return mocks.unsubscribe;
  }),
}));

beforeEach(() => {
  mocks.authCallback = null;
  mocks.unsubscribe.mockClear();
  vi.stubGlobal("scrollTo", vi.fn());
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("global account navigation", () => {
  it("updates the account name immediately for login, profile changes, and logout", async () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<p>大厅内容</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "登录或创建账号" })).toBeTruthy();
    await act(async () => undefined);

    act(() => mocks.authCallback?.({ id: "member-1", displayName: "小黑娃", username: "xiaoheiwa" }));
    expect(screen.getByRole("link", { name: "小黑娃，账号中心" }).textContent).toContain("小黑娃");

    act(() => mocks.authCallback?.({ id: "member-1", displayName: "新昵称", username: "xiaoheiwa" }));
    expect(screen.getByRole("link", { name: "新昵称，账号中心" })).toBeTruthy();

    act(() => mocks.authCallback?.(null));
    expect(screen.getByRole("link", { name: "登录或创建账号" })).toBeTruthy();
  });

  it("stops listening after the layout is removed", async () => {
    const view = render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes><Route element={<AppLayout />}><Route index element={<p>大厅内容</p>} /></Route></Routes>
      </MemoryRouter>,
    );
    await act(async () => undefined);
    view.unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });
});
