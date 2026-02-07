// Vitest 글로벌 설정 — 환경 변수 모킹
import { vi } from "vitest";

// 공통 환경 변수 설정
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
vi.stubEnv("NAVER_CLIENT_ID", "test-naver-id");
vi.stubEnv("NAVER_CLIENT_SECRET", "test-naver-secret");
