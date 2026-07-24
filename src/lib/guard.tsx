import type { ReactNode } from 'react';

/**
 * Scaffold only — packet 0015 TDD red phase.
 * Real decision logic + redirect wiring is the Coder's job (see src/__tests__/packet-0015.test.ts).
 */
export interface ShouldRedirectToSelectInput {
  pathname: string;
  onboarded: boolean;
  hasUserCert: boolean;
  mode?: 'onboard' | 'change' | null;
}

export function shouldRedirectToSelect(_input: ShouldRedirectToSelectInput): boolean {
  return false;
}

export function OnboardingGuard({ children }: { children: ReactNode }) {
  return children;
}
