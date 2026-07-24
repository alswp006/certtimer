/**
 * TDD — F5(합격 예측 리포트)·F6(퀴즈) P0 AC 커버리지
 * SPEC 검증 중 발견: /report, /quiz 라우트가 ComingSoon 플레이스홀더였고
 * 실제 화면(F5/F6 요구사항)이 구현되어 있지 않았다. 이 스위트는 새로 구현한
 * Report.tsx/Quiz.tsx가 SPEC의 [P0] AC를 충족하는지 검증한다.
 */
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockAll } from '@/__tests__/__helpers__/mocks';
import { pickDailyQuizIds } from '@/lib/calc';
import { QUIZ_BANK } from '@/lib/constants/quiz';

mockAll();

import App from '@/App';

afterEach(() => {
  cleanup();
});

function renderAt(route: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)),
  );
}

const USER_CERT = {
  certId: 'cert_sqld',
  name: 'SQLD',
  examDate: '2026-09-05',
  targetTotalMinutes: 6000,
  selectedAt: 1750000000000,
  _v: 1,
};

function seedUserCert() {
  localStorage.setItem('certtimer.userCert', JSON.stringify(USER_CERT));
}

describe('F5 합격 예측 리포트 — /report', () => {
  it('AC-7[P0]: 광고 시청 후(mock=즉시 unlock) score-hero·advice-card 레이아웃 계약을 렌더한다', () => {
    seedUserCert();
    localStorage.setItem(
      'certtimer.checkins',
      JSON.stringify([{ id: 'ci_1', date: '2026-07-25', minutes: 90, method: 'manual', updatedAt: 1, _v: 1 }]),
    );

    renderAt('/report');

    expect(screen.getByTestId('score-hero').getAttribute('data-testid')).toBe('score-hero');
    expect(screen.getByTestId('advice-card').getAttribute('data-testid')).toBe('advice-card');
    expect(screen.getByTestId('report-sparkline').getAttribute('data-testid')).toBe('report-sparkline');
  });

  it('AC-4[P0]: 상태 라벨이 분발 필요/순항 중/합격 유력 중 하나로 표시된다(띄어쓰기 포함 SPEC 표기)', () => {
    seedUserCert();
    localStorage.setItem(
      'certtimer.checkins',
      JSON.stringify([{ id: 'ci_1', date: '2026-07-25', minutes: 90, method: 'manual', updatedAt: 1, _v: 1 }]),
    );

    renderAt('/report');

    const validLabels = ['분발 필요', '순항 중', '합격 유력'];
    const found = validLabels.some((label) => screen.queryByText(label) !== null);
    expect(found).toBe(true);
  });

  it('AC-5[P1]: 체크인 기록이 0건이면 광고 게이트 없이 빈 상태로 안내한다', () => {
    seedUserCert();

    renderAt('/report');

    expect(screen.getByTestId('report-empty').getAttribute('data-testid')).toBe('report-empty');
    expect(screen.getByText('학습 기록이 있어야 예측할 수 있어요').textContent).toBe(
      '학습 기록이 있어야 예측할 수 있어요',
    );
    expect(screen.getByRole('button', { name: /체크인하러 가기/ })).toBeTruthy();
    // 점수 값(score-hero)은 노출되지 않아야 함
    expect(screen.queryByTestId('score-hero')).toBeNull();
  });
});

describe('F6 기출 키워드 퀴즈 — /quiz', () => {
  it('AC-1/AC-2[P0]: 선택 즉시 정답/오답 피드백을 표시하고 진행도가 갱신된다', () => {
    seedUserCert();

    renderAt('/quiz');

    expect(screen.getByTestId('quiz-question-card')).toBeTruthy();
    expect(screen.getByText('1 / 3').textContent).toBe('1 / 3');

    // 문제 카드 아래 옵션 버튼(O/X 또는 보기) 중 첫 번째를 선택 — FloatingTabBar는 role="tab"이라 제외됨
    const optionButtons = screen.getAllByRole('button');
    expect(optionButtons.length).toBeGreaterThan(0);
    fireEvent.click(optionButtons[0]);

    const feedbackCard = screen.getByTestId('quiz-feedback-card');
    expect(feedbackCard.textContent).toMatch(/정답이에요|오답이에요/);

    // 저장소에 오늘 세트 진행 상황이 기록됨(answeredIds 1개)
    const quizProgress = JSON.parse(localStorage.getItem('certtimer.quiz') ?? '{}');
    expect(quizProgress.date).toBe('2026-07-25');
    expect(quizProgress.answeredIds.length).toBe(1);
  });

  it('AC-3[P0]: 오늘 3문제를 모두 풀면 완료 상태로 잠기고 추가 문제가 노출되지 않는다', () => {
    seedUserCert();

    const bank = QUIZ_BANK.IT;
    const todayIds = pickDailyQuizIds(bank, 3, '2026-07-25');
    localStorage.setItem(
      'certtimer.quiz',
      JSON.stringify({ date: '2026-07-25', answeredIds: todayIds, wrongIds: [], _v: 1 }),
    );

    renderAt('/quiz');

    expect(screen.getByTestId('quiz-complete').getAttribute('data-testid')).toBe('quiz-complete');
    expect(screen.getByText('오늘 퀴즈 완료! 내일 또 만나요').textContent).toBe(
      '오늘 퀴즈 완료! 내일 또 만나요',
    );
    expect(screen.queryByTestId('quiz-question-card')).toBeNull();
  });
});
