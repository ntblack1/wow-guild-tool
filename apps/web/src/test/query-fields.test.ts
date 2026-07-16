import { describe, expect, it } from "vitest";
import { commentReadFields } from "../services/comments";
import { postReadFields } from "../services/posts";
import { showcaseReadFields } from "../services/profiles";

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
});
