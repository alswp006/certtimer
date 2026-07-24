Cross-validation surfaced that the documents were truncated, but reading the full TASK shows most "gaps" are actually covered (D-day/목표/예측/퀴즈 → Task 1.5, 1.4, 3.5). The genuine remaining defects are: (1) **`AppFlags.reportDisclaimerSeen` is defined in SPEC but no task consumes it**, (2) **F1-AC4 is double-claimed** by 1.2 and 1.3, (3) **`calcDailyGoal`/`calcScore` edge cases (0 remaining days, exam passed) lack explicit DoD lines**, (4) **the "자격증 변경" nav referenced in 3.2 has no defined target/flow**. Here is the complete updated TASK with these fixed.

---

# TASK — CertTimer

> 전제: 템플릿이 이미 제공(재구현 금지) — React/Vite/TS 셋업, TDS, `AdSlot`, `TossRewardAd`, `TossPurchase`, `FloatingTabBar`, `ScreenScaffold`, localStorage helper, 자동 토스 세션. 아래 태스크는 앱 고유 로직만 다룬다.

---

## Epic 1. Data Layer (types → storage → state → constants → calc)

**Risk Assessment**
- **Complexity**: Medium
- **Risk factors**: (1) 페이지 간 `location.state` 타입 불일치로 런타임 undefined 참조. (2) `QuotaExceededError`/손상 JSON 미처리 시 화이트스크린·`console.error` 발생 → 검수 반려. (3) 예측 점수·일일 목표가 비결정론적이면 F5-AC1 재현성 위반.
- **Mitigation**: Task 1.1에서 `RouteState`를 단일 소스로 고정하고 모든 페이지가 이를 import하도록 강제(데이터 계약 통일). Task 1.2에서 try/catch + 기본값 반환으로 손상/초과를 한 진입점에서 흡수. Task 1.5에서 계산을 순수 함수로 분리해 UI 이전에 결정론성 검증. 데이터 레이어를 페이지보다 먼저 완성해 위험을 상류에서 차단.

### Task 1.1 TypeScript 타입 정의 + RouteState 계약
- **Description**: 모든 엔티티(`Certification`, `UserCert`, `CheckIn`, `StreakState`, `QuizProgress`, `AppFlags`)와 `SimulationInput` 성격의 계산 입출력 타입, 스키마 버전 필드(`_v: 1`), 그리고 페이지 간 이동 계약인 `RouteState`를 순수 타입으로 정의한다. 런타임 코드 없음.
- **RouteState 예시**:
  ```typescript
  export type RouteState = {
    '/select': { mode: 'onboard' | 'change' } | undefined; // 'change'=홈에서 자격증 변경 진입
    '/': undefined;
    '/checkin': undefined;
    '/checkin/done': { minutesToday: number; streakCurrent: number } | undefined;
    '/report': undefined;
    '/quiz': undefined;
  };
  ```
- **DoD**: `tsc` 통과. 각 엔티티 interface + `_v` 필드 타입 존재. `RouteState`가 S3 완료화면 state 계약(`{ minutesToday, streakCurrent }`)과 `/select`의 `{ mode }` 계약을 포함. 라벨 타입 `ScoreLabel = '분발 필요'|'순항 중'|'합격 유력'` 정의. 계산 입출력 타입(`DailyGoal = { targetToday: number; label: string; state: 'onTrack'|'done'|'expired' }`, `ScoreResult = { score: number; label: ScoreLabel }`) 정의.
- **Covers**: [F1-AC6]
- **Files**: `src/lib/types.ts`
- **Depends on**: none

