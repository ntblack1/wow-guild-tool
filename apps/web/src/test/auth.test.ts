import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSupabase } from "../lib/supabase";
import {
  accountEmail,
  authPath,
  createGuildAccount,
  isGuildPassphraseCorrect,
  normalizeUsername,
  safeAuthNextPath,
  signInWithGuildAccount,
  updateGuildDisplayName,
  updateGuildPassword,
} from "../services/auth";

vi.mock("../lib/supabase", () => ({
  requireSupabase: vi.fn(),
}));

const mockedRequireSupabase = vi.mocked(requireSupabase);

describe("guild auth helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts the guild passphrase only", () => {
    expect(isGuildPassphraseCorrect("说这些")).toBe(true);
    expect(isGuildPassphraseCorrect(" 说这些 ")).toBe(true);
    expect(isGuildPassphraseCorrect("说那些")).toBe(false);
  });

  it("normalizes account names into internal auth emails", () => {
    expect(normalizeUsername("  XiaoHeiWa_01 ")).toBe("xiaoheiwa_01");
    expect(accountEmail(" XiaoHeiWa_01 ")).toBe("xiaoheiwa_01@members.8pack-guild.app");
  });

  it("keeps login return paths inside guild pages", () => {
    expect(safeAuthNextPath("/events/event-1?filter=报名中")).toBe("/events/event-1?filter=报名中");
    expect(authPath("/characters")).toBe("/auth?next=%2Fcharacters");
    expect(safeAuthNextPath("https://example.com")).toBe("");
    expect(safeAuthNextPath("//example.com")).toBe("");
    expect(authPath("/auth")).toBe("/auth");
  });

  it("creates an account through Supabase Auth", async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: { display_name: "小黑娃", username: "xiaoheiwa" },
        },
        session: { user: { id: "user-1" } },
      },
      error: null,
    });
    mockedRequireSupabase.mockReturnValue({ auth: { signUp } } as never);

    await expect(
      createGuildAccount({ username: "XiaoHeiWa", password: "secret123", displayName: "小黑娃" }),
    ).resolves.toEqual({ id: "user-1", displayName: "小黑娃", username: "xiaoheiwa" });
    expect(signUp).toHaveBeenCalledWith({
      email: "xiaoheiwa@members.8pack-guild.app",
      password: "secret123",
      options: { data: { display_name: "小黑娃", username: "xiaoheiwa" } },
    });
  });

  it("logs in with the internal account email", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          user_metadata: { display_name: "小黑娃", username: "xiaoheiwa" },
        },
      },
      error: null,
    });
    mockedRequireSupabase.mockReturnValue({ auth: { signInWithPassword } } as never);

    await expect(signInWithGuildAccount("XiaoHeiWa", "secret123")).resolves.toEqual({
      id: "user-1",
      displayName: "小黑娃",
      username: "xiaoheiwa",
    });
  });

  it("rejects unsupported account names before contacting Supabase", async () => {
    mockedRequireSupabase.mockReturnValue({ auth: {} } as never);
    await expect(
      createGuildAccount({ username: "中文账号", password: "secret123", displayName: "成员" }),
    ).rejects.toThrow("只能使用小写字母、数字和下划线");
  });

  it("updates the auth name and forum profile together", async () => {
    const updateUser = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", user_metadata: { display_name: "新昵称" } } },
      error: null,
    });
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });
    mockedRequireSupabase.mockReturnValue({ auth: { updateUser }, from } as never);

    await expect(updateGuildDisplayName("  新昵称  ")).resolves.toEqual({ id: "user-1", displayName: "新昵称", username: "" });
    expect(updateUser).toHaveBeenCalledWith({ data: { display_name: "新昵称" } });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith({ display_name: "新昵称" });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("updates the password only through the signed-in Supabase session", async () => {
    const updateUser = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockedRequireSupabase.mockReturnValue({ auth: { updateUser } } as never);

    await expect(updateGuildPassword("new-secret")).resolves.toBeUndefined();
    expect(updateUser).toHaveBeenCalledWith({ password: "new-secret" });
    await expect(updateGuildPassword("123")).rejects.toThrow("至少需要 6 位");
  });
});
