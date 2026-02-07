import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Supabase server 모킹
const mockGetUser = vi.fn();
const mockInsert = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() => ({ data: { id: "record-123" } })),
  })),
}));
const mockFrom = vi.fn(() => ({ insert: mockInsert }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}));

// Agent stream 모킹
const mockCreateAgentResponse = vi.fn();
vi.mock("@/lib/agent/stream", () => ({
  createAgentResponse: (...args: unknown[]) => mockCreateAgentResponse(...args),
}));

// Agent prompts 모킹
vi.mock("@/lib/agent/prompts", () => ({
  summarizePrompt: vi.fn(() => "mock-summarize-system-prompt"),
}));

import { POST } from "./route";

describe("POST /api/agent/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("미인증 사용자에게 401을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({ messages: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toBe("로그인이 필요합니다");
  });

  it("messages가 없으면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("메시지가 필요합니다");
  });

  it("messages가 배열이 아니면 400을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({ messages: "not-an-array" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("existingSummary가 있으면 AI 호출을 생략한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "테스트" }],
        existingSummary: "이미 존재하는 요약문",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary).toBe("이미 존재하는 요약문");
    // AI가 호출되지 않았는지 확인
    expect(mockCreateAgentResponse).not.toHaveBeenCalled();
  });

  it("existingSummary가 없으면 AI를 호출한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockCreateAgentResponse.mockResolvedValueOnce("AI가 생성한 요약문");

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "인상 깊었어요" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary).toBe("AI가 생성한 요약문");
    expect(mockCreateAgentResponse).toHaveBeenCalledTimes(1);
  });

  it("saveAsRecord + bookId가 있으면 기록을 저장한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "테스트" }],
        existingSummary: "요약문",
        saveAsRecord: true,
        bookId: "book-456",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.recordId).toBe("record-123");
    expect(mockFrom).toHaveBeenCalledWith("records");
  });

  it("saveAsRecord 없이는 기록을 저장하지 않는다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });

    const req = new NextRequest("http://localhost:9000/api/agent/summarize", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "테스트" }],
        existingSummary: "요약문",
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.recordId).toBeNull();
  });
});
