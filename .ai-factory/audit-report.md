# CertTimer 디자인 품질 감사 보고서

- 대상: `src/` 전체 (pages 6, components 16, lib 7) — Vite + React + TDS(`@toss/tds-mobile`) 앱인토스 미니앱
- 방법: 전 소스 파일 직독 + `npx tsc --noEmit`(통과) + `npx vitest run`(기존 실패 20건 확인, 아래 참조) + HEX/Tailwind/커스텀 패딩 정적 검색
- 결론: **P0/P1 이슈 없음 → 코드 수정 없음.** 아래는 P2/P3 관찰 사항이며 보고만 한다(수정하지 않음).

## 점수 요약

| 차원 | 점수 (0-4) | 한줄 요약 |
|---|---|---|
| 접근성 | **3** | ARIA·시맨틱 대부분 충족, 뷰포트 줌 차단·퀴즈 옵션 그룹핑 등 폴리시 수준 여지 |
| 성능 | **3** | 불필요 리렌더 없음·적절한 useMemo, 죽은 코드/미사용 의존성 소량 존재 |
| 다크모드 | **4** | HEX 하드코딩 0건, 전 컴포넌트 `var(--adaptive*)`/`var(--tds-color-*)` 토큰만 사용 |
| TDS 준수 | **4** | Button variant·TextField placeholder·ListRow·CTA 중첩 금지 등 전 규칙 위반 없음 |

---

## 1. 접근성 (3/4)

**충족된 것:**
- `FloatingTabBar`(`src/components/FloatingTabBar.tsx:26-84`): `role="tablist"`/`role="tab"`/`aria-selected`/`aria-label`, 터치 타깃 `minHeight: 44` 명시.
- `MiniBar`(`src/components/MiniBar.tsx:18-23`): `role="progressbar"` + `aria-valuenow/min/max`.
- `Sparkline`(`src/components/Sparkline.tsx:33-40`): `role="img"` + `aria-label="추이 그래프"`.
- `TossRewardAd`의 게이트 버튼(`src/components/TossRewardAd.tsx:127`): `aria-label` 부여.
- 모든 `TextField`(Checkin 분 입력, Select 커스텀 등록 폼)에 `label`+`placeholder` 동시 제공 — CLAUDE.md 룰 11 준수(빈 회색 박스 없음).
- `index.html:2` `<html lang="ko">` 설정, 아이콘 전용 버튼은 실제 화면(prod route)에 존재하지 않음(`__TdsGallery.tsx`의 `IconButton`은 dev 전용, 프로덕션 미포함).
- 색상은 전량 TDS 시맨틱 토큰이라 명암비는 TDS 자체 보증(개별 하드코딩 없음 → 다크모드 항목과 동일 근거).

**개선 여지 (P2/P3, 미수정):**
1. **[P2] 뷰포트 핀치줌 차단** — `index.html:4`의 `user-scalable=no, maximum-scale=1.0`은 저시력 사용자의 확대를 막아 WCAG 1.4.4(Resize Text)에 위배될 수 있다. 다만 WebView 임베드 앱셸에서 흔히 쓰이는 네이티브 느낌 패턴이라 의도적일 가능성이 있어 자동 수정하지 않고 보고만 한다.
2. **[P2] 퀴즈 선택지 시맨틱 그룹핑 부재** — `src/pages/Quiz.tsx:101-113`에서 O/X·객관식 보기가 개별 `<Button>` 나열이라 스크린리더가 "여러 선택지 중 하나"라는 관계를 인지하기 어렵다(`role="radiogroup"`/`fieldset` 부재). TDS `Button`에 role 오버라이드가 문서화되어 있지 않아 임의 추가는 위험 — 보고만 한다.
3. **[P3] 자유 텍스트 날짜 입력** — `src/pages/Select.tsx:121-130`의 시험일 필드가 `type="text"`(placeholder "2026-12-01")라 네이티브 날짜 피커 접근성 이점이 없다. TDS TextField에 date variant가 없어(essential.txt 미확인) 대안 부재 — 현행 유지 권장.

## 2. 성능 (3/4)

**충족된 것:**
- `src/pages/Quiz.tsx:30-34` — 날짜 시드 셔플(`pickDailyQuizIds`)을 `useMemo`로 감싸 매 렌더 재계산 방지.
- `CountUp`(`src/components/CountUp.tsx:31-55`) — `requestAnimationFrame` cleanup 정상, `prefers-reduced-motion` 가드로 불필요한 애니메이션 스킵.
- `Checkin.tsx:29-39` — `setInterval` cleanup 정상(언마운트/phase 전환 시 해제), 메모리 누수 없음.
- 무거운 차트/애니메이션 라이브러리 없음(D3/Three.js 등 미사용), `Sparkline`/`MiniBar`는 의존성 0의 인라인 SVG/CSS.
- `Home.tsx:28`의 `checkIns.reduce(...)`는 최대 365건(스펙상 1년치) 수준이라 메모이제이션 없이도 비용 무시 가능 — 과최적화 불필요 판단.

