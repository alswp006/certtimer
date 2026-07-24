import { test, expect } from '@playwright/test';

// nightcrew Sentinel smoke 팩 — Factory 산출(§7.1)
// 핵심 막: 자격증 시험 데이터베이스 (주요 50종 시험일 내장) + 커스텀 등록, 오늘 공부 시간 체크인 (스탑워치 or 수동 입력) + 연속 체크인 스트릭, D-day 기준 일일 목표 학습량 자동 계산 및 달성률 시각화, 배너 광고: 체크인 완료 화면 하단 노출, 리워드 광고 시청 후 '합격 가능성 예측 리포트' (누적 학습량 기반) 공개
// 토스 브릿지 의존 구간(로그인·결제)은 외부 재현 불가 — 화면 도달 확인까지만.
const ROUTES = ["/","/Checkin","/CheckinDone","/Home","/Quiz"];
// WebView 밖 실행에서만 나는 콘솔 에러는 무시(앱인토스 관례 — toss visual-smoke 템플릿 계승)
const IGNORED_CONSOLE = [/SafeAreaInsets/i, /granite/i, /apps-in-toss/i];

for (const route of ROUTES) {
  test(`smoke: ${route} 렌더링과 콘솔 에러 없음`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !IGNORED_CONSOLE.some((re) => re.test(msg.text()))) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
