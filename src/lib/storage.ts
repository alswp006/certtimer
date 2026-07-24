import type { UserCert, CheckIn, StreakState, QuizProgress, AppFlags } from '@/lib/types';

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeItem(key: string): void {
  localStorage.removeItem(key);
}

const KEYS = {
  userCert: 'certtimer.userCert',
  checkins: 'certtimer.checkins',
  streak: 'certtimer.streak',
  quiz: 'certtimer.quiz',
  flags: 'certtimer.flags',
} as const;

const DEFAULT_STREAK: StreakState = { current: 0, longest: 0, lastCheckInDate: '', _v: 1 };
const DEFAULT_FLAGS: AppFlags = { onboarded: false, reportDisclaimerSeen: false, _v: 1 };

function save<T>(key: string, value: T): boolean {
  try {
    setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getUserCert(): UserCert | null {
  return getItem<UserCert>(KEYS.userCert);
}

export function saveUserCert(cert: UserCert): boolean {
  return save(KEYS.userCert, { ...cert, _v: 1 });
}

export function getCheckIns(): CheckIn[] {
  const data = getItem<CheckIn[]>(KEYS.checkins);
  return Array.isArray(data) ? data : [];
}

export function saveCheckIns(checkIns: CheckIn[]): boolean {
  return save(KEYS.checkins, checkIns);
}

export function getStreak(): StreakState {
  return getItem<StreakState>(KEYS.streak) ?? DEFAULT_STREAK;
}

export function saveStreak(streak: StreakState): boolean {
  return save(KEYS.streak, { ...streak, _v: 1 });
}

export function getQuizProgress(): QuizProgress | null {
  return getItem<QuizProgress>(KEYS.quiz);
}

export function saveQuizProgress(quiz: QuizProgress): boolean {
  return save(KEYS.quiz, { ...quiz, _v: 1 });
}

export function getFlags(): AppFlags {
  return getItem<AppFlags>(KEYS.flags) ?? DEFAULT_FLAGS;
}

export function saveFlags(flags: AppFlags): boolean {
  return save(KEYS.flags, { ...flags, _v: 1 });
}
