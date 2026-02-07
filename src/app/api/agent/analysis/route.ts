import { NextRequest } from "next/server";
import { analysisPrompt } from "@/lib/agent/prompts";
import { createAgentResponse } from "@/lib/agent/stream";
import { getCachedContent, setCachedContent } from "@/lib/agent/cache";
import type { BookContext } from "@/lib/agent/types";

export async function POST(request: NextRequest) {
  try {
    const { bookContext, bookId } = (await request.json()) as {
      bookContext: BookContext;
      bookId?: string;
    };

    if (!bookContext?.title) {
      return new Response(JSON.stringify({ error: "책 정보가 필요합니다" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 캐시 확인
    if (bookId) {
      const cached = await getCachedContent(bookId, "analysis");
      if (cached) {
        return new Response(JSON.stringify({ analysis: cached }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // 캐시 없으면 비스트리밍으로 생성 후 캐시 저장
    const analysis = await createAgentResponse({
      systemPrompt: analysisPrompt(bookContext),
      messages: [
        {
          role: "user",
          content: `"${bookContext.title}" (${bookContext.author})에 대한 분석을 해주세요.`,
        },
      ],
      model: "claude-sonnet-4-5-20250929",
      maxTokens: 2048,
    });

    // 캐시 저장 (bookId가 있는 경우)
    if (bookId && analysis) {
      await setCachedContent(bookId, "analysis", analysis, "claude-sonnet-4-5");
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "AI 기능을 잠시 사용할 수 없어요" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
