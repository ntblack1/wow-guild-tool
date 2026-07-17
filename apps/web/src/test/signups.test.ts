import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireSupabase } from "../lib/supabase";
import { getMyNextSignup, myUpcomingSignupReadFields, signupsByEvent, updateOwnSignup } from "../services/signups";
import type { Signup } from "../types";

vi.mock("../lib/supabase", () => ({ requireSupabase: vi.fn() }));

const mockedRequireSupabase = vi.mocked(requireSupabase);

describe("signup helpers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("groups roster entries for activity cards", () => {
    const signups = [
      { id: "signup-1", event_id: "event-1" },
      { id: "signup-2", event_id: "event-1" },
      { id: "signup-3", event_id: "event-2" },
    ] as Signup[];

    const grouped = signupsByEvent(["event-1", "event-2", "event-3"], signups);

    expect(grouped["event-1"]).toHaveLength(2);
    expect(grouped["event-2"]).toHaveLength(1);
    expect(grouped["event-3"]).toEqual([]);
  });

  it("loads only the member's nearest future signup", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      neq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      maybeSingle,
    };
    Object.values(chain).slice(0, -1).forEach((method) => method.mockReturnValue(chain));
    mockedRequireSupabase.mockReturnValue({ from: vi.fn(() => chain) } as never);
    const now = new Date("2026-07-17T12:00:00+08:00");

    await getMyNextSignup("member-1", now);

    expect(chain.select).toHaveBeenCalledWith(myUpcomingSignupReadFields);
    expect(chain.eq).toHaveBeenCalledWith("user_id", "member-1");
    expect(chain.neq).toHaveBeenCalledWith("status", "请假");
    expect(chain.gte).toHaveBeenCalledWith("event.starts_at", now.toISOString());
    expect(chain.neq).toHaveBeenCalledWith("event.status", "finished");
    expect(chain.order).toHaveBeenCalledWith("starts_at", { referencedTable: "event", ascending: true });
    expect(chain.limit).toHaveBeenCalledWith(1);
    expect(maybeSingle).toHaveBeenCalledOnce();
  });

  it("updates an owned signup through the restricted database function", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: "signup-1" }, error: null });
    const rpc = vi.fn(() => ({ single }));
    mockedRequireSupabase.mockReturnValue({ rpc } as never);

    await updateOwnSignup("signup-1", {
      character_id: "character-2",
      combat_role: "N",
      note: "可切治疗",
    });

    expect(rpc).toHaveBeenCalledWith("update_own_signup", {
      p_signup_id: "signup-1",
      p_character_id: "character-2",
      p_combat_role: "N",
      p_note: "可切治疗",
    });
    expect(single).toHaveBeenCalledOnce();
  });
});