### Task 1.2 localStorage 저장소 헬퍼 (CRUD + 안전 처리)
- **Description**: `certtimer.*` 네임스페이스 키로 각 엔티티의 get/save 헬퍼를 만든다. 저장 시 `_v:1` 태깅, 손상 JSON은 기본값 반환, `QuotaExceededError`는 `false` 반환(실패 신호). 신규 유저 기본값 제공.
- **DoD**:
  - `saveUserCert`/`getUserCert` 왕복 시 deep-equal.
  - 키가 정확히 `certtimer.userCert`/`certtimer.checkins`/`certtimer.streak`/`certtimer.quiz`/`certtimer.flags`.
  - `localStorage["certtimer.checkins"]="{broken"` → `getCheckIns()===[]`, 예외/`console.error` 없음.
  - `setItem`가 throw 시 `saveCheckIns()===false`.
  - 빈 상태: `getUserCert()=null`, `getCheckIns()=[]`, `getStreak()={current:0,longest:0,lastCheckInDate:""}`, `getFlags()={onboarded:false,reportDisclaimerSeen:false}`.
  - 저장 payload에 `_v:1` 포함.
- **Covers**: [F1-AC1, F1-AC2, F1-AC3, F1-AC5, F1-AC6]
- **Files**: `src/lib/storage.ts`
- **Depends on**: Task 1.1

### Task 1.3 상태 관리 스토어 (React 훅/컨텍스트)
- **Description**: 저장소를 감싸 앱 전역 상태(UserCert, CheckIns, Streak, QuizProgress, Flags)를 읽고 갱신하는 경량 스토어 훅을 만든다. 저장 실패 시 Toast 트리거용 실패 신호를 전달하고, 체크인 누적/스트릭 갱신/퀴즈 오답 저장 같은 mutator를 노출한다.
- **DoD**: `useAppData()`가 각 엔티티와 mutator(`upsertCheckInToday`, `applyStreak`, `addWrongId`, `setUserCert`, `setFlags`)를 반환. mutator 호출 시 storage 저장 + 상태 리렌더. 저장 실패 시 `{ ok:false }` 반환으로 UI가 Toast 표시 가능. `setFlags`로 `reportDisclaimerSeen` 단독 갱신 가능. `tsc` 통과, 앱 컴파일 유지.
- **Covers**: [F1-AC4]
- **Files**: `src/lib/store.tsx`
- **Depends on**: Task 1.1, Task 1.2

### Task 1.4 상수 데이터 (내장 시험 50종 + 퀴즈 뱅크)
- **Description**: 내장 `Certification[]` 50종(id/name/category/examDate/recommendedTotalMinutes) 코드 상수와 카테고리별 퀴즈 문제 뱅크(O/X·객관식, 정답, 해설) 상수를 정의한다. 외부 호출 없음.
- **DoD**: `BUILTIN_CERTS.length===50`, 각 항목 `recommendedTotalMinutes>=60`·유효 `examDate`. "SQLD"=`{id:"cert_sqld",examDate:"2026-09-05",recommendedTotalMinutes:6000}` 포함. `QUIZ_BANK`이 카테고리별 배열 제공(각 카테고리 ≥3문제 보장, 미달 시 "기타" 폴백 문제로 채움), 각 문제 `{id,type,question,answer,explanation}`, `type∈{'ox','mcq'}`, `mcq`는 `options:string[]` 포함. `tsc` 통과.
- **Covers**: [F6-AC6]
- **Files**: `src/lib/constants/certs.ts`, `src/lib/constants/quiz.ts`
- **Depends on**: Task 1.1

