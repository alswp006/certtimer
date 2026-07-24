# Shared Context (auto-generated — do NOT modify)


## Shared Types Contract (IMPORT these, do NOT redefine)
```typescript
/**
 * Domain Type Definitions — Packet 0001
 *
 * Schema version (_v: 1) ensures breaking changes are tracked and handled.
 * RouteState defines navigation contracts between pages.
 * All types are runtime-compatible (no generics, discriminated unions for routing).
 */

// ============================================================================
// Entity Types — all with _v:1 schema version
// ============================================================================

/**
 * Certification metadata — available exams user can select
 * examDate/recommendedTotalMinutes/isBuiltIn are populated for built-in presets (see src/lib/constants/certs.ts)
 */
export interface Certification {
  id: string;
  name: string;
  category: string;
  examDate?: string; // ISO "YYYY-MM-DD"
  recommendedTotalMinutes?: number; // 권장 총 학습시간(분), >= 60
  isBuiltIn?: boolean;
  _v: 1;
}

/**
 * UserCert — user's selected certification with target exam date
 * One active cert at a time (stored in certtimer.userCert)
 */
export interface UserCert {
  certId: string;
  name: string;
  examDate: string; // YYYY-MM-DD
  targetTotalMinutes: number;
  selectedAt: number; // timestamp
  _v: 1;
}

/**
 * CheckIn — single study session log
 * method: 'stopwatch' (real-time) or 'manual' (user enters minutes)
 */
export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  method: 'stopwatch' | 'manual';
  updatedAt: number; // timestamp
  _v: 1;
}

/**
 * StreakState — consecutive days of study
 */
export interface StreakState {
  current: number;
  longest: number;
  lastCheckInDate: string; // YYYY-MM-DD
  _v: 1;
}

/**
 * QuizProgress — daily quiz answers (optional gamification)
 */
export interface QuizProgress {
  date: string; // YYYY-MM-DD
  answeredIds: string[];
  wrongIds: string[];
  _v: 1;
}

/**
 * AppFlags — app-wide feature flags
 */
export interface AppFlags {
  onboarded: boolean;
  reportDisclaimerSeen: boolean;
  _v: 1;
}

/**
 * QuizQuestion — static quiz bank content (bundled code constant, not persisted directly)
 */
export interface QuizQuestion {
  id: string;
  type: 'ox' | 'mcq';
  question: string;
  answer: boolean | string; // ox: boolean, mcq: correct option string
  explanation: string;
  options?: string[]; // required for type: 'mcq'
}

// ============================================================================
// Calculation Types
// ============================================================================

/**
 * ScoreLabel — study performance classification
 */
export type ScoreLabel = '분발 필요' | '순항 중' | '합격 유력';

/**
 * DailyGoal — today's study target status
 */
export interface DailyGoal {
  targetToday: number; // minutes
  label: string;
  state: 'onTrack' | 'done' | 'expired';
}

/**
 * ScoreResult — score + label pair (used in results)
 */
export interface ScoreResult {
  score: number;
  label: ScoreLabel;
}

// ============================================================================
// Naviga
// ...truncated
```

