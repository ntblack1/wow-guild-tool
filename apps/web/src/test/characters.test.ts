import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSupabase } from "../lib/supabase";
import { deleteCharacter } from "../services/characters";

vi.mock("../lib/supabase", () => ({ requireSupabase: vi.fn() }));

const mockedRequireSupabase = vi.mocked(requireSupabase);

describe("character service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the character row and cleans up its stored avatar", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((name: string) => name === "characters"
      ? { delete: () => ({ eq }) }
      : { remove });
    mockedRequireSupabase.mockReturnValue({ from, storage: { from } } as never);

    await deleteCharacter("character-1", "user-1", "https://example.com/avatar.webp");

    expect(eq).toHaveBeenCalledWith("id", "character-1");
    expect(remove).toHaveBeenCalledWith(["user-1/character-1.webp"]);
  });
});
