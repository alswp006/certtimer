import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserCert, CheckIn, StreakState, QuizProgress, AppFlags } from '@/lib/types';
import { updateStreak } from './calc.ts';
import { todayStr } from './utils.ts';
import {
  getUserCert,
  saveUserCert,
  getCheckIns,
  saveCheckIns,
  getStreak,
  saveStreak,
  getQuizProgress,
  saveQuizProgress,
  getFlags,
  saveFlags,
} from './storage.ts';

interface MutationResult {
  ok: boolean;
}

interface AppDataValue {
  userCert: UserCert | null;
  checkIns: CheckIn[];
  streak: StreakState;
  quiz: QuizProgress | null;
  flags: AppFlags;
  upsertCheckInToday: (minutes: number, method: CheckIn['method']) => MutationResult;
  applyStreak: () => MutationResult;
  addWrongId: (id: string) => MutationResult;
  answerQuizQuestion: (id: string, correct: boolean) => MutationResult;
  setUserCert: (cert: UserCert) => MutationResult;
  setFlags: (partial: Partial<Omit<AppFlags, '_v'>>) => MutationResult;
}

const AppDataContext = createContext<AppDataValue | null>(null);

const MAX_WRONG_IDS = 500;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [userCert, setUserCertState] = useState<UserCert | null>(() => getUserCert());
  const [checkIns, setCheckIns] = useState<CheckIn[]>(() => getCheckIns());
  const [streak, setStreak] = useState<StreakState>(() => getStreak());
  const [quiz, setQuiz] = useState<QuizProgress | null>(() => getQuizProgress());
  const [flags, setFlagsState] = useState<AppFlags>(() => getFlags());

  function upsertCheckInToday(minutes: number, method: CheckIn['method']): MutationResult {
    const date = todayStr();
    const idx = checkIns.findIndex((c) => c.date === date);
    const next: CheckIn[] =
      idx >= 0
        ? checkIns.map((c, i) =>
            i === idx ? { ...c, minutes: c.minutes + minutes, method, updatedAt: Date.now() } : c
          )
        : [...checkIns, { id: `checkin_${date}`, date, minutes, method, updatedAt: Date.now(), _v: 1 }];

    setCheckIns(next);
    return { ok: saveCheckIns(next) };
  }

  function applyStreak(): MutationResult {
    const date = todayStr();
    if (streak.lastCheckInDate === date) {
      return { ok: true };
    }
    const result = streak.lastCheckInDate
      ? updateStreak({ current: streak.current, best: streak.longest }, streak.lastCheckInDate, date)
      : { current: 1, best: Math.max(streak.longest, 1) };
    const next: StreakState = {
      current: result.current,
      longest: result.best,
      lastCheckInDate: date,
      _v: 1,
    };
    setStreak(next);
    return { ok: saveStreak(next) };
  }

  function addWrongId(id: string): MutationResult {
    const date = todayStr();
    const next: QuizProgress =
      quiz && quiz.date === date
        ? { ...quiz, wrongIds: quiz.wrongIds.includes(id) ? quiz.wrongIds : [...quiz.wrongIds, id] }
        : { date, answeredIds: [], wrongIds: [id], _v: 1 };

    setQuiz(next);
    return { ok: saveQuizProgress(next) };
  }

  // 정답 처리 + 오답 저장을 한 번의 setState로 원자 처리(연속 호출 시 stale closure로 인한 유실 방지).
  function answerQuizQuestion(id: string, correct: boolean): MutationResult {
    const date = todayStr();
    const base: QuizProgress =
      quiz && quiz.date === date ? quiz : { date, answeredIds: [], wrongIds: quiz?.wrongIds ?? [], _v: 1 };
    const answeredIds = base.answeredIds.includes(id) ? base.answeredIds : [...base.answeredIds, id];
    let wrongIds = base.wrongIds;
    if (!correct && !wrongIds.includes(id)) {
      wrongIds = wrongIds.length >= MAX_WRONG_IDS ? [...wrongIds.slice(1), id] : [...wrongIds, id];
    }
    const next: QuizProgress = { date, answeredIds, wrongIds, _v: 1 };
    setQuiz(next);
    return { ok: saveQuizProgress(next) };
  }

  function setUserCert(cert: UserCert): MutationResult {
    setUserCertState(cert);
    return { ok: saveUserCert(cert) };
  }

  function setFlags(partial: Partial<Omit<AppFlags, '_v'>>): MutationResult {
    const next: AppFlags = { ...flags, ...partial, _v: 1 };
    setFlagsState(next);
    return { ok: saveFlags(next) };
  }

  const value: AppDataValue = {
    userCert,
    checkIns,
    streak,
    quiz,
    flags,
    upsertCheckInToday,
    applyStreak,
    addWrongId,
    answerQuizQuestion,
    setUserCert,
    setFlags,
  };

  return React.createElement(AppDataContext.Provider, { value }, children);
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return ctx;
}
