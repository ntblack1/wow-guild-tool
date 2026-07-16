import { forumCategories, type ForumCategory, type PostInput } from "../types";

const forumDraftKey = "eight-pack-guild:forum-post-draft";
const forumDraftMaxAge = 7 * 24 * 60 * 60 * 1000;

type StoredForumDraft = PostInput & {
  saved_at: number;
};

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

function isForumCategory(value: unknown): value is ForumCategory {
  return typeof value === "string" && forumCategories.includes(value as ForumCategory);
}

export function loadForumPostDraft(storage: Storage | null = browserStorage(), now = Date.now()): PostInput | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(forumDraftKey);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<StoredForumDraft>;
    if (typeof draft.title !== "string"
      || typeof draft.body !== "string"
      || !isForumCategory(draft.category)
      || typeof draft.saved_at !== "number"
      || now - draft.saved_at > forumDraftMaxAge
      || (!draft.title.trim() && !draft.body.trim())) {
      storage.removeItem(forumDraftKey);
      return null;
    }
    return { title: draft.title.slice(0, 80), body: draft.body.slice(0, 10000), category: draft.category };
  } catch {
    return null;
  }
}

export function saveForumPostDraft(input: PostInput, storage: Storage | null = browserStorage(), now = Date.now()) {
  if (!storage) return;
  try {
    if (!input.title.trim() && !input.body.trim()) {
      storage.removeItem(forumDraftKey);
      return;
    }
    storage.setItem(forumDraftKey, JSON.stringify({ ...input, saved_at: now } satisfies StoredForumDraft));
  } catch {
    // Draft persistence must never interrupt typing or publishing.
  }
}

export function clearForumPostDraft(storage: Storage | null = browserStorage()) {
  try {
    storage?.removeItem(forumDraftKey);
  } catch {
    // Private browsing can reject storage access; clearing remains best effort.
  }
}
