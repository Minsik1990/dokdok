import { test, expect } from "@playwright/test";

test.describe("인증 플로우", () => {
  test("미인증 사용자가 홈(/) 접근 시 /invite로 리다이렉트", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/invite");
    expect(page.url()).toContain("/invite");
  });

  test("초대 코드 페이지가 올바르게 렌더링됨", async ({ page }) => {
    await page.goto("/invite");

    // 제목 확인
    await expect(page.getByText("독독")).toBeVisible();
    await expect(page.getByText("나의 독서 기록")).toBeVisible();

    // 초대 코드 안내 문구
    await expect(page.getByText("베타 테스트 중이에요")).toBeVisible();

    // 입력 필드
    await expect(page.getByPlaceholder("초대 코드")).toBeVisible();

    // 입장하기 버튼 (초기에는 비활성화)
    const submitButton = page.getByRole("button", { name: "입장하기" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test("초대 코드 입력 시 버튼이 활성화됨", async ({ page }) => {
    await page.goto("/invite");

    const input = page.getByPlaceholder("초대 코드");
    const submitButton = page.getByRole("button", { name: "입장하기" });

    // 초기 상태: 비활성화
    await expect(submitButton).toBeDisabled();

    // 코드 입력 후: 활성화
    await input.fill("TESTCODE");
    await expect(submitButton).toBeEnabled();
  });

  test("잘못된 초대 코드 입력 시 에러 메시지 표시", async ({ page }) => {
    await page.goto("/invite");

    const input = page.getByPlaceholder("초대 코드");
    await input.fill("WRONG1");

    const submitButton = page.getByRole("button", { name: "입장하기" });
    await submitButton.click();

    // 에러 메시지 확인 (API 응답에 따라 둘 중 하나)
    await expect(
      page.getByText("초대 코드가 맞지 않아요").or(page.getByText("잠깐 문제가 생겼어요"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("로그인 페이지가 올바르게 렌더링됨", async ({ page }) => {
    await page.goto("/login");

    // 제목 확인
    await expect(page.getByText("독독")).toBeVisible();

    // 안내 문구
    await expect(page.getByText("이메일을 입력하면 로그인 링크를 보내드려요")).toBeVisible();

    // 이메일 입력 필드
    await expect(page.getByPlaceholder("이메일 주소")).toBeVisible();

    // 로그인 버튼 (초기에는 비활성화)
    const submitButton = page.getByRole("button", { name: "로그인 링크 받기" });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test("이메일 입력 시 로그인 버튼이 활성화됨", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.getByPlaceholder("이메일 주소");
    const submitButton = page.getByRole("button", { name: "로그인 링크 받기" });

    // 초기 상태: 비활성화
    await expect(submitButton).toBeDisabled();

    // 이메일 입력 후: 활성화
    await emailInput.fill("test@example.com");
    await expect(submitButton).toBeEnabled();
  });
});
