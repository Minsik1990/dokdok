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
const mockCreateAgentStream = vi.fn();
vi.mock("@/lib/agent/stream", () => ({
  createAgentStream: (...args: unknown[]) => mockCreateAgentStream(...args),
}));

// Agent prompts 모킹
vi.mock("@/lib/agent/prompts", () => ({
  interviewPrompt: vi.fn(() => "mock-interview-prompt"),
}));

// Agent conversations 모킹
const mockSaveConversation = vi.fn();
vi.mock("@/lib/agent/conversations", () => ({
  saveConversation: (...args: unknown[]) => mockSaveConversation(...args),
}));

import { POST } from "./route";

describe("POST /api/agent/interview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // createAgentStream 기본 반환값 (Response 객체)
    mockCreateAgentStream.mockReturnValue(
      new Response("stream", {
        headers: new Headers({
          "Content-Type": "text/event-stream",
        }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("messages가 없으면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBe("메시지가 필요합니다");
  });

  it("messages가 배열이 아니면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({ messages: "string" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("유효한 요청 시 스트리밍 응답을 반환한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockSaveConversation.mockResolvedValueOnce("conv-123");

    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "안녕하세요" }],
        bookContext: { title: "데미안", author: "헤르만 헤세" },
      }),
    });

    const res = await POST(req);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("X-Conversation-Id")).toBe("conv-123");
  });

  it("비인증 사용자도 스트리밍은 가능하지만 대화 저장은 안 한다", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "테스트" }],
      }),
    });

    const res = await POST(req);
    // 스트리밍 응답 (에러 아님)
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(mockSaveConversation).not.toHaveBeenCalled();
  });

  it("기존 conversationId를 전달하면 대화를 업데이트한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockSaveConversation.mockResolvedValueOnce("existing-conv");

    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "계속 대화" }],
        conversationId: "existing-conv",
      }),
    });

    await POST(req);

    expect(mockSaveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: "existing-conv",
        userId: "user-123",
        conversationType: "interview",
      })
    );
  });

  it("bookContext의 title을 nickname으로 사용한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockSaveConversation.mockResolvedValueOnce("conv-456");

    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "테스트" }],
        bookContext: { title: "노르웨이의 숲", author: "하루키" },
      }),
    });

    await POST(req);

    expect(mockSaveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: "노르웨이의 숲",
      })
    );
  });

  it("bookContext가 없으면 nickname을 '인터뷰'로 사용한다", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123" } },
    });
    mockSaveConversation.mockResolvedValueOnce("conv-789");

    const req = new NextRequest("http://localhost:9000/api/agent/interview", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "테스트" }],
      }),
    });

    await POST(req);

    expect(mockSaveConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: "인터뷰",
      })
    );
  });
});
