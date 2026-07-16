import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ForumPage } from "../pages/ForumPage";
import { PostDetailPage } from "../pages/PostDetailPage";
import type { Post } from "../types";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  getPost: vi.fn(),
  listPosts: vi.fn(),
  listCommentsPage: vi.fn(),
  createPost: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({ isSupabaseConfigured: true }));
vi.mock("../services/auth", async () => {
  const actual = await vi.importActual<typeof import("../services/auth")>("../services/auth");
  return { ...actual, getCurrentUser: mocks.getCurrentUser };
});
vi.mock("../services/posts", () => ({
  createPost: mocks.createPost,
  deletePost: vi.fn(),
  getPost: mocks.getPost,
  listPosts: mocks.listPosts,
  togglePostPinned: vi.fn(),
  updatePost: vi.fn(),
}));
vi.mock("../services/comments", async () => {
  const actual = await vi.importActual<typeof import("../services/comments")>("../services/comments");
  return {
    ...actual,
    createComment: vi.fn(),
    deleteComment: vi.fn(),
    listCommentsPage: mocks.listCommentsPage,
  };
});
vi.mock("../services/profiles", () => ({ getProfile: vi.fn().mockResolvedValue(null) }));

const postRow = {
  id: "post-1",
  title: "开荒站位说明",
  body: "今晚按分组站位。",
  category: "副本攻略",
  author_id: "member-1",
  is_pinned: false,
  created_at: "2026-07-16T12:00:00+08:00",
  updated_at: "2026-07-16T12:00:00+08:00",
  comment_count: 0,
  author: { id: "member-1", display_name: "攻略作者" },
} as Post;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getCurrentUser.mockResolvedValue(null);
  mocks.getPost.mockResolvedValue(postRow);
  mocks.listPosts.mockResolvedValue([]);
  mocks.listCommentsPage.mockResolvedValue({ comments: [], total: 0 });
  mocks.createPost.mockResolvedValue({ ...postRow, id: "new-post" });
  vi.stubGlobal("scrollTo", vi.fn());
});

function LocationProbe() {
  const location = useLocation();
  return <p>{location.pathname}{location.search}</p>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("forum navigation hierarchy", () => {
  it("gives the forum list a clear route back to the guild hall", async () => {
    render(
      <MemoryRouter initialEntries={["/forum"]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes><Route path="/forum" element={<ForumPage />} /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "工会论坛", level: 1 });
    expect(screen.getByRole("link", { name: "返回工会大厅" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("navigation", { name: "页面层级" })).toBeTruthy();
  });

  it("keeps forum filters on every route back from a post", async () => {
    const search = "?category=%E5%89%AF%E6%9C%AC%E6%94%BB%E7%95%A5&sort=%E7%83%AD%E9%97%A8&q=%E8%99%9A%E7%A9%BA";
    render(
      <MemoryRouter initialEntries={[`/forum/post-1${search}`]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes><Route path="/forum/:postId" element={<PostDetailPage />} /></Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "开荒站位说明", level: 1 });
    const backLinks = screen.getAllByRole("link", { name: "返回论坛" });
    expect(backLinks).toHaveLength(2);
    backLinks.forEach((link) => expect(link.getAttribute("href")).toBe(`/forum${search}`));
    await waitFor(() => expect(screen.getByRole("navigation", { name: "帖子末尾导航" })).toBeTruthy());
  });

  it("opens the new post immediately after publishing and keeps the return view", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "member-1", displayName: "发帖成员", username: "member" });
    const search = "?category=%E5%90%90%E6%A7%BD%E5%A4%A7%E4%BC%9A&sort=%E7%83%AD%E9%97%A8&q=%E6%B5%8B%E8%AF%95";
    render(
      <MemoryRouter initialEntries={[`/forum${search}`]} future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:postId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByRole("heading", { name: "工会论坛", level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "发布新帖" }));
    fireEvent.change(screen.getByLabelText("板块"), { target: { value: "副本攻略" } });
    fireEvent.change(screen.getByLabelText("标题"), { target: { value: "开荒站位说明" } });
    fireEvent.change(screen.getByLabelText("正文"), { target: { value: "今晚按分组站位。" } });
    fireEvent.click(screen.getByRole("button", { name: "发布帖子" }));

    await screen.findByText(`/forum/new-post${search}`);
    expect(mocks.createPost).toHaveBeenCalledWith("member-1", {
      title: "开荒站位说明",
      body: "今晚按分组站位。",
      category: "副本攻略",
    });
  });
});
