import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSupabase } from "../lib/supabase";
import { deleteShowcaseImage } from "../services/profiles";

vi.mock("../lib/supabase", () => ({ requireSupabase: vi.fn() }));

const mockedRequireSupabase = vi.mocked(requireSupabase);

describe("profile showcase service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears the shared profile image and removes its stored file", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const remove = vi.fn().mockResolvedValue({ error: null });
    const tableFrom = vi.fn(() => ({ update }));
    const storageFrom = vi.fn(() => ({ remove }));
    mockedRequireSupabase.mockReturnValue({ from: tableFrom, storage: { from: storageFrom } } as never);

    await deleteShowcaseImage("user-1");

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ showcase_image_url: null }));
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(remove).toHaveBeenCalledWith(["user-1/showcase.webp"]);
  });
});
