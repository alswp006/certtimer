/**
 * TDD RED phase — packet heal-2-01
 * 온보딩 가드를 라우터 단일 지점으로 통합하고 충돌 테스트 정합화
 *
 * 지금까지 /checkin·/checkin/done·/wrong만 <OnboardingGuard>로 감쌌고, Home("/")과
 * Report("/report")는 각자 `!userCert` 조건으로 자체 EmptyState + 수동 navigate('/select')
 * CTA를 그렸다(App.tsx 주석 참조). 이 패킷은 그 화면별 처리를 걷어내고, "/"·"/report"·"/quiz"까지
 * 포함한 모든 보호 라우트를 라우터 최상위 가드 1곳(OnboardingGuard/RequireOnboarding)에서만
 * 리다이렉트하도록 통합한다.
 *
 * AC-1: 미온보딩(onboarded=false·userCert 없음) 상태에서 보호 라우트 접근 시 /select로 리다이렉트된다
 * AC-2: 온보딩 완료 상태(userCert 존재)에서는 모든 보호 라우트가 정상 렌더된다
 * AC-3: 리다이렉트 로직은 가드 1곳에만 존재하고 개별 화면(Home/Report)엔 없다
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockAll } from '@/__tests__/__helpers__/mocks';

// react-router-dom은 실제 구현을 사용한다 — 가드가 진짜 라우트 매칭 위에서 리다이렉트하는지
// 검증하려면 useLocation()이 MemoryRouter의 실제 initialEntries를 반영해야 한다.
mockAll();

import App from '@/App';

const APP_SRC = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');
const HOME_SRC = fs.readFileSync(path.resolve(__dirname, '../pages/Home.tsx'), 'utf-8');
const REPORT_SRC = fs.readFileSync(path.resolve(__dirname, '../pages/Report.tsx'), 'utf-8');

const SELECT_SEARCH_PLACEHOLDER = '자격증 이름으로 검색';

// 보호 라우트 목록 + 가드를 통과했을 때만 보이는 고유 텍스트(각 화면의 <Top> 제목).
// Report/Quiz는 데이터 유무와 무관하게 모든 분기에서 동일한 top이 렌더되므로 안정적인 증거가 된다.
const PROTECTED_ROUTES: Array<[string, string]> = [
  ['/', 'CertTimer'],
  ['/checkin', '오늘 공부 체크인'],
  ['/checkin/done', '체크인 완료'],
  ['/report', '합격 예측 리포트'],
  ['/quiz', '오늘의 퀴즈'],
  ['/wrong', '오답노트'],
];

const SEEDED_CERT = {
  certId: 'cert_sqld',
  name: 'SQLD',
  examDate: '2027-01-01',
  targetTotalMinutes: 3000,
  selectedAt: 1750000000000,
  _v: 1,
};

function seedOnboarded() {
  localStorage.setItem('certtimer.userCert', JSON.stringify(SEEDED_CERT));
  localStorage.setItem(
    'certtimer.flags',
    JSON.stringify({ onboarded: true, reportDisclaimerSeen: true, _v: 1 }),
  );
}

function renderAt(route: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)),
  );
}

describe('온보딩 가드를 라우터 단일 지점으로 통합하고 충돌 테스트 정합화', () => {
  describe('AC-1[P0]: 미온보딩 상태에서 보호 라우트 접근 시 /select로 리다이렉트된다', () => {
    it.each(PROTECTED_ROUTES)(
      '%s 접근 시 온보딩 전이면 /select 검색 화면으로 리다이렉트되고 원래 화면 콘텐츠는 렌더되지 않는다',
      (route, ownTitle) => {
        renderAt(route);
        expect(screen.getByPlaceholderText(SELECT_SEARCH_PLACEHOLDER).getAttribute('placeholder')).toBe(
          SELECT_SEARCH_PLACEHOLDER,
        );
        expect(screen.queryByText(ownTitle)).toBeNull();
      },
    );

    it("/select 자체는 온보딩 여부와 무관하게 리다이렉트 대상에서 제외된다", () => {
      renderAt('/select');
      expect(screen.getByPlaceholderText(SELECT_SEARCH_PLACEHOLDER).getAttribute('placeholder')).toBe(
        SELECT_SEARCH_PLACEHOLDER,
      );
      expect(screen.getByText('학습할 자격증 선택').textContent).toBe('학습할 자격증 선택');
    });
  });

  describe('AC-2[P0]: 온보딩 완료 상태에서는 모든 보호 라우트가 정상 렌더된다', () => {
    it.each(PROTECTED_ROUTES)(
      '온보딩 완료(userCert 존재) 상태에서 %s는 가드를 통과해 자기 화면(%s)을 렌더한다',
      (route, ownTitle) => {
        seedOnboarded();
        renderAt(route);
        expect(screen.queryByPlaceholderText(SELECT_SEARCH_PLACEHOLDER)).toBeNull();
        expect(screen.getByText(ownTitle).textContent).toBe(ownTitle);
      },
    );
  });

  describe('AC-3[P0]: 리다이렉트 로직은 가드 1곳에만 존재하고 개별 화면엔 없다', () => {
    it('Home.tsx/Report.tsx는 더 이상 userCert 부재를 직접 검사해 자체 빈 상태·수동 리다이렉트 CTA를 그리지 않는다', () => {
      expect(HOME_SRC).not.toMatch(/!\s*userCert/);
      expect(HOME_SRC).not.toMatch(/navigate\(\s*['"]\/select/);
      expect(REPORT_SRC).not.toMatch(/!\s*userCert/);
    });

    it('App.tsx는 온보딩 가드를 "/","/report","/quiz"를 포함한 보호 라우트에 적용하고 있다(정적 참조)', () => {
      // App.tsx 어딘가에서 온보딩 가드(예: guarded()/RequireOnboarding)가 실제로 참조되어야 한다 —
      // 구체적 래핑 문법은 구현 자유지만, 가드 자체를 아예 안 쓰는 회귀는 여기서 잡는다.
      expect(APP_SRC).toMatch(/OnboardingGuard|RequireOnboarding/);
    });

    it('Report는 온보딩 리다이렉트를 가드에 위임하되, 체크인 0건일 때의 report-empty 빈 상태는 그대로 유지한다', () => {
      seedOnboarded();
      renderAt('/report');
      expect(screen.getByTestId('report-empty').getAttribute('data-testid')).toBe('report-empty');
      expect(screen.getByText('학습 기록이 있어야 예측할 수 있어요').textContent).toBe(
        '학습 기록이 있어야 예측할 수 있어요',
      );
    });
  });
});
