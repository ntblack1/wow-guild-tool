import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LoadingState } from "../components/LoadingState";

afterEach(cleanup);

describe("loading feedback", () => {
  it("shows a stable content skeleton for full-page data loads", () => {
    const view = render(<LoadingState label="正在读取活动" />);

    expect(screen.getByRole("status").textContent).toContain("正在读取活动");
    expect(view.container.querySelector(".animate-pulse")).toBeTruthy();
  });

  it("keeps embedded loading messages compact", () => {
    const view = render(<LoadingState compact label="正在读取我的活动" />);

    expect(screen.getByRole("status").textContent).toContain("正在读取我的活动");
    expect(view.container.querySelector(".animate-pulse")).toBeNull();
  });
});
