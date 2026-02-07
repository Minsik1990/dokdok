import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn (클래스 병합 유틸리티)", () => {
  it("단일 클래스를 그대로 반환한다", () => {
    expect(cn("text-red-500")).toBe("text-red-500");
  });

  it("여러 클래스를 병합한다", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("Tailwind 충돌 클래스를 올바르게 병합한다", () => {
    // twMerge가 마지막 클래스를 우선시
    expect(cn("px-4", "px-6")).toBe("px-6");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("조건부 클래스를 처리한다", () => {
    expect(cn("base", false && "hidden", true && "visible")).toBe("base visible");
  });

  it("undefined와 null을 무시한다", () => {
    expect(cn("base", undefined, null, "extra")).toBe("base extra");
  });

  it("빈 입력을 처리한다", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("배열 형태 입력을 처리한다", () => {
    expect(cn(["px-4", "py-2"])).toBe("px-4 py-2");
  });

  it("객체 형태 조건부 클래스를 처리한다", () => {
    expect(cn({ "bg-red-500": true, "bg-blue-500": false })).toBe("bg-red-500");
  });
});
