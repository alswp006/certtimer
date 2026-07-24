/**
 * Packet: 라우팅 와이어링 + Provider 연결 + 통합 폴리시
 *
 * TDD Red Phase — App.tsx / main.tsx must:
 * - AC-1: define a <Route> for every page (/select, /, /checkin, /checkin/done, /report, /quiz, /wrong)
 *   and render each without crashing.
 * - AC-2: every navigate() target used anywhere under src/pages must resolve to a Route defined in App.tsx.
 * - AC-3: main.tsx keeps its @AI:ANCHOR TDSMobileAITProvider + BrowserRouter wiring untouched,
 *   and does not itself pull in app-level providers (those belong in App.tsx).
 * - AC-4: the app renders correctly at '/' — both the empty (no UserCert) and populated (UserCert set) states.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockTds, mockAppsInToss, mockTossRewardAd } from '@/__tests__/__helpers__/mocks';

// react-router-dom is intentionally left unmocked so navigate()↔Route wiring is exercised for real.
mockTds();
mockAppsInToss();
mockTossRewardAd();

import App from '@/App';

const APP_SRC = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');
const MAIN_SRC = fs.readFileSync(path.resolve(__dirname, '../main.tsx'), 'utf-8');

const ROUTES = ['/select', '/', '/checkin', '/checkin/done', '/report', '/quiz', '/wrong'];

function renderAt(route: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(App)),
  );
}

describe('라우팅 와이어링 + Provider 연결 + 통합 폴리시', () => {
  describe('AC-1[P0]: App.tsx에 모든 페이지 Route가 정의되어 있다', () => {
    it.each(ROUTES)('defines a <Route path="%s"> in App.tsx', (route) => {
      const pattern = new RegExp(`path=["']${route.replace(/\//g, '\\/')}["']`);
      expect(APP_SRC).toMatch(pattern);
    });

    it('renders every defined route without throwing and with non-empty content', () => {
      for (const route of ROUTES) {
        const { unmount } = renderAt(route);
        expect(document.body.textContent).not.toBe('');
        expect(document.querySelectorAll('[role="navigation"]').length).toBeGreaterThan(0);
        unmount();
      }
    });
  });

  describe('AC-2[P0]: 모든 navigate() 대상에 Route가 존재한다', () => {
    it('every navigate() target found in src/pages resolves to a Route path in App.tsx', () => {
      const pagesDir = path.resolve(__dirname, '../pages');
      const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tsx') && !f.startsWith('__'));
      const usedTargets = new Set<string>();

      for (const file of pageFiles) {
        const src = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
        const navRegex = /navigate\(\s*['"]([^'"]+)['"]/g;
        let match: RegExpExecArray | null;
        while ((match = navRegex.exec(src))) {
          usedTargets.add(match[1]);
        }
      }

      // Sanity check: pages must actually call navigate() somewhere, otherwise this test is vacuous.
      expect(usedTargets.size).toBeGreaterThan(0);
      expect([...usedTargets]).toEqual(expect.arrayContaining(['/checkin', '/checkin/done']));

      for (const target of usedTargets) {
        expect(APP_SRC).toMatch(new RegExp(`path=["']${target.replace(/\//g, '\\/')}["']`));
      }
    });

    it('has no dangling Route referencing a page file that does not exist', () => {
      const routeRegex = /<Route\s+path=["']([^"']+)["']\s+element=\{<(\w+)/g;
      let match: RegExpExecArray | null;
      let checkedCount = 0;
      while ((match = routeRegex.exec(APP_SRC))) {
        const [, , componentName] = match;
        if (componentName === 'ComingSoon' || componentName === 'Suspense') continue;
        expect(APP_SRC).toMatch(new RegExp(`import ${componentName} from`));
        checkedCount += 1;
      }
      expect(checkedCount).toBeGreaterThan(0);
    });
  });

  describe('AC-3[P0]: main.tsx의 TDSMobileAITProvider/BrowserRouter가 유지되어 있다', () => {
    it('main.tsx still wraps App in TDSMobileAITProvider and BrowserRouter', () => {
      expect(MAIN_SRC).toMatch(/<TDSMobileAITProvider>/);
      expect(MAIN_SRC).toMatch(/<BrowserRouter>/);
      expect(MAIN_SRC).toMatch(/import\s*\{\s*TDSMobileAITProvider\s*\}\s*from\s*['"]@toss\/tds-mobile-ait['"]/);
      expect(MAIN_SRC).toMatch(/import\s*\{\s*BrowserRouter\s*\}\s*from\s*['"]react-router-dom['"]/);
    });

    it('main.tsx keeps the @AI:ANCHOR guard comment and does not define app-level providers itself', () => {
      expect(MAIN_SRC).toMatch(/@AI:ANCHOR/);
      // App-level data providers belong in App.tsx, not main.tsx — main.tsx only wires the platform shell.
      expect(MAIN_SRC).not.toMatch(/AppDataProvider/);
    });
  });

  describe("AC-4[P0]: 앱이 '/' 경로에서 정상 렌더링된다", () => {
    it('renders the empty state (no UserCert) at "/" without throwing', () => {
      renderAt('/');
      expect(screen.getByTestId('home-empty').getAttribute('data-testid')).toBe('home-empty');
      expect(screen.getByText('학습할 자격증을 선택해주세요').textContent).toBe(
        '학습할 자격증을 선택해주세요',
      );
    });

    it('renders the populated dashboard at "/" when a UserCert is already saved', () => {
      localStorage.setItem(
        'certtimer.userCert',
        JSON.stringify({
          certId: 'cert_sqld',
          name: 'SQLD',
          examDate: '2026-09-05',
          targetTotalMinutes: 6000,
          selectedAt: 1750000000000,
          _v: 1,
        }),
      );

      renderAt('/');

      expect(screen.getByTestId('dday-card').getAttribute('data-testid')).toBe('dday-card');
      expect(screen.getByTestId('progress-hero').getAttribute('data-testid')).toBe('progress-hero');
      expect(screen.getByTestId('today-goal-card').getAttribute('data-testid')).toBe('today-goal-card');
      expect(screen.getByText('SQLD').textContent).toBe('SQLD');
    });
  });
});
