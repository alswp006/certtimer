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
 */
export interface Certification {
  id: string;
  name: string;
  category: string;
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
// Navigation Types — RouteState discriminated unions
// ============================================================================

/**
 * RouteState — typed navigation contracts per path
 *
 * Each route has a specific state shape:
 * - /checkin/done: { minutesToday, streakCurrent }
 * - /select: { mode: 'onboard' | 'change' }
 * - /, /checkin, /report, /quiz: no navigation state required
 */
export type RouteState =
  | {
      pathname: '/checkin/done';
      state: {
        minutesToday: number;
        streakCurrent: number;
      };
    }
  | {
      pathname: '/s
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
    FloatingTabBar.tsx
    MiniBar.tsx
    PageShell.tsx
    ScreenScaffold.tsx
    Sparkline.tsx
    StateView.tsx
    SummaryHero.tsx
    TossPurchase.tsx
    TossRewardAd.tsx
  hooks/
  lib/
    storage.ts
    types.ts
    utils.ts
  main.tsx
  pages/
    Home.tsx
    __TdsGallery.tsx
  styles/
    globals.css
    reward-ad.css
  types/
  vite-env.d.ts

### Exports (src/lib/)
- storage.ts: export function getItem<T>(key: string): T | null; export function setItem<T>(key: string, value: T): void; export function removeItem(key: string): void
- types.ts: export interface Certification; export interface UserCert; export interface CheckIn; export interface StreakState; export interface QuizProgress; export interface AppFlags; export type ScoreLabel = '분발 필요' | '순항 중' | '합격 유력'; export interface DailyGoal
- utils.ts: export function cn(...classes: (string | boolean | undefined | null)[]): string; export function formatNumber(n: number): string; export function formatCurrency(n: number, currency = 'KRW'): string

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
CRITICAL: Before creating any new function, type, or component, check the list above. If something similar exists, import and use it.

## Already Implemented (do NOT duplicate or overwrite)
- 0001: TypeScript 타입 정의 + RouteState 계약 (files: src/lib/types.ts)
- 0002: localStorage 저장소 헬퍼 (CRUD + 안전 처리) (files: src/lib/storage.ts)