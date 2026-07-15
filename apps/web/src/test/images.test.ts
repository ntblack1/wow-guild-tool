import { describe, expect, it } from "vitest";
import { validateImageFile } from "../services/images";

describe("image upload rules", () => {
  it("accepts supported images and rejects large or unsupported files", () => {
    expect(() => validateImageFile(new File(["image"], "member.webp", { type: "image/webp" }))).not.toThrow();
    expect(() => validateImageFile(new File(["text"], "member.txt", { type: "text/plain" }))).toThrow("JPG");
    expect(() => validateImageFile(new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }))).toThrow("8MB");
  });
});
