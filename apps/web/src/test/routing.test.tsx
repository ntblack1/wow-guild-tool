import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { App } from "../App";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("fallback routing", () => {
  it("shows useful exits instead of silently redirecting an unknown link", () => {
    vi.stubGlobal("scrollTo", vi.fn());
    render(
      <MemoryRouter initialEntries={["/missing-link"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "页面走丢了" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "跳到主要内容" }).getAttribute("href")).toBe("#main-content");
    expect(document.getElementById("main-content")?.getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("navigation", { name: "手机主要导航" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "工会大厅" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "活动报名" }).getAttribute("href")).toBe("/events");
    expect(screen.getByRole("link", { name: "工会论坛" }).getAttribute("href")).toBe("/forum");
  });
});
