# Sprint Contract — Packet 0007: App Shell & Routing

## Objective
구성 App.tsx에 react-router-dom Routes를 설정하고 모든 페이지(7개)를 연결. 하단 3탭(홈/퀴즈/리포트)은 FloatingTabBar로 네비게이션 제공. store Provider로 앱 래핑.

## 생성/수정 항목
- **src/App.tsx** (기존 수정): Routes 및 Layout 구성
  - 경로: `/select`, `/`, `/checkin`, `/checkin/done`, `/report`, `/quiz`, `/wrong`
  - 하단 탭 라우트: `/` (홈), `/quiz` (퀴즈), `/report` (리포트) → FloatingTabBar 활성 표시
  - Layout: ScreenScaffold/PageShell로 각 페이지 감싸기
  - Provider: store Provider 감싸기 (main.tsx 제외)

## 사용 TypeScript 타입
`src/lib/types.ts`에서 import:
- `Certification`, `UserCert`, `CheckIn`, `StreakState`, `QuizProgress`, `AppFlags`
- 라우트 상태: `location.state` 타입 명시 (navigate()↔RouteDefinition 일관성)

## 검증 방법
1. `pnpm typecheck` — 0 에러
2. `pnpm test src/__tests__/packet-0007.test.ts` — 모든 테스트 통과
3. `npx vite build` — 빌드 성공
4. **navigate()↔Route 매칭 감사** — 각 페이지 이동 경로와 라우트 정의 일치 확인

## 절대 금지
- **main.tsx 수정** (@AI:ANCHOR)
- 기존 페이지 파일(Home/Checkin/CheckinDone/Select) 재생성
- raw `<div>` 골격 → ScreenScaffold/PageShell 필수
- TDS 컴포넌트 margin/padding 오버라이드
