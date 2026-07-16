import { beforeEach, describe, expect, it } from "vitest";
import { clearForumPostDraft, loadForumPostDraft, saveForumPostDraft } from "../services/drafts";

describe("forum post drafts", () => {
  beforeEach(() => localStorage.clear());

  it("restores a valid local draft", () => {
    saveForumPostDraft({ title: "开团安排", body: "晚上八点集合", category: "开团通知" }, localStorage, 1000);

    expect(loadForumPostDraft(localStorage, 2000)).toEqual({
      title: "开团安排",
      body: "晚上八点集合",
      category: "开团通知",
    });
  });

  it("drops expired or invalid drafts", () => {
    saveForumPostDraft({ title: "旧草稿", body: "已经过期", category: "吐槽大会" }, localStorage, 1000);
    expect(loadForumPostDraft(localStorage, 8 * 24 * 60 * 60 * 1000)).toBeNull();

    localStorage.setItem("eight-pack-guild:forum-post-draft", "not-json");
    expect(loadForumPostDraft(localStorage)).toBeNull();
  });

  it("clears the draft after publishing or manual removal", () => {
    saveForumPostDraft({ title: "待发布", body: "正文", category: "副本攻略" }, localStorage);
    clearForumPostDraft(localStorage);

    expect(loadForumPostDraft(localStorage)).toBeNull();
  });
});
