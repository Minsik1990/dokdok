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

// Agent stream 모킹
const mockCreateAgentResponse = vi.fn();
vi.mock("@/lib/agent/stream", () => ({
  createAgentResponse: (...args: unknown[]) => mockCreateAgentResponse(...args),
}));

// Agent cache 모킹
const mockGetCachedContent = vi.fn();
const mockSetCachedContent = vi.fn();
vi.mock("@/lib/agent/cache", () => ({
  getCachedContent: (...args: unknown[]) => mockGetCachedContent(...args),
  setCachedContent: (...args: unknown[]) => mockSetCachedContent(...args),
}));

// Agent prompts 모킹
vi.mock("@/lib/agent/prompts", () => ({
  analysisPrompt: vi.fn(() => "mock-analysis-prompt"),
}));

import { POST } from "./route";

describe("POST /api/agent/analysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("미인증 사용자에게 401을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({
        bookContext: { title: "데미안", author: "헤르만 헤세" },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("로그인이 필요합니다");
  });

  it("bookContext.title이 없으면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({
        bookContext: { author: "저자" },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("책 정보가 필요합니다");
  });

  it("bookContext가 없으면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("캐시에 결과가 있으면 캐시를 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockGetCachedContent.mockResolvedValueOnce("캐시된 분석 결과");

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({
        bookContext: { title: "데미안", author: "헤르만 헤세" },
        bookId: "book-123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.analysis).toBe("캐시된 분석 결과");
    expect(mockGetCachedContent).toHaveBeenCalledWith("book-123", "analysis");
    // AI가 호출되지 않았는지 확인
    expect(mockCreateAgentResponse).not.toHaveBeenCalled();
  });

  it("캐시가 없으면 AI를 호출하고 결과를 캐시에 저장한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockGetCachedContent.mockResolvedValueOnce(null);
    mockCreateAgentResponse.mockResolvedValueOnce("새로운 분석 결과");
    mockSetCachedContent.mockResolvedValueOnce(undefined);

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({
        bookContext: { title: "데미안", author: "헤르만 헤세" },
        bookId: "book-123",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.analysis).toBe("새로운 분석 결과");
    expect(mockCreateAgentResponse).toHaveBeenCalledTimes(1);
    expect(mockSetCachedContent).toHaveBeenCalledWith(
      "book-123",
      "analysis",
      "새로운 분석 결과",
      "claude-sonnet-4-5"
    );
  });

  it("bookId가 없으면 캐시를 확인하지 않고 AI를 호출한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockCreateAgentResponse.mockResolvedValueOnce("분석 결과");

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({
        bookContext: { title: "데미안", author: "헤르만 헤세" },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.analysis).toBe("분석 결과");
    expect(mockGetCachedContent).not.toHaveBeenCalled();
    expect(mockSetCachedContent).not.toHaveBeenCalled();
  });

  it("AI 호출 시 올바른 모델과 파라미터를 사용한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockCreateAgentResponse.mockResolvedValueOnce("분석 결과");

    const req = new NextRequest("http://localhost:9000/api/agent/analysis", {
      method: "POST",
      body: JSON.stringify({
        bookContext: { title: "데미안", author: "헤르만 헤세" },
      }),
    });

    await POST(req);

    expect(mockCreateAgentResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "claude-sonnet-4-5-20250929",
        maxTokens: 2048,
      })
    );
  });
});
