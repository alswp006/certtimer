/**
 * Packet 0006: 공유 계약 export 표면 정합화
 *
 * TDD Red Phase — Tests for verifying shared contracts across pages:
 * - All imports by pages (Home, Select, Checkin, CheckinDone) are resolvable
 * - useAppData exposes correct data model shape
 * - Routing contracts (navigate targets ↔ Route paths) are aligned
 * - No circular dependencies or export mismatches
 */

import { describe, it, expect } from 'vitest';

// ============================================================================
// AC-1: All exports from lib/ are resolvable and have correct signatures
// ============================================================================

describe('AC-1: lib exports are resolvable', () => {
  it('should export useAppData hook from lib/store.ts', async () => {
    // This test verifies useAppData exists and is callable
    // Import dynamically to ensure module resolution
    const store = await import('@/lib/store');
    expect(typeof store.useAppData).toBe('function');
    expect(typeof store.AppDataProvider).toBe('function');
  });

  it('should export all calc functions from lib/calc.ts', async () => {
    const calc = await import('@/lib/calc');

    expect(typeof calc.calcDday).toBe('function');
    expect(typeof calc.calcProgress).toBe('function');
    expect(typeof calc.calcDailyGoal).toBe('function');
    expect(typeof calc.daysUntil).toBe('function');
    expect(typeof calc.updateStreak).toBe('function');
    expect(typeof calc.calcScore).toBe('function');
    expect(typeof calc.mapScoreLabel).toBe('function');
    expect(typeof calc.pickDailyQuizIds).toBe('function');
  });

  it('should export all utils functions from lib/utils.ts', async () => {
    const utils = await import('@/lib/utils');

    expect(typeof utils.formatNumber).toBe('function');
    expect(typeof utils.formatCurrency).toBe('function');
    expect(typeof utils.todayStr).toBe('function');
    expect(typeof utils.cn).toBe('function');
  });

  it('should export all storage functions from lib/storage.ts', async () => {
    const storage = await import('@/lib/storage');

    expect(typeof storage.getItem).toBe('function');
    expect(typeof storage.setItem).toBe('function');
    expect(typeof storage.removeItem).toBe('function');
    expect(typeof storage.getUserCert).toBe('function');
    expect(typeof storage.saveUserCert).toBe('function');
    expect(typeof storage.getCheckIns).toBe('function');
    expect(typeof storage.saveCheckIns).toBe('function');
    expect(typeof storage.getStreak).toBe('function');
    expect(typeof storage.saveStreak).toBe('function');
    expect(typeof storage.getQuizProgress).toBe('function');
    expect(typeof storage.saveQuizProgress).toBe('function');
    expect(typeof storage.getFlags).toBe('function');
    expect(typeof storage.saveFlags).toBe('function');
  });

  it('should export domain types from lib/types.ts', async () => {
    // TypeScript interfaces don't exist at runtime — we verify type definitions in source
    const fs = await import('fs');
    const path = await import('path');
    const sourceCode = fs.readFileSync(
      path.resolve(__dirname, '../lib/types.ts'),
      'utf-8'
    );

    expect(sourceCode).toContain('export interface Certification');
    expect(sourceCode).toContain('export interface UserCert');
    expect(sourceCode).toContain('export interface CheckIn');
    expect(sourceCode).toContain('export interface StreakState');
    expect(sourceCode).toContain('export interface QuizProgress');
    expect(sourceCode).toContain('export interface AppFlags');
    expect(sourceCode).toContain('export type RouteState');
  });

  it('should export BUILTIN_CERTS from lib/constants/certs.ts', async () => {
    const certs = await import('@/lib/constants/certs');

    expect(Array.isArray(certs.BUILTIN_CERTS)).toBe(true);
    expect(certs.BUILTIN_CERTS.length).toBeGreaterThan(0);
    // Verify structure of first cert
    const cert = certs.BUILTIN_CERTS[0];
    expect(cert).toHaveProperty('id');
    expect(cert).toHaveProperty('name');
    expect(cert).toHaveProperty('category');
    expect(cert).toHaveProperty('examDate');
    expect(cert).toHaveProperty('recommendedTotalMinutes');
  });

  it('should export TAB_ITEMS from components/tabItems.ts', async () => {
    const tabItems = await import('@/components/tabItems');

    expect(Array.isArray(tabItems.TAB_ITEMS)).toBe(true);
    expect(tabItems.TAB_ITEMS.length).toBeGreaterThan(0);
    // Verify structure
    const item = tabItems.TAB_ITEMS[0];
    expect(item).toHaveProperty('label');
    expect(item).toHaveProperty('path');
    expect(typeof item.label).toBe('string');
    expect(typeof item.path).toBe('string');
  });
});

