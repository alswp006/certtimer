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
 * 판단 기준은 hasUserCert 하나뿐이다 — Home/Report 등 보호 화면이 실제로 필요로 하는 건
 * userCert이지 flags.onboarded가 아니다. onboarded는 저장 실패(QuotaExceededError 등) 시
 * userCert 없이 단독으로 true가 될 수 있어(Select.tsx commitSelection의 부분 저장 실패)
 * 신뢰할 수 없다 — 반드시 hasUserCert만으로 판단해 그 모순 상태에서도 리다이렉트한다.
 */
export function shouldRedirectToSelect({
  pathname,
  hasUserCert,
  mode,
}: ShouldRedirectToSelectInput): boolean {
  if (pathname === '/select') return false;
  if (mode === 'change') return false;
  return !hasUserCert;
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
