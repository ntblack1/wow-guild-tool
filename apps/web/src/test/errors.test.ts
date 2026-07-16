import { describe, expect, it } from "vitest";
import { friendlyError } from "../services/errors";

describe("friendlyError", () => {
  it("keeps intentional Chinese guidance", () => {
    expect(friendlyError(new Error("请先创建角色。"), "操作失败")).toBe("请先创建角色。");
  });

  it("hides database policy details from members", () => {
    expect(friendlyError({ message: "new row violates row-level security policy for table posts" }, "发帖失败"))
      .toBe("当前账号没有执行这个操作的权限。");
  });

  it("turns network failures into an actionable message", () => {
    expect(friendlyError(new TypeError("Failed to fetch"), "读取失败"))
      .toBe("网络连接失败，请检查网络后重试。");
  });

  it("uses the operation fallback for unknown technical errors", () => {
    expect(friendlyError(new Error("unexpected backend condition"), "保存失败，请稍后再试。"))
      .toBe("保存失败，请稍后再试。");
  });
});
