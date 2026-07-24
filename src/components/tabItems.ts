import type { TabItem } from './FloatingTabBar';

// 탭-루트 화면(홈/퀴즈/리포트)에서 공유하는 하단 탭 구성.
// 체크인은 SubmitFooter(하단 고정 CTA)를 쓰는 push 플로우라 탭바를 별도로 얹지 않는다.
export const TAB_ITEMS: TabItem[] = [
  { label: '홈', path: '/' },
  { label: '체크인', path: '/checkin' },
  { label: '퀴즈', path: '/quiz' },
  { label: '리포트', path: '/report' },
];
