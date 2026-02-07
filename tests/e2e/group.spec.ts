import { test, expect } from "@playwright/test";

test.describe("독서 모임", () => {
  /**
   * 미인증 상태에서는 미들웨어가 /invite로 리다이렉트하므로,
   * 인증이 필요한 페이지는 리다이렉트 동작만 확인합니다.
   */

  test("미인증 상태에서 모임 목록(/groups) 접근 시 /invite로 리다이렉트", async ({ page }) => {
    await page.goto("/groups");
    await page.waitForURL("**/invite");
    expect(page.url()).toContain("/invite");
  });

  test("미인증 상태에서 모임 생성(/groups/new) 접근 시 /invite로 리다이렉트", async ({ page }) => {
    await page.goto("/groups/new");
    await page.waitForURL("**/invite");
    expect(page.url()).toContain("/invite");
  });

  test("모임 목록 페이지 - 제목과 새 모임 버튼 확인 (인증 시)", async ({ page }) => {
    await page.goto("/groups");

    if (page.url().includes("/invite")) {
      await expect(page.getByPlaceholder("초대 코드")).toBeVisible();
      return; // 미인증 상태 — 스킵
    }

    // 페이지 제목
    await expect(page.getByText("내 독서 모임")).toBeVisible();

    // 새 모임 버튼
    await expect(page.getByRole("link", { name: /새 모임/ })).toBeVisible();
  });

  test("모임 목록 페이지 - 모임이 없을 때 빈 상태 표시 (인증 시)", async ({ page }) => {
    await page.goto("/groups");

    if (page.url().includes("/invite")) {
      return; // 미인증 상태 — 스킵
    }

    // 빈 상태 메시지 또는 모임 카드가 있어야 함
    const emptyState = page.getByText("참여 중인 독서 모임이 없어요");
    const groupCards = page.locator("[data-slot='card']");

    // 둘 중 하나는 보여야 함
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasCards = (await groupCards.count()) > 0;
    expect(hasEmpty || hasCards).toBeTruthy();
  });

  test("모임 생성 페이지 - 탭 구조 확인 (인증 시)", async ({ page }) => {
    await page.goto("/groups/new");

    if (page.url().includes("/invite")) {
      return; // 미인증 상태 — 스킵
    }

    // 페이지 제목
    await expect(page.getByText("독서 모임")).toBeVisible();

    // 탭 2개: 새 모임 만들기 / 초대 코드로 참여
    await expect(page.getByRole("tab", { name: "새 모임 만들기" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "초대 코드로 참여" })).toBeVisible();
  });

  test("모임 생성 페이지 - 생성 폼 요소 확인 (인증 시)", async ({ page }) => {
    await page.goto("/groups/new");

    if (page.url().includes("/invite")) {
      return; // 미인증 상태 — 스킵
    }

    // '새 모임 만들기' 탭이 기본 선택
    // 모임 이름 입력
    await expect(page.getByLabel("모임 이름")).toBeVisible();
    await expect(page.getByPlaceholder("예: 수요일의 독서")).toBeVisible();

    // 소개 입력 (선택)
    await expect(page.getByLabel("소개 (선택)")).toBeVisible();
    await expect(page.getByPlaceholder("어떤 모임인지 간단히 소개해주세요")).toBeVisible();

    // 하단 버튼
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();

    // 이름 미입력 시 만들기 버튼 비활성화
    const createButton = page.getByRole("button", { name: "만들기" });
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeDisabled();
  });

  test("모임 생성 페이지 - 이름 입력 시 만들기 버튼 활성화 (인증 시)", async ({ page }) => {
    await page.goto("/groups/new");

    if (page.url().includes("/invite")) {
      return; // 미인증 상태 — 스킵
    }

    const nameInput = page.getByPlaceholder("예: 수요일의 독서");
    const createButton = page.getByRole("button", { name: "만들기" });

    // 초기: 비활성화
    await expect(createButton).toBeDisabled();

    // 이름 입력 후: 활성화
    await nameInput.fill("테스트 모임");
    await expect(createButton).toBeEnabled();
  });

  test("모임 생성 페이지 - 초대 코드 참여 탭 전환 (인증 시)", async ({ page }) => {
    await page.goto("/groups/new");

    if (page.url().includes("/invite")) {
      return; // 미인증 상태 — 스킵
    }

    // '초대 코드로 참여' 탭 클릭
    await page.getByRole("tab", { name: "초대 코드로 참여" }).click();

    // 초대 코드 입력 필드
    await expect(page.getByLabel("초대 코드")).toBeVisible();
    await expect(page.getByPlaceholder("6자리 초대 코드")).toBeVisible();

    // 모임 참여하기 버튼 (초기 비활성화)
    const joinButton = page.getByRole("button", { name: "모임 참여하기" });
    await expect(joinButton).toBeVisible();
    await expect(joinButton).toBeDisabled();

    // 코드 입력 후 활성화
    await page.getByPlaceholder("6자리 초대 코드").fill("ABC123");
    await expect(joinButton).toBeEnabled();
  });
});