## Existing Codebase (import and use these — do NOT recreate)
### File Tree (src/)
  App.tsx
  components/
    AdSlot.tsx
    Amount.tsx
    BottomCTA.tsx
    Card.tsx
    CountUp.tsx
    FloatingTabBar/
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
    __DebugTabBarNoSdk.tsx
    tabItems.ts
  data/
  hooks/
  lib/
    calc.ts
    constants/
    storage.ts
    store.ts
    store.tsx
    types.ts
    utils.ts
  main.tsx
  pages/
    Checkin.tsx
    CheckinDone.tsx
    Home.tsx
    Quiz.tsx
    Report.tsx
    Select.tsx
    __TdsGallery.tsx
  store/
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- calc.ts: export function calcDday(targetDate: string, today: string): string; export function daysUntil(targetDate: string, today: string): number; export function calcDailyGoal( targetAmount: number, current: number, remainingDays: number ): number; export function calcProgress(current: number, target: number): number; export function calcTargetToday( targetAmount: number, current: number, remainingDays: number ): number; export type CalcScoreLabel = '분발필요' | '순항중' | '합격유력'; export function mapScoreLabel(score: number): CalcScoreLabel; export interface ScoreCheckIn
- constants/certs.ts: export const BUILTIN_CERTS: Certification[] = [ // IT
- constants/quiz.ts: export const QUIZ_BANK: Record<string, QuizQuestion[]> = withFallback(RAW_QUIZ_BANK)
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void; export function getUserCert(): UserCert | null; export function saveUserCert(cert: UserCert): boolean; export function getCheckIns(): CheckIn[]; export function saveCheckIns(checkIns: CheckIn[]): boolean; export function getStreak(): StreakState
- store.ts: export function AppDataProvider(; export function useAppData(): AppDataValue
- types.ts: export interface Certification; export interface UserCert; export interface CheckIn; export interface StreakState; export interface QuizProgress; export interface AppFlags; export interface QuizQuestion; export type ScoreLabel = '분발 필요' | '순항 중' | '합격 유력'
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string; export function todayStr(): string

### Components (src/components/)
- AdSlot.tsx: AdSlot
- Amount.tsx: Amount
- BottomCTA.tsx: SubmitFooter, ButtonStack
- Card.tsx: Card
- CountUp.tsx: CountUp
- FloatingTabBar.tsx: FloatingTabBar
- MiniBar.tsx: MiniBar
- PageShell.tsx: PageShell
- ScreenScaffold.tsx: ScreenScaffold
- Sparkline.tsx: Sparkline
- StateView.tsx: EmptyState, LoadingState
- SummaryHero.tsx: SummaryHero
- TossPurchase.tsx: TossPurchase
- TossRewardAd.tsx: TossRewardAd
- __DebugTabBarNoSdk.tsx: DebugTabBarNoSdk

### Module Dependencies (import graph)
  lib/storage.ts → imports: lib/types
  lib/store.ts → imports: lib/types
  pages/Checkin.tsx → imports: components/ScreenScaffold, components/BottomCTA, components/Card, lib/store, lib/calc, lib/utils
  pages/CheckinDone.tsx → imports: components/ScreenScaffold, components/Card, components/Amount, components/AdSlot, lib/store, lib/utils
  pages/Home.tsx → imports: components/ScreenScaffold, components/SummaryHero, components/Card, components/CountUp, components/StateView, components/FloatingTabBar, components/tabItems, lib/store, lib/calc, lib/utils
  pages/Quiz.tsx → imports: components/ScreenScaffold, components/Card, components/StateView, components/FloatingTabBar, components/tabItems, lib/store, lib/constants/quiz, lib/constants/certs, lib/calc, lib/utils, lib/types
  pages/Report.tsx → imports: components/ScreenScaffold, components/SummaryHero, components/Card, components/CountUp, components/Sparkline, components/StateView, components/TossRewardAd, components/FloatingTabBar, components/tabItems, lib/store, lib/calc, lib/utils, lib/types
  pages/Select.tsx → imports: components/ScreenScaffold, components/BottomCTA, components/StateView, lib/store, lib/constants/certs, lib/calc, lib/utils, lib/types
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: TypeScript 타입 정의 + RouteState 계약 (files: src/lib/types.ts)
- 0002: localStorage 저장소 헬퍼 (CRUD + 안전 처리) (files: src/lib/storage.ts)
- 0003: 상태 관리 스토어 (useAppData 훅/컨텍스트) (files: src/lib/store.tsx)
- 0004: 상수 데이터 (내장 시험 50종 + 퀴즈 뱅크) (files: src/lib/constants/certs.ts, src/lib/constants/quiz.ts)
- 0005: 순수 계산 함수 (D-day/목표/진행률/점수/스트릭/퀴즈 시드) (files: src/lib/calc.ts)
- heal-1-01: 앱 셸·라우팅·Provider 최소 골격 확립(빌드 통과 우선) (files: src/App.tsx, src/main.tsx, src/routes.tsx, src/components/FloatingTabBar/index.tsx)
- heal-1-02: 공유 계약 export 표면 정합화(페이지 소비 지점 고정) (files: src/types/index.ts, src/store/useAppData.ts, src/lib/storage.ts, src/lib/calc.ts, src/data/index.ts)
- 0015: 온보딩 가드 · 광고 배치 · 검수 가드 폴리시 (files: src/lib/guard.tsx, src/components/AdPlacement.tsx)
- heal-2-01: 온보딩 가드를 라우터 단일 지점으로 통합하고 충돌 테스트 정합화 (files: src/App.tsx, src/routes/RequireOnboarding.tsx, src/routes/index.tsx, src/pages/*/index.tsx, test/packet-0014.test.tsx, test/packet-0016.test.tsx, test/packet-heal-1-01.test.tsx)