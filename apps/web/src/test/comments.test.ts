import { describe, expect, it } from "vitest";
import { flattenCommentThreads, linkCommentParents } from "../services/comments";
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

  it("places replies directly below their parent with a bounded visual depth", () => {
    const rows = [
      { id: "root-a", parent_id: null, body: "主评论 A" },
      { id: "root-b", parent_id: null, body: "主评论 B" },
      { id: "reply-a", parent_id: "root-a", body: "回复 A" },
      { id: "reply-a-2", parent_id: "reply-a", body: "继续回复 A" },
    ] as Comment[];

    expect(flattenCommentThreads(rows).map(({ comment, depth }) => [comment.id, depth])).toEqual([
      ["root-a", 0],
      ["reply-a", 1],
      ["reply-a-2", 2],
      ["root-b", 0],
    ]);
  });

  it("keeps replies visible when an older parent is not in the loaded page", () => {
    const rows = [{ id: "reply", parent_id: "older-parent", body: "回复较早内容" }] as Comment[];

    expect(flattenCommentThreads(rows).map(({ comment, depth }) => [comment.id, depth])).toEqual([["reply", 0]]);
  });
});
