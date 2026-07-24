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
      pathname: '/select';
      state: {
        mode: 'onboard' | 'change';
      };
    }
  | {
      pathname: '/';
      state?: undefined;
    }
  | {
      pathname: '/checkin';
      state?: undefined;
    }
  | {
      pathname: '/report';
      state?: undefined;
    }
  | {
      pathname: '/quiz';
      state?: undefined;
    };
