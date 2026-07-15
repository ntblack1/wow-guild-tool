import { describe, expect, it } from "vitest";
import { signupsByEvent } from "../services/signups";
import type { Signup } from "../types";

describe("signup helpers", () => {
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
});
