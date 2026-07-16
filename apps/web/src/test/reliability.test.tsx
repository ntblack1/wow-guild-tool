import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { OfflineBanner } from "../components/OfflineBanner";
import { ErrorState } from "../components/ErrorState";

afterEach(() => {
  cleanup();
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  vi.restoreAllMocks();
});

describe("app reliability states", () => {
  it("shows recovery actions instead of a blank page after a render error", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    function BrokenPage(): never {
      throw new Error("render failed");
    }

    render(<AppErrorBoundary><BrokenPage /></AppErrorBoundary>);

    expect(screen.getByText("页面暂时没有响应")).toBeTruthy();
    expect(screen.getByRole("button", { name: "刷新页面" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "返回大厅" }).getAttribute("href")).toBe("/");
  });

  it("shows a concise warning while the browser is offline", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    render(<OfflineBanner />);

    expect(screen.getByRole("status").textContent).toContain("当前网络已断开");
  });

  it("offers a direct recovery action for retryable page errors", async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="读取失败" onRetry={onRetry} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "重新读取" }));
    });

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
