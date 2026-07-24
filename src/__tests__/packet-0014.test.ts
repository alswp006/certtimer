/**
 * Packet: 앱 셸 · 라우팅 · FloatingTabBar 연결
 *
 * TDD Red Phase — App.tsx must:
 * - AC-1: define all 7 routes (/select, /, /checkin, /checkin/done, /report, /quiz, /wrong)
 *   and render every page without crashing; every navigate() target used by pages
 *   must resolve to a defined Route.
 * - AC-2: tab-root screens (/, /quiz, /report) render FloatingTabBar with the correct
 *   active tab tinted, fixed to the bottom with safe-area padding; push-flow screens
 *   (/checkin, /select) do not show the tab bar.
 * - AC-3: AppDataProvider wraps the whole Routes tree in App.tsx; main.tsx stays untouched
 *   (@AI:ANCHOR) and does not itself import AppDataProvider.
 */

import { describe, it, expect } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockTds, mockAppsInToss, mockTossRewardAd } from '@/__tests__/__helpers__/mocks';

// NOTE: react-router-dom is intentionally NOT mocked here — FloatingTabBar's
// active-tab detection depends on the *real* useLocation() inside a MemoryRouter,
// and we need real navigation to verify navigate()↔Route wiring end to end.
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

describe('앱 셸 · 라우팅 · FloatingTabBar 연결', () => {
  describe('AC-1[P0]: 7개 Route 정의 · 모든 페이지 렌더', () => {
    it.each(ROUTES)('App.tsx defines a <Route> for %s', (route) => {
      const pattern = new RegExp(`path=["']${route}["']`);
      expect(APP_SRC).toMatch(pattern);
    });

    it('renders all 7 routes without throwing or producing an empty tree', () => {
      for (const route of ROUTES) {
        const { unmount } = renderAt(route);
        expect(document.body.textContent).not.toBe('');
        unmount();
      }
    });

    it('every navigate() target used across pages resolves to a defined Route path', () => {
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

      expect(usedTargets.size).toBeGreaterThan(0);
      for (const target of usedTargets) {
        expect(APP_SRC).toMatch(new RegExp(`path=["']${target}["']`));
      }
    });
  });

  describe('AC-2[P0]: FloatingTabBar 활성 탭 · 하단 고정 safe-area', () => {
    it('shows FloatingTabBar on / with 홈 tinted active and 퀴즈/리포트 inactive', () => {
      renderAt('/');
      const tablist = screen.getByRole('tablist', { name: '메인 네비게이션' });
      expect(within(tablist).getByRole('tab', { name: '홈' }).getAttribute('aria-selected')).toBe('true');
      expect(within(tablist).getByRole('tab', { name: '퀴즈' }).getAttribute('aria-selected')).toBe('false');
      expect(within(tablist).getByRole('tab', { name: '리포트' }).getAttribute('aria-selected')).toBe('false');
    });

    it('shows 퀴즈 active on /quiz and 리포트 active on /report', () => {
      const first = renderAt('/quiz');
      const quizTablist = screen.getByRole('tablist', { name: '메인 네비게이션' });
      expect(within(quizTablist).getByRole('tab', { name: '퀴즈' }).getAttribute('aria-selected')).toBe('true');
      expect(within(quizTablist).getByRole('tab', { name: '홈' }).getAttribute('aria-selected')).toBe('false');
      first.unmount();

      renderAt('/report');
      const reportTablist = screen.getByRole('tablist', { name: '메인 네비게이션' });
      expect(within(reportTablist).getByRole('tab', { name: '리포트' }).getAttribute('aria-selected')).toBe('true');
    });

    it('FloatingTabBar is fixed to the bottom with safe-area inset padding', () => {
      renderAt('/');
      const tablist = screen.getByRole('tablist', { name: '메인 네비게이션' });
      expect(tablist.style.position).toBe('fixed');
      expect(tablist.style.padding).toContain('toss-safe-area-bottom');
    });

    it('does not render FloatingTabBar on push-flow screens (/checkin, /select)', () => {
      const first = renderAt('/checkin');
      expect(screen.queryByRole('tablist', { name: '메인 네비게이션' })).toBeNull();
      first.unmount();

      renderAt('/select');
      expect(screen.queryByRole('tablist', { name: '메인 네비게이션' })).toBeNull();
    });
  });

  describe('AC-3[P0]: store Provider가 App.tsx 최상위에서 래핑 · main.tsx 미변경', () => {
    it('App.tsx wraps <Routes> with AppDataProvider above it in the tree', () => {
      expect(APP_SRC).toMatch(/<AppDataProvider>/);
      const providerIdx = APP_SRC.indexOf('<AppDataProvider>');
      const routesIdx = APP_SRC.indexOf('<Routes');
      expect(providerIdx).toBeGreaterThan(-1);
      expect(routesIdx).toBeGreaterThan(-1);
      expect(providerIdx).toBeLessThan(routesIdx);
    });

    it('main.tsx keeps its @AI:ANCHOR guard and does not import AppDataProvider itself', () => {
      expect(MAIN_SRC).toContain('@AI:ANCHOR');
      expect(MAIN_SRC).not.toContain('AppDataProvider');
      expect(MAIN_SRC).toContain('<App />');
    });

    it('pages consuming useAppData render live data without a missing-provider error', () => {
      renderAt('/');
      expect(screen.queryByText(/must be used within/i)).toBeNull();
      expect(screen.getByText('자격증 선택').textContent).toBe('자격증 선택');
    });
  });
});
