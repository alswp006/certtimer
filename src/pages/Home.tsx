import { Top, Paragraph, Spacing, Button } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SummaryHero } from '@/components/SummaryHero';
import { Card } from '@/components/Card';
import { CountUp } from '@/components/CountUp';
import { AdPlacement } from '@/components/AdPlacement';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TAB_ITEMS } from '@/components/tabItems';
import { useAppData } from '@/lib/store';
import { calcDday, calcProgress, calcDailyGoal, daysUntil } from '@/lib/calc';
import { formatNumber, todayStr } from '@/lib/utils';

// 온보딩 완료 여부는 라우터 최상위 OnboardingGuard가 보장한다("/"는 보호 라우트) — 이 화면은
// userCert가 항상 존재한다고 가정하고 그린다.
export default function Home() {
  const { userCert, checkIns } = useAppData();

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>CertTimer</Top.TitleParagraph>} />}
      bottom={<FloatingTabBar items={TAB_ITEMS} />}
    >
      <HomeDashboard
        userCertName={userCert!.name}
        examDate={userCert!.examDate}
        targetTotalMinutes={userCert!.targetTotalMinutes}
        totalMinutes={checkIns.reduce((sum, c) => sum + c.minutes, 0)}
      />
    </ScreenScaffold>
  );
}

function HomeDashboard({
  userCertName,
  examDate,
  targetTotalMinutes,
  totalMinutes,
}: {
  userCertName: string;
  examDate: string;
  targetTotalMinutes: number;
  totalMinutes: number;
}) {
  const navigate = useNavigate();
  const today = todayStr();
  const dday = calcDday(examDate, today);
  const rawRemaining = daysUntil(examDate, today);
  const progress = calcProgress(totalMinutes, targetTotalMinutes);
  const isExpired = rawRemaining < 0;
  const isAchieved = totalMinutes >= targetTotalMinutes;
  const dailyGoal = calcDailyGoal(targetTotalMinutes, totalMinutes, rawRemaining);

  const goalText = isExpired
    ? '시험일이 지났어요'
    : isAchieved
      ? '목표 달성! 오늘도 복습해요'
      : `오늘 목표 ${formatNumber(dailyGoal)}분`;

  return (
    <>
      <Card testId="dday-card">
        <Paragraph.Text typography="st11">{userCertName}</Paragraph.Text>
        <Spacing size={4} />
        <Paragraph.Text typography="t2">{dday}</Paragraph.Text>
      </Card>

      <Spacing size={16} />

      <SummaryHero
        testId="progress-hero"
        label="누적 달성률"
        value={<CountUp value={progress} unit="%" typography="t1" />}
        caption={`누적 ${formatNumber(totalMinutes)}분 / 목표 ${formatNumber(targetTotalMinutes)}분`}
      />

      <Spacing size={16} />

      <Card testId="today-goal-card">
        <Paragraph.Text typography="st11">오늘 목표</Paragraph.Text>
        <Spacing size={4} />
        <Paragraph.Text typography="t3">{goalText}</Paragraph.Text>
        <Spacing size={16} />
        <Button variant="fill" display="block" onClick={() => navigate('/checkin')}>
          오늘 공부 체크인
        </Button>
        <Spacing size={8} />
        <Button variant="weak" display="block" onClick={() => navigate('/report')}>
          합격 예측 리포트 보기
        </Button>
      </Card>

      <AdPlacement testId="home-ad-placement" adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />

      <Spacing size={80} />
    </>
  );
}