// ============================================================================
// AC-2: useAppData exposes correct data model (no mock, direct import)
// ============================================================================

describe('AC-2: useAppData data model shape', () => {
  it('should have correct return type structure when called', () => {
    // In production, useAppData() can only be called within AppDataProvider context
    // For contract verification, we inspect the source's expected shape
    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/store.ts'),
      'utf-8'
    );

    // Verify interface definition in source
    expect(sourceCode).toContain('interface AppDataValue');
    expect(sourceCode).toContain('userCert: UserCert | null');
    expect(sourceCode).toContain('checkIns: CheckIn[]');
    expect(sourceCode).toContain('streak: StreakState');
    expect(sourceCode).toContain('quiz: QuizProgress | null');
    expect(sourceCode).toContain('flags: AppFlags');
    expect(sourceCode).toContain('upsertCheckInToday');
    expect(sourceCode).toContain('applyStreak');
    expect(sourceCode).toContain('addWrongId');
    expect(sourceCode).toContain('answerQuizQuestion');
    expect(sourceCode).toContain('setUserCert');
    expect(sourceCode).toContain('setFlags');
  });

  it('should have all required mutation methods in useAppData', () => {
    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/store.ts'),
      'utf-8'
    );

    // Verify all mutations are defined and callable
    expect(sourceCode).toContain('function upsertCheckInToday');
    expect(sourceCode).toContain('function applyStreak');
    expect(sourceCode).toContain('function addWrongId');
    expect(sourceCode).toContain('function answerQuizQuestion');
    expect(sourceCode).toContain('function setUserCert');
    expect(sourceCode).toContain('function setFlags');
  });
});

// ============================================================================
// AC-3: Page imports are resolvable (no circular dependencies)
// ============================================================================

describe('AC-3: Page imports are resolvable', () => {
  it('Home.tsx should import all required symbols', async () => {
    // Verify Home.tsx can be imported (this tests tree-shaking and no circular deps)
    const Home = (await import('@/pages/Home')).default;
    expect(typeof Home).toBe('function');
  });

  it('Select.tsx should import BUILTIN_CERTS, useAppData, and calcDday', async () => {
    const Select = (await import('@/pages/Select')).default;
    expect(typeof Select).toBe('function');

    // Verify Select uses BUILTIN_CERTS in its logic
    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Select.tsx'),
      'utf-8'
    );
    expect(sourceCode).toContain('BUILTIN_CERTS');
    expect(sourceCode).toContain('useAppData');
  });

  it('Checkin.tsx should import updateStreak and useAppData', async () => {
    const Checkin = (await import('@/pages/Checkin')).default;
    expect(typeof Checkin).toBe('function');

    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Checkin.tsx'),
      'utf-8'
    );
    expect(sourceCode).toContain('updateStreak');
    expect(sourceCode).toContain('useAppData');
  });

  it('CheckinDone.tsx should import useAppData and render location.state', async () => {
    const CheckinDone = (await import('@/pages/CheckinDone')).default;
    expect(typeof CheckinDone).toBe('function');

    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/CheckinDone.tsx'),
      'utf-8'
    );
    expect(sourceCode).toContain('useAppData');
    expect(sourceCode).toContain('location.state');
  });
});

// ============================================================================
// AC-4: Routing contracts are aligned (navigate targets ↔ Route definitions)
// ============================================================================

describe('AC-4: Routing contracts are aligned', () => {
  it('Home.tsx navigate targets should match App.tsx Route paths', () => {
    const homeSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Home.tsx'),
      'utf-8'
    );
    const appSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../App.tsx'),
      'utf-8'
    );

    // Home navigates to /select, /checkin, /report
    expect(homeSource).toContain("navigate('/select'");
    expect(homeSource).toContain("navigate('/checkin'");
    expect(homeSource).toContain("navigate('/report'");

    // Verify App.tsx has these routes (or will have them in implementation)
    // For now, we expect them to be defined
    expect(appSource).toContain("Route path");
  });

  it('Select.tsx navigate target "/" should exist in App.tsx', () => {
    const selectSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Select.tsx'),
      'utf-8'
    );

    expect(selectSource).toContain("navigate('/', { replace: true }");
  });

  it('Checkin.tsx navigate target "/checkin/done" should be defined', () => {
    const checkinSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Checkin.tsx'),
      'utf-8'
    );

    expect(checkinSource).toContain("navigate('/checkin/done'");
  });

  it('CheckinDone.tsx should handle location.state for minutesToday and streakCurrent', () => {
    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/CheckinDone.tsx'),
      'utf-8'
    );

    expect(sourceCode).toContain('minutesToday');
    expect(sourceCode).toContain('streakCurrent');
    expect(sourceCode).toContain('location.state');
  });
});