### Task 1.5 순수 계산 함수 (D-day/목표/진행률/점수/스트릭/퀴즈 시드)
- **Description**: 결정론적 순수 함수 모음 — `calcDday`, `calcDailyGoal`, `calcProgress`(0~100 클램프), `updateStreak`, `calcScore`+`mapScoreLabel`, `pickDailyQuizIds`(날짜 시드 결정론). HEX/UI 없음. 모든 함수는 인자로 받은 "오늘" 문자열만 사용하고 `new Date()` 직접 호출 금지(테스트 결정론).
- **DoD**:
  - `calcDday("2026-09-05","2026-07-25")==="D-42"`, 과거면 `"D+N"`, 당일이면 `"D-DAY"`.
  - 목표: `calcDailyGoal`이 `{targetToday,label,state}` 반환. `ceil((6000-1200)/42)===115`; 누적≥목표 시 `state:'done'`·`label:"목표 달성! 오늘도 복습해요"`; 시험 경과(remainingDays≤0 & 미달) 시 `state:'expired'`·`label:"시험일이 지났어요"`; **remainingDays===0(당일)·미달 시 division-by-zero 없이 `targetToday=남은 목표 전량` 반환**(무한대/NaN 금지).
  - 진행률: `1200/6000===20`; 6500/6000 → `100`(초과·음수 없음); target=0 방어 시 `0` 반환(NaN 금지).
  - `updateStreak`: last=2026-07-24 오늘 25 첫체크인 → current+1·longest 갱신; last=2026-07-22 오늘 25 → current=1(리셋); last===오늘 재체크인 → current 불변(중복 증가 없음).
  - `calcScore` 동일 입력 → 동일 출력(진행률 60% + 추세 40% 고정 가중, 0~100 클램프). 체크인 0건 → `score=0`. `mapScoreLabel`: 25→"분발 필요", 55→"순항 중", 85→"합격 유력"; **경계 포함 규칙 명시: `<40`→분발 필요, `40~69`→순항 중, `>=70`→합격 유력** (40→순항 중, 70→합격 유력).
  - `pickDailyQuizIds(date, category)` 동일 날짜·카테고리 동일 세트(날짜 문자열 해시 시드), 뱅크 부족 시 있는 만큼만 반환.
- **Covers**: [F3-AC1, F3-AC2, F3-AC3, F3-AC5, F4-AC4, F4-AC5, F5-AC1, F5-AC4, F6-AC4]
- **Files**: `src/lib/calc.ts`
- **Depends on**: Task 1.1, Task 1.4

---

## Epic 2. API Routes

**외부 API 없음(MVP).** 모든 데이터는 localStorage, 계산은 Task 1.5 순수 함수로 처리. 크로스 디바이스 동기화는 향후 별도 Railway 서버로 분리(범위 외). → 태스크 없음.

---

## Epic 3. UI Pages (ONE page per task)

**Risk Assessment**
- **Complexity**: Medium~High
- **Risk factors**: (1) TDS 컴포넌트 padding/margin을 Tailwind/인라인으로 덮어쓰면 검수 반려. (2) 키보드가 제출 버튼을 가림(F4-AC7). (3) 리워드 광고 게이트 우회로 점수 노출(F5-AC3). (4) `data-testid` 레이아웃 계약 누락.
- **Mitigation**: 각 페이지 1태스크로 분리해 세션당 10분 내 완성. 여백은 `Spacing`만, 배치는 `ScreenScaffold`/`SubmitFooter` 사용. 게이트는 템플릿 `TossRewardAd`로만 처리해 우회 불가. 데이터/계산은 Epic 1에서 이미 검증되어 페이지는 렌더링·상태 처리에 집중.

### Task 3.1 자격증 선택/온보딩 페이지 `/select`
- **Description**: 내장 50종 검색·카테고리 필터·선택, 커스텀 등록 BottomSheet(name/목표시간/시험일). 선택/등록 시 UserCert 저장·`flags.onboarded=true`. 진입 `mode`에 따라 이동 분기: `onboard`(또는 undefined)→`navigate('/',{replace:true})`, `change`→`navigate('/',{replace:true})`(기존 UserCert 덮어쓰기).
- **DoD**:
  - "SQLD" 탭 → `{certId:"cert_sqld",name:"SQLD",examDate:"2026-09-05",targetTotalMinutes:6000}` 저장·onboarded=true·`/`이동.
  - 커스텀 제출 → `id="custom_"+timestamp` 저장·홈 이동.
  - 검색 "컴활" → 부분일치만 표시, 0건 시 "검색 결과가 없어요" + "직접 등록".
  - 빈 이름 → "시험 이름을 입력해주세요", 저장 안 됨.
  - 오늘(2026-07-25) 기준 과거 시험일 → "시험일은 오늘 이후로 설정해주세요", 저장 안 됨.
  - `mode`가 `onboard`/undefined이고 onboarded=true+UserCert 존재 시 진입하면 `/`로 리다이렉트. `mode:'change'` 진입 시에는 리다이렉트하지 않고 선택 화면 표시(자격증 교체 허용).
  - 렌더 전 스켈레톤 6행. `Top`/`TextField`/`ListRow`(≥56px)/`Chip`(≥44px)/`SubmitFooter` "직접 등록"(block). `location.state`는 `RouteState['/select']`로 캐스팅.
