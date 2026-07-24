import type { ReactNode } from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Top } from '@toss/tds-mobile';
import Home from './pages/Home';
import Select from './pages/Select';
import Checkin from './pages/Checkin';
import CheckinDone from './pages/CheckinDone';
import Report from './pages/Report';
import Quiz from './pages/Quiz';
import { AppDataProvider } from '@/lib/store';
import { OnboardingGuard } from '@/lib/guard';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { EmptyState } from '@/components/StateView';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TAB_ITEMS } from '@/components/tabItems';

// 온보딩(자격증 선택) 전에는 의미가 없는 push-flow 화면만 감싼다.
// Home("/")·Quiz("/quiz")·Report("/report")는 탭-루트 화면으로 자체 EmptyState/폴백을
// 이미 제공하므로 감싸지 않는다(가드가 덮으면 그 폴백 UX와 탭바가 사라진다).
// Select("/select")는 가드의 리다이렉트 목적지 자신이라 감싸면 안 된다.
function guarded(children: ReactNode) {
  return <OnboardingGuard>{children}</OnboardingGuard>;
}

// 아직 구현되지 않은 화면(리포트/퀴즈/오답노트) — 후속 패킷에서 실제 페이지로 교체될 때까지
// 빈 화면 대신 안내만 보여줘 네비게이션이 끊기지 않게 한다.
// tabRoot: 홈/퀴즈/리포트처럼 하단 탭이 있는 화면인지 여부(오답노트는 퀴즈에서 진입하는 push 플로우라 탭바 없음).
function ComingSoon({ title, tabRoot }: { title: string; tabRoot?: boolean }) {
  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>{title}</Top.TitleParagraph>} />}
      bottom={tabRoot ? <FloatingTabBar items={TAB_ITEMS} /> : undefined}
    >
      <EmptyState title="준비 중이에요" description="곧 만나볼 수 있어요" />
    </ScreenScaffold>
  );
}

// Dev-only TDS Gallery route — `import.meta.env.DEV` is statically replaced
// (true in dev, false in prod) so the entire import + Route is tree-shaken
// from production builds. Verify with: `grep -r "TdsGallery" dist/` → empty.
const DevTdsGallery = import.meta.env.DEV
  ? lazy(() => import('./pages/__TdsGallery'))
  : null;

export default function App() {
  return (
    <AppDataProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/select" element={<Select />} />
        <Route path="/checkin" element={guarded(<Checkin />)} />
        <Route path="/checkin/done" element={guarded(<CheckinDone />)} />
        <Route path="/report" element={<Report />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/wrong" element={guarded(<ComingSoon title="오답노트" />)} />
        {DevTdsGallery && (
          <Route
            path="/__tds-gallery"
            element={
              <Suspense fallback={null}>
                <DevTdsGallery />
              </Suspense>
            }
          />
        )}
      </Routes>
    </AppDataProvider>
  );
}
