import { Top, Paragraph, Spacing, Button, Badge } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SummaryHero } from '@/components/SummaryHero';
import { Card } from '@/components/Card';
import { CountUp } from '@/components/CountUp';
import { Sparkline } from '@/components/Sparkline';
import { EmptyState } from '@/components/StateView';
import { TossRewardAd } from '@/components/TossRewardAd';
import { AdPlacement } from '@/components/AdPlacement';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TAB_ITEMS } from '@/components/tabItems';
import { useAppData } from '@/lib/store';
import {
  calcProgress,
  calcDailyGoal,
  daysUntil,
  mapScoreLabel,
  scoreLabelDisplay,
  calcRecentTrend,
  calcReportScore,
  type CalcScoreLabel,
} from '@/lib/calc';
import { todayStr, formatNumber } from '@/lib/utils';
import type { CheckIn, UserCert } from '@/lib/types';

const BADGE_COLOR: Record<CalcScoreLabel, 'red' | 'yellow' | 'green'> = {
  분발필요: 'red',
  순항중: 'yellow',
  합격유력: 'green',
};

const ADVICE_TEXT: Record<CalcScoreLabel, string> = {
  분발필요: '오늘부터 하루 학습량을 조금씩 늘려보세요',
  순항중: '지금 페이스를 유지하면 목표에 도달해요',
  합격유력: '이 페이스면 합격권이에요, 마무리까지 힘내요',
};

export default function Report() {
  const navigate = useNavigate();
  const { userCert, checkIns } = useAppData();

  const top = <Top title={<Top.TitleParagraph>합격 예측 리포트</Top.TitleParagraph>} />;

  if (!userCert || checkIns.length === 0) {
    return (
      <ScreenScaffold top={top} bottom={<FloatingTabBar items={TAB_ITEMS} />}>
        <EmptyState
          title="학습 기록이 있어야 예측할 수 있어요"
          action={
            <Button variant="weak" display="block" onClick={() => navigate('/checkin')}>
              체크인하러 가기
            </Button>
          }
          testId="report-empty"
        />
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold top={top} bottom={<FloatingTabBar items={TAB_ITEMS} />}>
      <TossRewardAd
        slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}
        description="광고 시청 후 리포트가 공개돼요"
        buttonText="광고 보고 리포트 공개"
      >
        <ReportContent userCert={userCert} checkIns={checkIns} />
      </TossRewardAd>
    </ScreenScaffold>
  );
}

function ReportContent({ userCert, checkIns }: { userCert: UserCert; checkIns: CheckIn[] }) {
  const today = todayStr();
  const totalMinutes = checkIns.reduce((sum, c) => sum + c.minutes, 0);
  const progress = calcProgress(totalMinutes, userCert.targetTotalMinutes);
  const remainingDays = daysUntil(userCert.examDate, today);
  const dailyGoal = calcDailyGoal(userCert.targetTotalMinutes, totalMinutes, Math.max(remainingDays, 1));
  const trend = calcRecentTrend(checkIns, dailyGoal, today);
  const score = calcReportScore(progress, trend);
  const label = mapScoreLabel(score);
  const labelText = scoreLabelDisplay(label);

  const sparklineData = buildLast7DaysSeries(checkIns, today);

  return (
    <>
      <SummaryHero
        testId="score-hero"
        label="합격 예측 점수"
        value={<CountUp testId="score-count" value={score} unit="점" typography="t1" />}
        caption={`누적 ${formatNumber(totalMinutes)}분 학습`}
      />
      <Spacing size={12} />
      <Badge size="medium" variant="weak" color={BADGE_COLOR[label]}>
        {labelText}
      </Badge>

      <Spacing size={16} />

      <Card testId="advice-card">
        <Paragraph.Text typography="st11">학습 조언</Paragraph.Text>
        <Spacing size={4} />
        <Paragraph.Text typography="t6">{ADVICE_TEXT[label]}</Paragraph.Text>
      </Card>

      <Spacing size={16} />

      <Paragraph.Text typography="st11">최근 7일 학습 추이</Paragraph.Text>
      <Spacing size={8} />
      <Sparkline testId="report-sparkline" data={sparklineData} />

      <AdPlacement testId="report-ad-placement" adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />

      <Spacing size={80} />
    </>
  );
}

// 최근 7일(오늘 포함) 일별 학습 분을 오래된 날짜 → 오늘 순서로 반환
function buildLast7DaysSeries(checkIns: CheckIn[], today: string): number[] {
  const minutesByDate = new Map(checkIns.map((c) => [c.date, c.minutes]));
  const [y, m, d] = today.split('-').map(Number);
  const todayTs = Date.UTC(y, m - 1, d);
  const series: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dateStr = new Date(todayTs - i * 86400000).toISOString().slice(0, 10);
    series.push(minutesByDate.get(dateStr) ?? 0);
  }
  return series;
}
