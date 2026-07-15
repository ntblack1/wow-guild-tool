import { describe, expect, it } from "vitest";
import { linkCommentParents } from "../services/comments";
import type { Comment } from "../types";

describe("forum comment helpers", () => {
  it("links replies to their parent comment without another request", () => {
    const rows = [
      { id: "root", parent_id: null, body: "主评论" },
      { id: "reply", parent_id: "root", body: "回复内容" },
    ] as Comment[];

    const linked = linkCommentParents(rows);
    expect(linked[1]?.parent?.id).toBe("root");
  });
});