- **Covers**: [F2-AC1, F2-AC2, F2-AC3, F2-AC4, F2-AC5, F2-AC6, F2-AC7]
- **Files**: `src/pages/SelectPage.tsx`
- **Depends on**: Task 1.3, Task 1.4

### Task 3.2 홈 대시보드 페이지 `/`
- **Description**: D-day 카드, 진행률 히어로, 오늘 목표 카드 3개를 Task 1.5 계산으로 렌더. 체크인/리포트/자격증변경 네비. UserCert null 빈 상태.
- **DoD**:
  - `data-testid="dday-card"`·`progress-hero"`·`today-goal-card"` 3개 Card 존재, `ScreenScaffold` 래핑, D-day t2 강조.
  - examDate 과거 → "D+24" 및 목표 자리 `calcDailyGoal.state==='expired'` 문구 "시험일이 지났어요".
  - UserCert null → 빈 상태 카드(Asset.ContentIcon + "학습할 자격증을 선택해주세요") + "자격증 선택" → `navigate('/select',{state:{mode:'onboard'}})`.
  - "자격증 변경" 액션(ListRow 또는 Top 우측) → `navigate('/select',{state:{mode:'change'}})`.
  - 조회 중 스켈레톤 후 데이터 치환.
  - "오늘 공부 체크인"→`/checkin`, "합격 예측 리포트 보기"→`/report`(버튼 ≥48px). `SummaryHero`(CountUp), `Sparkline`(최근7일).
- **Covers**: [F3-AC1, F3-AC4, F3-AC6, F3-AC7, F3-AC8]
- **Depends on**: Task 1.3, Task 1.5
- **Files**: `src/pages/HomePage.tsx`

### Task 3.3 공부 체크인 페이지 `/checkin` + 완료 `/checkin/done`
- **Description**: `Tab`(스탑워치/수동), 스탑워치 측정→분 환산, 수동 numeric 입력, 오늘 레코드 누적 갱신, 스트릭 갱신, 완료 화면 이동(state 전달) + 완료 화면 배너 광고.
- **DoD**:
  - 수동 `{minutes:90,method:"manual"}` → 저장·Toast "90분 기록 완료!"·완료 이동.
  - 오늘 90분 존재 + 30분 → 레코드 `minutes:120` 갱신(신규 미생성).
  - 스탑워치 `00:25:30` "기록" → `26분`·`method:"stopwatch"` 누적.
  - 첫 체크인 시 스트릭 갱신(연속/리셋/당일중복은 Task 1.5 `updateStreak` 사용).
  - `minutes:0`/`1441` → "1분~1440분 사이로 입력해주세요", 저장 안 됨.
  - numeric 키보드(`inputMode="numeric"`), "기록" 버튼 `SubmitFooter` 하단 고정(키보드 위, ≥48px).
  - 완료 → `navigate('/checkin/done',{state:{minutesToday,streakCurrent}})`; 완료 화면은 state 없으면 저장소 재조회 fallback, 카드 하단에 `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID}/>`.
- **Covers**: [F4-AC1, F4-AC2, F4-AC3, F4-AC4, F4-AC5, F4-AC6, F4-AC7, F4-AC8]
- **Files**: `src/pages/CheckinPage.tsx`, `src/pages/CheckinDonePage.tsx`
- **Depends on**: Task 1.3, Task 1.5

