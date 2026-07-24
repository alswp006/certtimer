import { Spacing } from '@toss/tds-mobile';
import { AdSlot } from '@/components/AdSlot';

/**
 * 결과/콘텐츠 뒤에 붙는 비침투 배너 광고 섹션 — 카드 내부에 중첩하지 말고
 * 마지막 결과 카드 다음에 형제 요소로 배치한다.
 */
export function AdPlacement({ adGroupId, testId }: { adGroupId: string; testId?: string }) {
  return (
    <div data-testid={testId}>
      <Spacing size={16} />
      <AdSlot adGroupId={adGroupId} />
    </div>
  );
}
