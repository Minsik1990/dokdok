import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 테스트 설정
 * - 모바일 퍼스트: iPhone 14 Pro 뷰포트 (390x844)
 * - 브라우저: Chromium만 사용
 * - 포트: 9000 (Next.js dev 서버)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:9000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["iPhone 14 Pro"],
  },

  timeout: 30_000,

  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["iPhone 14 Pro"],
      },
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:9000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