**개선 여지 (P2, 미수정 — 런타임 성능엔 영향 없음, 번들/유지보수 비용만):**
1. **[P2] 미사용 의존성 `lucide-react`** — `package.json:30`에 선언되어 있으나 `src/` 어디서도 import되지 않는다(정적 검색 0건). 사용하지 않아 번들에는 포함되지 않지만(트리셰이킹) `node_modules` 설치 비용과 혼동을 유발한다.
2. **[P2] 죽은 컴포넌트 파일** — `src/components/__DebugTabBarNoSdk.tsx`(어디서도 import되지 않음, `console.log` 포함)와 `src/components/TossPurchase.tsx`(IAP 기능이 스펙에 없어 미사용)는 현재 아무 라우트에서도 참조되지 않는다. Import되지 않으므로 프로덕션 번들/런타임에는 영향 없다. 다만 전자는 미사용 `console.log`가 남아있어 향후 실수로 import될 경우 위험 소지가 있다.
   - `TossPurchase`/`MiniBar`는 CLAUDE.md의 "Pre-built UI 컴포넌트" 목록에 있는 선제공 스캐폴드라 의도적 미사용으로 판단해 수정하지 않음.
   - `__DebugTabBarNoSdk.tsx`는 목록에 없고 문서화도 없는 디버그 잔재 — 정리 후보로 보고만 하고 삭제하지 않음(비즈니스 로직 외 범위 판단은 사용자 확인 권장).

## 3. 다크모드 (4/4)

- 전체 소스(`--include="*.tsx" --include="*.ts" --include="*.css"`)에서 `#`로 시작하는 HEX 리터럴 **0건**.
- `src/components/Card.tsx`, `PageShell.tsx`, `FloatingTabBar.tsx`, `MiniBar.tsx`, `Sparkline.tsx` 모두 `var(--adaptiveBackground)`/`var(--adaptiveLayeredBackground)`/`var(--adaptiveGrey*)`/`var(--adaptiveBlue500)`만 사용.
- `src/styles/reward-ad.css`는 `var(--tds-color-blue500)`/`var(--tds-color-grey500)`/`var(--tds-color-white)` 등 TDS 시맨틱 토큰만 사용(허용된 두 토큰 체계 중 하나) — HEX 없음.
- `src/main.tsx`(`@AI:ANCHOR`, 수정 안 함)에 `TDSMobileAITProvider`가 최상위에 유지되어 있어 `--adaptive*`/`--toss-safe-area-*` 변수가 정상 주입됨을 확인.
- `granite.config.ts`의 `primaryColor: '#3182F6'`는 설정 파일의 브랜드 컬러 값으로, TDS가 내부에서 테마 계산에 사용하는 구성값이지 컴포넌트 스타일 하드코딩이 아니므로 위반 아님.

수정 불필요.

## 4. TDS 준수 (4/4)

- **Button variant**: 전 화면에서 `variant="fill"|"weak"` 외 사용 없음(`Home.tsx`, `Select.tsx`, `Quiz.tsx`, `Report.tsx`, `CheckinDone.tsx`, `BottomCTA.tsx` 전수 확인).
- **1차 CTA 전체폭**: 모든 단독/1차 버튼이 `display="block"` 또는 `SubmitFooter`(`FixedBottomCTA`) 사용 — 좌측 글자폭 인라인 버튼 없음.
- **버튼 중첩 금지**: `SubmitFooter`(`src/components/BottomCTA.tsx:26-46`)는 `FixedBottomCTA`의 children에 라벨을 직접 전달(내부에 `<Button>` 없음) — 무효 HTML 없음.
- **TextField 필수 prop**: 모든 `TextField`가 `variant="box"` + `placeholder` + `label` 동시 지정(`Checkin.tsx:115-127`, `Select.tsx:110-139`).
- **ListRow**: `Select.tsx:90-99`에서 `padding` prop 미사용, `right` 슬롯에 `Badge`(액션 아님, 정보 표시) 배치 — 규칙 위반 없음.
- **Spacing**: 커스텀 margin/padding으로 TDS 컴포넌트 간격을 조절한 사례 없음, 전부 `<Spacing size={n} />`.
- **Tailwind/외부 UI 킷**: 소스 전체에서 `className="tw-*"` 등 Tailwind 클래스 사용 없음, shadcn/MUI/AntD 등 임포트 없음.
- **FloatingTabBar/MiniBar/Sparkline**: TDS에 존재하지 않는 컴포넌트를 CLAUDE.md가 명시적으로 허용한 예외 범위 내에서 자체 구현(활성탭=컬러 틴트만, 솔리드 알약 없음) — 정책 준수.
- 참고: `TossRewardAd`의 게이트 버튼(광고 로드 전 표시)은 TDS `Button`이 아닌 커스텀 CSS 버튼(`reward-ad-button` 클래스)이다. 이는 SDK 게이트라는 특수 목적의 사전 승인된 래퍼(CLAUDE.md Pre-built 목록)라 위반으로 채점하지 않았으나, 시각적으로 TDS Button과 톤이 다를 수 있어 참고로만 남긴다(P3, 미수정).

수정 불필요.

---

## 부록: 감사 범위 밖 관찰 (참고용, 미채점)

- `npx tsc --noEmit` — 에러 0건.
- `npx vitest run` — 기존에 실패 중인 테스트 20건 확인(`src/__tests__/__helpers__/mocks.ts`의 `@toss/tds-mobile` 목이 `SearchField` export를 포함하지 않아 `Select.tsx`를 렌더하는 모든 테스트가 연쇄 실패). 이는 디자인 품질(접근성/성능/다크모드/TDS 준수) 문제가 아니라 테스트 인프라(mock 최신화) 문제이며, 감사 규칙상 테스트 파일 수정이 금지되어 있어 수정하지 않았다. 별도 패킷에서 `mocks.ts`의 TDS mock에 `SearchField`를 추가할 것을 권장한다.
- `npx vite build`는 이번 감사에서 코드 변경이 없었으므로 실행하지 않았다(과거 세션에서 샌드박스 승인 문제로 완료되지 않은 이력 있음).
