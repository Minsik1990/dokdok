import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase SSR 모킹
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// 모킹 이후 route import
import { POST } from "./route";

describe("POST /api/invite/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("코드가 없으면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("초대 코드가 필요합니다");
  });

  it("빈 문자열 코드에 대해 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({ code: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("초대 코드가 필요합니다");
  });

  it("잘못된 초대 코드에 대해 401을 반환한다", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({ code: "INVALID-CODE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("잘못된 초대 코드");
  });

  it("만료된 초대 코드에 대해 401을 반환한다", async () => {
    const expiredDate = new Date("2020-01-01").toISOString();
    mockSingle.mockResolvedValueOnce({
      data: {
        code: "EXPIRED-CODE",
        used_by: null,
        expires_at: expiredDate,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({ code: "EXPIRED-CODE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("만료된 초대 코드");
  });

  it("유효한 초대 코드에 대해 성공을 반환한다", async () => {
    const futureDate = new Date("2030-12-31").toISOString();
    mockSingle.mockResolvedValueOnce({
      data: {
        code: "VALID-CODE",
        used_by: null,
        expires_at: futureDate,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({ code: "VALID-CODE" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("만료일이 없는 유효한 코드에 대해 성공을 반환한다", async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        code: "NO-EXPIRY",
        used_by: null,
        expires_at: null,
      },
      error: null,
    });

    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({ code: "NO-EXPIRY" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("Supabase에 올바른 쿼리를 전달한다", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { code: "TEST", used_by: null, expires_at: null },
      error: null,
    });

    const req = new NextRequest("http://localhost:9000/api/invite/verify", {
      method: "POST",
      body: JSON.stringify({ code: "TEST" }),
    });

    await POST(req);

    expect(mockFrom).toHaveBeenCalledWith("invite_codes");
    expect(mockSelect).toHaveBeenCalledWith("code, used_by, expires_at");
    expect(mockEq).toHaveBeenCalledWith("code", "TEST");
  });
});
