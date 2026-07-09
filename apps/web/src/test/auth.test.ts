import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSupabase } from "../lib/supabase";
import {
  accountEmail,
  createGuildAccount,
  isGuildPassphraseCorrect,
  normalizeUsername,
  signInWithGuildAccount,
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
    ).resolves.toEqual({ id: "user-1", displayName: "小黑娃" });
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
    });
  });

  it("rejects unsupported account names before contacting Supabase", async () => {
    mockedRequireSupabase.mockReturnValue({ auth: {} } as never);
    await expect(
      createGuildAccount({ username: "中文账号", password: "secret123", displayName: "成员" }),
    ).rejects.toThrow("只能使用小写字母、数字和下划线");
  });
});
