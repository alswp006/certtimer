/**
 * TDD RED phase — packet heal-2-02
 * 머지된 공유계약 위에 라우팅·Provider 증분 와이어링 + 안전 폴백
 *
 * heal-1-01/heal-2-01이 확립한 앱 셸(AppDataProvider 단일 인스턴스 + OnboardingGuard 단일
 * 지점 + FloatingTabBar)은 이미 App.tsx에 있다. 이 패킷이 새로 추가해야 하는 것은:
 *   1) 라우트별 ErrorBoundary — 한 화면의 렌더 예외가 앱 전체를 흰 화면으로 만들지 않게 격리
 *      (관찰 가능한 계약: 오류 발생 화면에 `data-testid="route-error-fallback"` 요소가 대신 렌더된다)
 *   2) 그 격리가 다른 라우트 렌더에는 영향을 주지 않는지
 *   3) 이 배선 작업이 새로운 공유 계약(lib 모듈·컨텍스트·타입)을 추가하지 않는지
 *
 * 구현 세부사항(내부 컴포넌트/파일명)에 결합하지 않기 위해, ErrorBoundary 동작은
 * "특정 페이지가 렌더 중 던진 예외가 흰 화면 대신 fallback으로 격리되는가"라는
 * 블랙박스 관찰(AC-3)로 검증한다. 이를 위해 이 스위트 안에서만 CheckinDone 페이지를
 * 항상 던지도록 목킹한다 — 그래서 CheckinDone은 AC-1의 "정상 라우트" 목록에서 제외한다.
 *
 * AC-1: 프로덕션 빌드가 console.error 0개로 통과한다 (proxy: 정상 라우트 렌더에서 console.error 미호출)
 * AC-2: 라우트가 Provider 하위에서 렌더되고 FloatingTabBar가 탭-루트에 표시된다
 * AC-3: 한 화면의 오류가 ErrorBoundary로 격리되어 다른 라우트 렌더를 막지 않는다
 * AC-4: App.tsx/routes 배선은 기존(0001~0005) export만 소비하고 신규 공유계약을 추가하지 않는다
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockAll } from '@/__tests__/__helpers__/mocks';

mockAll();

// CheckinDone("/checkin/done")은 이 파일 안에서만 렌더 중 항상 예외를 던지도록 목킹한다 —
// AC-3(에러 격리)를 실제 라우트 트리 위에서 블랙박스로 검증하기 위함. 다른 라우트는 실제 구현 그대로 사용.
vi.mock('@/pages/CheckinDone', () => ({
  default: () => {
    throw new Error('boom: intentional test render failure');
  },
}));

import App from '@/App';

afterEach(() => {
  cleanup();
});

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

const APP_SRC = fs.readFileSync(path.resolve(__dirname, '../App.tsx'), 'utf-8');

describe('머지된 공유계약 위에 라우팅·Provider 증분 와이어링 + 안전 폴백', () => {
  describe('AC-1[P0]: 프로덕션 빌드 console.error 0개 (proxy: 정상 라우트 렌더에서 console.error 미호출)', () => {
    it('온보딩 완료 상태에서 정상 SPEC 라우트를 렌더해도 console.error가 한 번도 호출되지 않는다', () => {
      seedOnboarded();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // '/checkin/done'은 이 파일에서 의도적으로 예외를 던지도록 목킹했으므로 여기선 제외
      // (그 경로의 격리 동작은 AC-3에서 별도 검증한다).
      const normalRoutes = ['/', '/select', '/checkin', '/report', '/quiz', '/wrong'];
      for (const route of normalRoutes) {
        const { unmount } = renderAt(route);
        unmount();
      }
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('미온보딩 상태에서 보호 라우트(/report) 진입 → /select 리다이렉트도 console.error 없이 처리된다', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderAt('/report');
      expect(screen.getByPlaceholderText('자격증 이름으로 검색').getAttribute('placeholder')).toBe(
        '자격증 이름으로 검색',
      );
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('AC-2[P0]: 라우트가 Provider 하위에서 렌더되고 탭-루트에 FloatingTabBar가 표시된다', () => {
    it('탭-루트(/, /quiz, /report) 각각에서 홈·퀴즈·리포트 3개 탭이 렌더되고 탭 클릭으로 실제 이동한다', () => {
      seedOnboarded();
      renderAt('/');
      const tabsBefore = screen.getAllByRole('tab');
      expect(tabsBefore).toHaveLength(3);
      expect(tabsBefore.map((t) => t.getAttribute('aria-label'))).toEqual(['홈', '퀴즈', '리포트']);

      fireEvent.click(screen.getByRole('tab', { name: '리포트' }));
      expect(screen.getByText('합격 예측 리포트').textContent).toBe('합격 예측 리포트');
      expect(screen.getByRole('tab', { name: '리포트' }).getAttribute('aria-selected')).toBe('true');
    });

    it('push 플로우 라우트(/select, /checkin)에는 FloatingTabBar(탭)가 없다', () => {
      seedOnboarded();
      renderAt('/select');
      expect(screen.queryAllByRole('tab')).toHaveLength(0);

      cleanup();
      renderAt('/checkin');
      // /checkin은 TDS Tab(수동 입력/스탑워치 모드 전환)을 화면 내부에서 쓰므로 role="tab"
      // 자체는 존재할 수 있다(heal-1-01에서 이미 같은 이유로 랜드마크 기반 검증으로 정착됨).
      // FloatingTabBar 고유의 "메인 네비게이션" 랜드마크 부재로 하단 탭바 미표시를 검증한다.
      expect(screen.queryByRole('tablist', { name: '메인 네비게이션' })).toBeNull();
    });
  });

  describe('AC-3[P0]: 한 화면의 오류가 ErrorBoundary로 격리되어 다른 라우트 렌더를 막지 않는다', () => {
    it('/checkin/done 화면이 렌더 중 던진 예외는 앱 전체를 무너뜨리지 않고 fallback(data-testid="route-error-fallback")으로 격리된다', () => {
      seedOnboarded();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => renderAt('/checkin/done')).not.toThrow();
      expect(screen.getByTestId('route-error-fallback')).not.toBeNull();
      errorSpy.mockRestore();
    });

    it('오류 라우트(/checkin/done) 격리 이후에도 다른 라우트(/checkin)는 정상 렌더된다', () => {
      seedOnboarded();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      renderAt('/checkin/done');
      expect(screen.getByTestId('route-error-fallback')).not.toBeNull();
      cleanup();

      renderAt('/checkin');
      expect(screen.getByText('오늘 공부 체크인').textContent).toBe('오늘 공부 체크인');
      expect(screen.queryByTestId('route-error-fallback')).toBeNull();
      errorSpy.mockRestore();
    });
  });

  describe('AC-4[P0]: 라우팅 배선은 기존(0001~0005) export만 소비하고 신규 공유계약을 추가하지 않는다', () => {
    it('src/lib에는 이 패킷 이전부터 있던 모듈만 존재하고 새 lib 모듈이 추가되지 않았다', () => {
      const libDir = path.resolve(__dirname, '../lib');
      const walk = (dir: string, prefix = ''): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
          entry.isDirectory()
            ? walk(path.join(dir, entry.name), `${prefix}${entry.name}/`)
            : [`${prefix}${entry.name}`],
        );
      const actualLibFiles = walk(libDir).sort();
      const knownBaselineLibFiles = [
        'calc.ts',
        'constants/certs.ts',
        'constants/quiz.ts',
        'guard.tsx',
        'storage.ts',
        'store.ts',
        'store.tsx',
        'types.ts',
        'utils.ts',
      ].sort();
      expect(actualLibFiles).toEqual(knownBaselineLibFiles);
    });

    it('App.tsx는 새 React Context/공유 타입을 직접 정의하지 않고 기존 lib/store·lib/guard export만 가져다 쓴다', () => {
      expect(APP_SRC).not.toMatch(/createContext\s*\(/);
      expect(APP_SRC).not.toMatch(/export (interface|type) /);
      expect(APP_SRC).toMatch(/from ['"]@\/lib\/store['"]/);
    });
  });
});
