import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AuthPage } from "../pages/AuthPage";

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));

vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");
  return {
    ...actual,
    getCurrentUser: vi.fn(() => new Promise(() => undefined)),
  };
});

vi.mock("../services/profiles", () => ({ getProfile: vi.fn().mockResolvedValue(null) }));

afterEach(() => cleanup());

describe("guild account form", () => {
  it("supports password managers and lets members reveal passwords", async () => {
    render(<MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}><AuthPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByRole("heading", { name: "账号密码登录" })).toBeTruthy());

    const username = screen.getByLabelText("账号");
    const loginPassword = screen.getByLabelText("密码");
    expect(username.getAttribute("autocomplete")).toBe("username");
    expect(username.getAttribute("name")).toBe("username");
    expect(loginPassword.getAttribute("autocomplete")).toBe("current-password");
    expect(loginPassword.getAttribute("type")).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: "显示密码" }));
    expect(loginPassword.getAttribute("type")).toBe("text");
    expect(screen.getByRole("button", { name: "隐藏密码" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("reveals both password fields while creating an account", async () => {
    render(<MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}><AuthPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("会长口头禅是什么？"), { target: { value: "说这些" } });
    fireEvent.click(screen.getByRole("button", { name: "验证口令" }));

    const password = screen.getByPlaceholderText("至少 6 位");
    const confirmation = screen.getByPlaceholderText("再输入一次密码");
    expect(password.getAttribute("autocomplete")).toBe("new-password");
    expect(confirmation.getAttribute("type")).toBe("password");

    fireEvent.click(screen.getAllByRole("button", { name: "显示密码" })[1]);
    expect(password.getAttribute("type")).toBe("text");
    expect(confirmation.getAttribute("type")).toBe("text");
  });
});
