import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase server 모킹
const mockGetUser = vi.fn();
const mockUpdate = vi.fn(() => ({
  eq: vi.fn(() => ({ error: null })),
}));
const mockFrom = vi.fn(() => ({ update: mockUpdate }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

import { PUT } from "./route";

describe("PUT /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("미인증 사용자에게 401을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname: "테스트" }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("로그인이 필요합니다");
  });

  it("닉네임이 없으면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({}),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("닉네임은 필수입니다");
  });

  it("빈 닉네임(공백만)에 대해 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname: "   " }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("닉네임은 필수입니다");
  });

  it("닉네임이 20자 초과이면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname: "가".repeat(21) }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("닉네임은 20자 이내로 입력해주세요");
  });

  it("자기소개가 200자 초과이면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        nickname: "테스트",
        bio: "가".repeat(201),
      }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("자기소개는 200자 이내로 입력해주세요");
  });

  it("유효한 입력으로 프로필을 업데이트한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        nickname: "독서왕",
        bio: "책을 좋아합니다",
      }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("닉네임 앞뒤 공백을 제거한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname: "  독서왕  " }),
    });

    await PUT(req);

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ nickname: "독서왕" }));
  });

  it("닉네임 20자 경계값을 올바르게 처리한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    // 정확히 20자 — 통과해야 한다
    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname: "가".repeat(20) }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  it("bio가 200자 경계값을 올바르게 처리한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    // 정확히 200자 — 통과해야 한다
    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        nickname: "테스트",
        bio: "가".repeat(200),
      }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  it("bio가 undefined이면 업데이트 데이터에 포함하지 않는다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/profile", {
      method: "PUT",
      body: JSON.stringify({ nickname: "테스트" }),
    });

    await PUT(req);

    // bio가 undefined이면 updateData에 bio 키가 없어야 한다
    const updateCall = (mockUpdate.mock.calls as unknown[][])[0][0];
    expect(updateCall).toHaveProperty("nickname", "테스트");
    expect(updateCall).not.toHaveProperty("bio");
  });
});