### Task 3.4 합격 예측 리포트 페이지 `/report`
- **Description**: 최초 진입 시 면책 안내(BottomSheet, `reportDisclaimerSeen` 플래그), 이후 `TossRewardAd` 게이트 뒤에 점수 히어로·상태 Chip·조언 카드·Sparkline. 게이트 전 잠금, 체크인 0건 시 빈 상태(광고 미호출).
- **DoD**:
  - `flags.reportDisclaimerSeen===false`로 최초 진입 시 BottomSheet "본 리포트는 학습량 기반 통계 예측이며 합격을 보장하지 않아요" 표시 → "확인" 시 `setFlags({reportDisclaimerSeen:true})`, 이후 재진입 시 미표시.
  - 광고 시청 완료 후 본문(점수·라벨·조언) 표시; 미시청/닫음 시 블러·잠금 유지 + "광고 시청 후 리포트가 공개돼요", 점수 미노출.
  - 점수는 Task 1.5 `calcScore`로 결정론적; 라벨/Chip 색상 25/55/85→분발필요/순항중/합격유력(TDS 시맨틱 컬러), 경계 40/70 규칙(1.5) 준수.
  - 체크인 0건 → 광고 게이트 대신 "학습 기록이 있어야 예측할 수 있어요" + "체크인하러 가기"→`/checkin`, `TossRewardAd` 미호출.
  - 시청 직후 스켈레톤(≤300ms) 후 결과.
  - `data-testid="score-hero"`(SummaryHero CountUp)·`advice-card"` Card·Sparkline 존재. `TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}`.
- **Covers**: [F5-AC2, F5-AC3, F5-AC5, F5-AC6, F5-AC7]
- **Files**: `src/pages/ReportPage.tsx`
- **Depends on**: Task 1.3, Task 1.5

### Task 3.5 기출 키워드 퀴즈 페이지 `/quiz`
- **Description**: 하루 3문제 O/X·객관식, 즉시 피드백·해설, 오답 누적(중복 제거·FIFO 500 상한), 완료 잠금, 날짜 변경 시 새 세트, 진행 인디케이터.
- **DoD**:
  - 정답 선택 → "정답이에요"·`answeredIds` 추가·다음 문제.
  - 오답 → "오답이에요" + 해설·`wrongIds` 추가(중복 제거).
  - `answeredIds.length===3` 진입 → "오늘 퀴즈 완료! 내일 또 만나요", 추가 문제 미노출.
  - `quiz.date` 과거 → 오늘로 갱신·`answeredIds=[]`·새 3문제(`pickDailyQuizIds` 사용, `wrongIds` 유지).
  - `wrongIds.length===500`에서 새 오답 → 최오래 1개 제거 후 추가(FIFO 상한, Task 1.3 `addWrongId`).
  - 로드 중 스켈레톤; 뱅크 3문제 미만 시 "오늘은 N문제예요". 상단 "2 / 3" 진행 갱신. 선택 버튼 세로 `Spacing`·각 ≥48px.
- **Covers**: [F6-AC1, F6-AC2, F6-AC3, F6-AC5, F6-AC7]
- **Files**: `src/pages/QuizPage.tsx`
- **Depends on**: Task 1.3, Task 1.4, Task 1.5

---

## Epic 4. Integration + Landing

**Risk Assessment**
- **Complexity**: Medium
- **Risk factors**: (1) 미온보딩 상태에서 임의 경로 접근 시 빈 화면. (2) 외부 URL 이탈/HEX 하드코딩/`console.error` 잔존 → 토스 검수 즉시 반려. (3) 정의되지 않은 경로 접근 시 크래시.
- **Mitigation**: 페이지 완성 후 마지막에 라우팅·가드를 배선해 각 페이지가 독립적으로 검증된 상태에서 통합. 검수 가드를 별도 태스크로 분리해 정적 검사(외부이탈/HEX/설치유도 문구) 집중 수행.

