import { describe, expect, it } from "vitest";
import { selectHomepageNotice } from "../services/posts";
import type { Post } from "../types";

describe("homepage forum helpers", () => {
  it("prefers a pinned post as the guild notice", () => {
    const posts = [
      { id: "notice", category: "开团通知", is_pinned: false },
      { id: "pinned", category: "吐槽大会", is_pinned: true },
    ] as Post[];

    expect(selectHomepageNotice(posts)?.id).toBe("pinned");
  });

  it("falls back to an unpinned raid notice and otherwise stays empty", () => {
    expect(selectHomepageNotice([{ id: "notice", category: "开团通知", is_pinned: false }] as Post[])?.id).toBe("notice");
    expect(selectHomepageNotice([{ id: "chat", category: "吐槽大会", is_pinned: false }] as Post[])).toBeNull();
  });
});
