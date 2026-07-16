import { afterEach, describe, expect, it, vi } from "vitest";
import { sharePage } from "../services/share";

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "share");
  Reflect.deleteProperty(navigator, "clipboard");
});

describe("page sharing", () => {
  it("uses the system share sheet when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { configurable: true, value: share });

    await expect(sharePage({ title: "活动", url: "https://example.com/events/1" })).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ title: "活动" }));
  });

  it("copies the link when system sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await expect(sharePage({ title: "帖子", url: "https://example.com/forum/1" })).resolves.toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://example.com/forum/1");
  });

  it("does nothing when the member cancels the share sheet", async () => {
    const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    const writeText = vi.fn();
    Object.defineProperty(navigator, "share", { configurable: true, value: share });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await expect(sharePage({ title: "活动" })).resolves.toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });
});