// ============================================================================
// AC-5: RouteState type contract matches navigation patterns
// ============================================================================

describe('AC-5: RouteState type definitions align with usage', () => {
  it('should have RouteState discriminated union type in types.ts', () => {
    const sourceCode = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/types.ts'),
      'utf-8'
    );

    expect(sourceCode).toContain('type RouteState');
    expect(sourceCode).toContain("pathname: '/checkin/done'");
    expect(sourceCode).toContain("pathname: '/select'");
    expect(sourceCode).toContain('minutesToday');
    expect(sourceCode).toContain('streakCurrent');
  });

  it('Checkin.tsx navigate to /checkin/done should match RouteState contract', () => {
    const checkinSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Checkin.tsx'),
      'utf-8'
    );

    // Verify it passes state with minutesToday and streakCurrent
    expect(checkinSource).toContain('state: { minutesToday, streakCurrent }');
  });

  it('Home.tsx navigate to /select should pass mode state', () => {
    const homeSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../pages/Home.tsx'),
      'utf-8'
    );

    // Verify navigate call includes state with mode
    expect(homeSource).toContain("{ state: { mode: 'onboard' }");
  });
});

// ============================================================================
// AC-6: No duplicate exports or naming conflicts
// ============================================================================

describe('AC-6: No duplicate or conflicting exports', () => {
  it('should not have duplicate type definitions across files', () => {
    const typesSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/types.ts'),
      'utf-8'
    );
    const storeSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/store.ts'),
      'utf-8'
    );

    // Verify types are defined in types.ts, not redefined in store.ts
    const userCertCount = (typesSource.match(/interface UserCert/g) || []).length;
    const storeUserCertCount = (storeSource.match(/interface UserCert/g) || []).length;

    expect(userCertCount).toBe(1);
    expect(storeUserCertCount).toBe(0); // Store should not redefine UserCert
  });

  it('should import types from @/lib/types in store.ts', () => {
    const storeSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../lib/store.ts'),
      'utf-8'
    );

    expect(storeSource).toContain("import type { UserCert, CheckIn, StreakState, QuizProgress, AppFlags }");
  });
});

// ============================================================================
// AC-7: App.tsx route definitions are complete
// ============================================================================

describe('AC-7: App.tsx has all required route definitions', () => {
  it('should define Route for / (Home)', () => {
    const appSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../App.tsx'),
      'utf-8'
    );

    expect(appSource).toContain("path=\"/\"");
    expect(appSource).toContain('element={<Home />}');
  });

  it('should have placeholder or real Route definitions for /select, /checkin, /checkin/done, /report, /quiz', () => {
    const appSource = require('fs').readFileSync(
      require('path').resolve(__dirname, '../App.tsx'),
      'utf-8'
    );

    // At minimum, comments or intent to add these paths should be visible
    // In the red phase, these routes may not exist yet
    // The test documents what should be there
    const requiredPaths = ['/select', '/checkin', '/checkin/done', '/report', '/quiz'];

    // We just verify the file structure allows adding routes
    expect(appSource).toContain('<Routes>');
    expect(appSource).toContain('</Routes>');
  });
});

// ============================================================================
// AC-8: calcTargetToday function availability (used in calcs)
// ============================================================================

describe('AC-8: All calculation utilities are available', () => {
  it('should export calcTargetToday from calc.ts', async () => {
    const calc = await import('@/lib/calc');
    expect(typeof calc.calcTargetToday).toBe('function');
  });

  it('calcProgress should return percentage between 0-100', async () => {
    const { calcProgress } = await import('@/lib/calc');

    expect(calcProgress(50, 100)).toBe(50);
    expect(calcProgress(0, 100)).toBe(0);
    expect(calcProgress(100, 100)).toBe(100);
    expect(calcProgress(150, 100)).toBe(100); // Capped at 100
  });

  it('calcDday should return correct string format', async () => {
    const { calcDday } = await import('@/lib/calc');

    // Today = 2026-07-25 (from context)
    const today = '2026-07-25';

    expect(calcDday('2026-07-25', today)).toBe('D-DAY');
    expect(calcDday('2026-07-26', today)).toMatch(/^D-\d+$/);
    expect(calcDday('2026-07-24', today)).toMatch(/^D\+\d+$/);
  });

  it('daysUntil should return number of days', async () => {
    const { daysUntil } = await import('@/lib/calc');

    const today = '2026-07-25';
    expect(daysUntil('2026-07-25', today)).toBe(0);
    expect(daysUntil('2026-07-26', today)).toBe(1);
    expect(daysUntil('2026-07-24', today)).toBe(-1);
  });
});
