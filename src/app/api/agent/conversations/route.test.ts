import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase server 모킹
const mockGetUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
    })
  ),
}));

// conversations 모킹
const mockListConversations = vi.fn();
vi.mock("@/lib/agent/conversations", () => ({
  listConversations: (...args: unknown[]) => mockListConversations(...args),
}));

import { GET } from "./route";

describe("GET /api/agent/conversations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("미인증 사용자에게 401을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new NextRequest("http://localhost:9000/api/agent/conversations");
    const res = await GET(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("인증이 필요합니다");
  });

  it("기본 limit 20으로 대화 목록을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([
      { id: "conv-1", conversation_type: "chat", nickname: "대화1" },
    ]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.conversations).toHaveLength(1);
    expect(mockListConversations).toHaveBeenCalledWith("user-123", undefined, 20);
  });

  it("type 파라미터를 전달한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations?type=interview");
    await GET(req);

    expect(mockListConversations).toHaveBeenCalledWith("user-123", "interview", 20);
  });

  it("limit 파라미터를 올바르게 파싱한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations?limit=50");
    await GET(req);

    expect(mockListConversations).toHaveBeenCalledWith("user-123", undefined, 50);
  });

  it("limit 상한값을 100으로 제한한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations?limit=999");
    await GET(req);

    expect(mockListConversations).toHaveBeenCalledWith("user-123", undefined, 100);
  });

  it("limit 하한값을 1로 제한한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations?limit=0");
    await GET(req);

    expect(mockListConversations).toHaveBeenCalledWith(
      "user-123",
      undefined,
      20 // NaN 방어: parsedLimit || 20
    );
  });

  it("limit이 NaN이면 기본값 20을 사용한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations?limit=abc");
    await GET(req);

    expect(mockListConversations).toHaveBeenCalledWith("user-123", undefined, 20);
  });

  it("음수 limit에 대해 1로 제한한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockListConversations.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost:9000/api/agent/conversations?limit=-5");
    await GET(req);

    expect(mockListConversations).toHaveBeenCalledWith("user-123", undefined, 1);
  });
});