### Task 4.1 앱 셸 · 라우팅 · 온보딩 가드
- **Description**: React Router로 `/select`,`/`,`/checkin`,`/checkin/done`,`/report`,`/quiz` 배선. `FloatingTabBar`(홈/퀴즈 등) 하단 탭, 미온보딩 리다이렉트, 미정의 경로 폴백을 구성한다.
- **DoD**:
  - `FloatingTabBar` 탭 → `/`,`/quiz` 전환, 각 터치 타깃 ≥44px.
  - `flags.onboarded=false`에서 임의 경로 진입 → `navigate('/select',{state:{mode:'onboard'}})` 리다이렉트. 단 `/select` 자체는 예외(무한 리다이렉트 방지).
  - 미정의 경로 → `/` 폴백.
  - 모든 라우트 `RouteState`에 맞춰 `navigate` 호출, 앱 컴파일 유지.
- **Covers**: [F7-AC1, F7-AC2, F7-AC7]
- **Files**: `src/App.tsx`, `src/components/AppShell.tsx`
- **Depends on**: Task 3.1, Task 3.2, Task 3.3, Task 3.4, Task 3.5

### Task 4.2 검수 가드 & 최종 폴리시 (외부이탈·색상·콘솔·문구)
- **Description**: 전 코드 정적 점검 — 외부 `window.location.href`/`window.open` 제거, HEX 리터럴 제거(→`var(--tds-color-*)`/TDS), `console.error` 0, 앱 설치 유도 문구 제거, 다크모드 동작 확인.
- **DoD**:
  - 코드에 외부 URL 이동 호출 없음(정적 검사 통과).
  - 프로덕션 빌드 전 플로우 `console.error` 0개, 외부 API 없음(CORS 0).
  - `#` HEX 리터럴 0개, 색상 토큰/TDS만 사용, 라이트/다크 정상.
  - "앱 설치/다운로드" 등 외부 앱 설치 유도 문구·배너·링크 없음.
- **Covers**: [F7-AC3, F7-AC4, F7-AC5, F7-AC6]
- **Files**: 전 페이지·컴포넌트 (검색/수정), `src/App.tsx`
- **Depends on**: Task 4.1

---

## AC Coverage

- **Total ACs in SPEC**: 50
- **Covered by tasks**: 50
  - F1 (6): AC1,AC2,AC3,AC5,AC6→1.2 · AC4→1.3 · AC6→1.1
  - F2 (7): AC1–AC7→3.1
  - F3 (8): AC1,AC2,AC3,AC5→1.5 · AC1,AC4,AC6,AC7,AC8→3.2
  - F4 (8): AC4,AC5→1.5 · AC1–AC8→3.3
  - F5 (7): AC1,AC4→1.5 · AC2,AC3,AC5,AC6,AC7→3.4
  - F6 (7): AC4→1.5 · AC6→1.4 · AC1,AC2,AC3,AC5,AC7→3.5
  - F7 (7): AC1,AC2,AC7→4.1 · AC3,AC4,AC5,AC6→4.2
- **Uncovered**: 0 ✅

---

### 변경 요약 (gap fixes)
1. **`reportDisclaimerSeen` 소비처 추가** (Task 3.4): SPEC의 `AppFlags.reportDisclaimerSeen`가 어떤 태스크에서도 사용되지 않던 gap → 최초 리포트 진입 시 면책 BottomSheet + 플래그 셋 DoD 추가.
2. **F1-AC4 이중 배정 해소**: Task 1.2 Covers에서 AC4 제거(→ Task 1.3 단독), AC Coverage 매트릭스 정정.
3. **계산 엣지케이스 명시** (Task 1.5): remainingDays===0 division-by-zero, target=0 NaN 방어, `updateStreak` 당일 중복 방지, `calcScore` 체크인 0건, 경계값 40/70 포함 규칙을 DoD 라인으로 명문화.
4. **"자격증 변경" 플로우 정의** (Task 1.1 RouteState `mode` 추가, Task 3.1/3.2/4.1): 홈에서 참조하던 미정의 네비를 `navigate('/select',{state:{mode:'change'}})`로 계약화하고 리다이렉트 가드 예외 처리.
5. **퀴즈 뱅크 최소 보장** (Task 1.4): 카테고리별 ≥3문제·폴백 규칙과 `mcq` options 구조를 DoD에 추가.