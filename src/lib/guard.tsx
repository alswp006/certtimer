import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppData } from '@/lib/store';

export interface ShouldRedirectToSelectInput {
  pathname: string;
  onboarded: boolean;
  hasUserCert: boolean;
  mode?: 'onboard' | 'change' | null;
}

/**
 * '/select' 자체와 mode:'change'(자격증 재선택 플로우)는 리다이렉트 대상에서 제외한다.
 * onboarded와 hasUserCert 중 하나라도 완료 신호(true)면 통과시킨다 — 실제 플로우(Select.tsx)는
 * 선택 완료 시 always 둘을 함께 true로 저장하므로, 어느 한쪽이라도 true라는 건 이미 온보딩을
 * 마쳤다는 뜻이다. 둘 다 false일 때만(진짜 최초 진입) 리다이렉트한다.
 */
export function shouldRedirectToSelect({
  pathname,
  onboarded,
  hasUserCert,
  mode,
}: ShouldRedirectToSelectInput): boolean {
  if (pathname === '/select') return false;
  if (mode === 'change') return false;
  return !onboarded && !hasUserCert;
}

interface LocationState {
  mode?: 'onboard' | 'change';
}

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { flags, userCert } = useAppData();
  const state = location.state as LocationState | null;

  const redirect = shouldRedirectToSelect({
    pathname: location.pathname,
    onboarded: flags.onboarded,
    hasUserCert: !!userCert,
    mode: state?.mode ?? null,
  });

  useEffect(() => {
    if (redirect) {
      navigate('/select', { state: { mode: 'onboard' }, replace: true });
    }
  }, [redirect, navigate]);

  if (redirect) return null;
  return <>{children}</>;
}
