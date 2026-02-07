import { describe, it, expect, vi, beforeEach } from "vitest";

// 모듈을 동적으로 리셋하기 위해 resetModules 사용
describe("getAnthropicClient", () => {
  beforeEach(() => {
    vi.resetModules();
    // 싱글턴 클라이언트 리셋을 위해 매 테스트마다 모듈을 다시 로드
  });

  it("ANTHROPIC_API_KEY가 없으면 에러를 던진다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    // @anthropic-ai/sdk 모킹
    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        constructor() {
          // mock constructor
        }
      },
    }));

    const { getAnthropicClient } = await import("./client");
    expect(() => getAnthropicClient()).toThrow("ANTHROPIC_API_KEY가 설정되지 않았습니다");
  });

  it("ANTHROPIC_API_KEY가 있으면 클라이언트를 반환한다", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-key");

    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        apiKey: string;
        constructor(opts: { apiKey: string }) {
          this.apiKey = opts.apiKey;
        }
      },
    }));

    const { getAnthropicClient } = await import("./client");
    const client = getAnthropicClient();
    expect(client).toBeDefined();
  });

  it("같은 클라이언트 인스턴스를 재사용한다 (싱글턴)", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-key");

    vi.doMock("@anthropic-ai/sdk", () => ({
      default: class MockAnthropic {
        apiKey: string;
        constructor(opts: { apiKey: string }) {
          this.apiKey = opts.apiKey;
        }
      },
    }));

    const { getAnthropicClient } = await import("./client");
    const client1 = getAnthropicClient();
    const client2 = getAnthropicClient();
    expect(client1).toBe(client2);
  });
});
