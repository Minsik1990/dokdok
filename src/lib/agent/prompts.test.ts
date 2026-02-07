import { describe, it, expect } from "vitest";
import {
  interviewPrompt,
  summarizePrompt,
  topicsPrompt,
  draftPrompt,
  chatPrompt,
  analysisPrompt,
} from "./prompts";
import type { BookContext } from "./types";

const mockBook: BookContext = {
  title: "데미안",
  author: "헤르만 헤세",
  description: "자아를 찾아가는 청춘의 이야기",
};

const mockBookWithoutDesc: BookContext = {
  title: "노르웨이의 숲",
  author: "무라카미 하루키",
};

describe("Agent Prompts", () => {
  describe("interviewPrompt", () => {
    it("톤 가이드를 포함한다", () => {
      const prompt = interviewPrompt();
      expect(prompt).toContain("독독의 AI 독서 도우미");
      expect(prompt).toContain("따뜻하지만 깔끔한 조력자");
    });

    it("인터뷰어 역할을 포함한다", () => {
      const prompt = interviewPrompt();
      expect(prompt).toContain("독서 인터뷰어");
      expect(prompt).toContain("3~5개의 질문");
    });

    it("bookContext가 없으면 책 정보를 포함하지 않는다", () => {
      const prompt = interviewPrompt();
      expect(prompt).not.toContain("현재 대화 중인 책");
    });

    it("bookContext가 있으면 책 정보를 포함한다", () => {
      const prompt = interviewPrompt(mockBook);
      expect(prompt).toContain("제목: 데미안");
      expect(prompt).toContain("저자: 헤르만 헤세");
      expect(prompt).toContain("소개: 자아를 찾아가는 청춘의 이야기");
    });

    it("description이 없으면 소개 필드를 포함하지 않는다", () => {
      const prompt = interviewPrompt(mockBookWithoutDesc);
      expect(prompt).toContain("제목: 노르웨이의 숲");
      expect(prompt).toContain("저자: 무라카미 하루키");
      expect(prompt).not.toContain("소개:");
    });
  });

  describe("summarizePrompt", () => {
    it("감상문 정리 역할을 포함한다", () => {
      const prompt = summarizePrompt();
      expect(prompt).toContain("독서 감상문으로 정리");
    });

    it("규칙을 포함한다", () => {
      const prompt = summarizePrompt();
      expect(prompt).toContain("3~5문단");
      expect(prompt).toContain("500자 내외");
    });

    it("bookContext를 올바르게 적용한다", () => {
      const prompt = summarizePrompt(mockBook);
      expect(prompt).toContain("데미안");
    });
  });

  describe("topicsPrompt", () => {
    it("토론 주제 추천 역할을 포함한다", () => {
      const prompt = topicsPrompt();
      expect(prompt).toContain("토론 주제를 추천");
    });

    it("3~5개 주제 규칙을 포함한다", () => {
      const prompt = topicsPrompt();
      expect(prompt).toContain("3~5개");
    });

    it("bookContext를 올바르게 적용한다", () => {
      const prompt = topicsPrompt(mockBook);
      expect(prompt).toContain("헤르만 헤세");
    });
  });

  describe("draftPrompt", () => {
    it("발제문 초안 역할을 포함한다", () => {
      const prompt = draftPrompt();
      expect(prompt).toContain("발제문 초안");
    });

    it("구조를 포함한다 (책 소개, 핵심 내용, 토론 질문, 발제자 생각)", () => {
      const prompt = draftPrompt();
      expect(prompt).toContain("책 소개");
      expect(prompt).toContain("핵심 내용 정리");
      expect(prompt).toContain("토론 질문");
      expect(prompt).toContain("발제자 생각");
    });

    it("마크다운 형식을 명시한다", () => {
      const prompt = draftPrompt();
      expect(prompt).toContain("마크다운");
    });
  });

  describe("chatPrompt", () => {
    it("독서 대화 친구 역할을 포함한다", () => {
      const prompt = chatPrompt();
      expect(prompt).toContain("독서 대화 친구");
    });

    it("할 수 있는 것 목록을 포함한다", () => {
      const prompt = chatPrompt();
      expect(prompt).toContain("책 추천");
      expect(prompt).toContain("독서 고민 상담");
    });

    it("짧은 답변 규칙을 포함한다", () => {
      const prompt = chatPrompt();
      expect(prompt).toContain("3~5문장 이내");
    });

    it("bookContext 파라미터를 받지 않는다", () => {
      // chatPrompt는 파라미터가 없음을 타입으로 확인
      const prompt = chatPrompt();
      expect(typeof prompt).toBe("string");
      expect(prompt.length).toBeGreaterThan(0);
    });
  });

  describe("analysisPrompt", () => {
    it("분석 역할을 포함한다", () => {
      const prompt = analysisPrompt();
      expect(prompt).toContain("깊이 있는 분석");
    });

    it("분석 구조를 포함한다", () => {
      const prompt = analysisPrompt();
      expect(prompt).toContain("핵심 메시지");
      expect(prompt).toContain("주요 주제/테마");
      expect(prompt).toContain("저자의 의도");
    });

    it("스포일러 주의를 명시한다", () => {
      const prompt = analysisPrompt();
      expect(prompt).toContain("스포일러");
    });

    it("bookContext를 올바르게 적용한다", () => {
      const prompt = analysisPrompt(mockBook);
      expect(prompt).toContain("데미안");
      expect(prompt).toContain("자아를 찾아가는 청춘의 이야기");
    });
  });

  describe("bookContext 일관성 검증", () => {
    const promptFns = [
      { name: "interviewPrompt", fn: interviewPrompt },
      { name: "summarizePrompt", fn: summarizePrompt },
      { name: "topicsPrompt", fn: topicsPrompt },
      { name: "draftPrompt", fn: draftPrompt },
      { name: "analysisPrompt", fn: analysisPrompt },
    ];

    it.each(promptFns)("$name — bookContext 없이 호출해도 에러가 나지 않는다", ({ fn }) => {
      expect(() => fn()).not.toThrow();
      expect(fn()).toBeTruthy();
    });

    it.each(promptFns)("$name — bookContext를 전달하면 제목/저자를 포함한다", ({ fn }) => {
      const prompt = fn(mockBook);
      expect(prompt).toContain("데미안");
      expect(prompt).toContain("헤르만 헤세");
    });
  });
});
