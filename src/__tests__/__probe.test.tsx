import { describe, it, expect } from 'vitest';

// Retired debug probe — used to compare useLocation() identity across a mock
// boundary while diagnosing a FloatingTabBar active-tab bug. The debug export
// it depended on (`__DEBUG_useLocation`) has since been removed from
// FloatingTabBar, so this file is now an inert placeholder.
describe('probe (retired)', () => {
  it('is a no-op placeholder', () => {
    expect(true).toBe(true);
  });
});
