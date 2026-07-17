import { describe, expect, it } from "vitest";
import { commentReadFields } from "../services/comments";
import { eventRosterSelect } from "../services/events";
import { postReadFields } from "../services/posts";
import { showcaseReadFields } from "../services/profiles";
import { myUpcomingSignupReadFields } from "../services/signups";

describe("public query field limits", () => {
  it("does not fetch full profiles for forum authors", () => {
    expect(postReadFields).not.toContain("*");
    expect(commentReadFields).not.toContain("*");
    expect(postReadFields).not.toContain("showcase_image_url");
    expect(commentReadFields).not.toContain("showcase_image_url");
  });

  it("fetches only fields rendered by the member showcase", () => {
    expect(showcaseReadFields).not.toContain("*");
    expect(showcaseReadFields).not.toContain("role");
    expect(showcaseReadFields).not.toContain("created_at");
  });

  it("fetches only the fields shown in the personal next-activity card", () => {
    expect(myUpcomingSignupReadFields).not.toContain("*");
    expect(myUpcomingSignupReadFields).not.toContain("description");
    expect(myUpcomingSignupReadFields).not.toContain("item_level");
  });

  it("embeds compact signup rosters in activity list queries", () => {
    expect(eventRosterSelect).not.toContain("*");
    expect(eventRosterSelect).toContain("signups(");
    expect(eventRosterSelect).toContain("character:characters(");
  });
});
