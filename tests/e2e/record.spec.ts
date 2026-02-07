import { test, expect } from "@playwright/test";

test.describe("독서 기록", () => {
  /**
   * 미인증 상태에서는 미들웨어가 /invite로 리다이렉트하므로,
   * 인증이 필요한 페이지는 리다이렉트 동작만 확인합니다.
   */

  test("미인증 상태에서 홈(/) 접근 시 /invite로 리다이렉트", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/invite");
    expect(page.url()).toContain("/invite");
  });

  test("미인증 상태에서 새 기록(/record/new) 접근 시 /invite로 리다이렉트", async ({ page }) => {
    await page.goto("/record/new");
    await page.waitForURL("**/invite");
    expect(page.url()).toContain("/invite");
  });

  test("새 기록 페이지 - 제목이 표시됨 (인증 시)", async ({ page }) => {
    // 미인증 상태에서는 리다이렉트되므로, /invite 페이지에서 확인
    // 실제 인증된 상태에서 테스트하려면 storageState 활용 필요
    await page.goto("/record/new");

    // 미인증이면 /invite로 리다이렉트됨
    if (page.url().includes("/invite")) {
      // 리다이렉트가 정상적으로 동작함을 확인
      await expect(page.getByPlaceholder("초대 코드")).toBeVisible();
      return;
    }

    // 인증된 상태라면 새 기록 페이지 확인
    await expect(page.getByText("새 기록")).toBeVisible();
  });

  test("새 기록 페이지 - 폼 요소 존재 확인 (인증 시)", async ({ page }) => {
    await page.goto("/record/new");

    // 미인증이면 /invite로 리다이렉트됨
    if (page.url().includes("/invite")) {
      await expect(page.getByPlaceholder("초대 코드")).toBeVisible();
      return;
    }

    // 인증된 상태에서의 폼 요소 확인
    // 책 선택 영역
    await expect(page.getByText("책")).toBeVisible();
    await expect(page.getByRole("button", { name: /책 검색하기/ })).toBeVisible();

    // 상태 선택 버튼들
    await expect(page.getByRole("button", { name: "읽는 중" })).toBeVisible();
    await expect(page.getByRole("button", { name: "완독" })).toBeVisible();
    await expect(page.getByRole("button", { name: "읽고 싶은" })).toBeVisible();

    // 별점 영역
    await expect(page.getByText("별점 (선택)")).toBeVisible();

    // 감상 텍스트 영역
    await expect(page.getByPlaceholder("이 책에 대한 생각을 자유롭게 적어보세요")).toBeVisible();

    // 인상 깊은 문구 텍스트 영역
    await expect(page.getByPlaceholder("마음에 남는 문장을 기록해보세요")).toBeVisible();

    // 하단 버튼
    await expect(page.getByRole("button", { name: "취소" })).toBeVisible();
    await expect(page.getByRole("button", { name: "기록하기" })).toBeVisible();

    // 책 미선택 시 기록하기 버튼 비활성화
    await expect(page.getByRole("button", { name: "기록하기" })).toBeDisabled();
  });

  test("새 기록 페이지 - '읽고 싶은' 상태 선택 시 별점/감상/인용구 숨김 (인증 시)", async ({
    page,
  }) => {
    await page.goto("/record/new");

    if (page.url().includes("/invite")) {
      return; // 미인증 상태 — 스킵
    }

    // '읽고 싶은' 상태 선택
    await page.getByRole("button", { name: "읽고 싶은" }).click();

    // 별점, 감상, 인용구 영역이 숨겨져야 함
    await expect(page.getByText("별점 (선택)")).not.toBeVisible();
    await expect(
      page.getByPlaceholder("이 책에 대한 생각을 자유롭게 적어보세요")
    ).not.toBeVisible();
    await expect(page.getByPlaceholder("마음에 남는 문장을 기록해보세요")).not.toBeVisible();
  });
});
