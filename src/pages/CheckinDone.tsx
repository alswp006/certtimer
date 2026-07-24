import { Top, Paragraph, Spacing, Button } from '@toss/tds-mobile';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { Amount } from '@/components/Amount';
import { AdSlot } from '@/components/AdSlot';
import { useAppData } from '@/lib/store';
import { todayStr } from '@/lib/utils';

interface CheckinDoneState {
  minutesToday: number;
  streakCurrent: number;
}

export default function CheckinDone() {
  const location = useLocation();
  const navigate = useNavigate();
  const { checkIns, streak } = useAppData();
  const state = location.state as CheckinDoneState | null;

  const today = todayStr();
  const minutesToday = state?.minutesToday ?? checkIns.find((c) => c.date === today)?.minutes ?? 0;
  const streakCurrent = state?.streakCurrent ?? streak.current;

  return (
    <ScreenScaffold top={<Top title={<Top.TitleParagraph>체크인 완료</Top.TitleParagraph>} />}>
      <Card testId="checkin-summary-card">
        <Paragraph.Text typography="st11">오늘 학습</Paragraph.Text>
        <Spacing size={4} />
        <Amount value={minutesToday} unit="분" typography="t1" />
        <Spacing size={8} />
        <Paragraph.Text typography="t6">연속 {streakCurrent}일째 기록 중이에요</Paragraph.Text>
      </Card>

      <Spacing size={24} />

      <AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />

      <Spacing size={24} />

      <Button variant="fill" display="block" onClick={() => navigate('/')}>
        홈으로
      </Button>

      <Spacing size={24} />
    </ScreenScaffold>
  );
}
