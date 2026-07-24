/**
 * 순수 계산 함수 모음 — D-day/목표/진행률/점수/스트릭/퀴즈 시드
 * 모든 함수는 "오늘" 날짜를 인자로 받는다(new Date() 직접 호출 금지 — 테스트 결정론 보장).
 */

// "YYYY-MM-DD"를 UTC 자정 타임스탬프로 파싱 — 로컬 타임존에 따른 D-day 오프바이원 방지
function parseDateUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

const MS_PER_DAY = 86400000;

function diffDays(from: string, to: string): number {
  return Math.round((parseDateUTC(to) - parseDateUTC(from)) / MS_PER_DAY);
}

// ============================================================================
// AC-1: D-day & 일일 목표
// ============================================================================

export function calcDday(targetDate: string, today: string): string {
  const diff = diffDays(today, targetDate);
  if (diff === 0) return 'D-DAY';
  if (diff > 0) return `D-${diff}`;
  return `D+${-diff}`;
}

export function calcDailyGoal(
  targetAmount: number,
  current: number,
  remainingDays: number
): number {
  if (remainingDays <= 0) return 0;
  const remaining = targetAmount - current;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / remainingDays);
}

// ============================================================================
// AC-2: 진행률 & 오늘의 목표량
// ============================================================================

export function calcProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  const pct = (current / target) * 100;
  if (!Number.isFinite(pct)) return 0;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

export function calcTargetToday(
  targetAmount: number,
  current: number,
  remainingDays: number
): number {
  const remaining = Math.max(targetAmount - current, 0);
  if (remainingDays <= 0) return remaining;
  return Math.ceil(remaining / remainingDays);
}

// ============================================================================
// AC-3: 점수 & 스트릭
// ============================================================================

export type CalcScoreLabel = '분발필요' | '순항중' | '합격유력';

export function mapScoreLabel(score: number): CalcScoreLabel {
  if (score < 40) return '분발필요';
  if (score < 70) return '순항중';
  return '합격유력';
}

export interface ScoreCheckIn {
  date: string;
  amount: number;
}

export function calcScore(
  checkIns: ScoreCheckIn[],
  targetAmount: number,
  _today: string
): number {
  if (!checkIns || checkIns.length === 0) return 0;
  const total = checkIns.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  return calcProgress(total, targetAmount);
}

export interface StreakCounters {
  current: number;
  best: number;
}

export function updateStreak(
  streak: StreakCounters,
  lastCheckInDate: string,
  today: string
): StreakCounters {
  const diff = diffDays(lastCheckInDate, today);
  const current = diff === 0 ? streak.current : diff === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current) };
}

// ============================================================================
// 퀴즈 시드 — 날짜 기반 결정론적 선택
// ============================================================================

function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// mulberry32 — 작고 의존성 없는 시드 기반 PRNG(날짜 문자열 시드로 결정론적 셔플)
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickDailyQuizIds<T extends { id: string }>(
  quizBank: T[],
  count: number,
  today: string
): string[] {
  const take = Math.min(count, quizBank.length);
  const rand = mulberry32(hashStringToInt(today));
  const indices = quizBank.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, take).map((i) => quizBank[i].id);
}
