import { useEffect, useRef, useState } from 'react';
import { Top, Tab, TextField, Paragraph, Spacing, useToast } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SubmitFooter } from '@/components/BottomCTA';
import { Card } from '@/components/Card';
import { useAppData } from '@/lib/store';
import { updateStreak } from '@/lib/calc';
import { todayStr } from '@/lib/utils';

function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export default function Checkin() {
  const navigate = useNavigate();
  const toast = useToast();
  const { checkIns, streak, upsertCheckInToday, applyStreak } = useAppData();
  const [mode, setMode] = useState<'manual' | 'stopwatch'>('manual');
  const [manualMinutes, setManualMinutes] = useState('');
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'idle' | 'running' | 'stopped'>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const today = todayStr();
  const todayRecord = checkIns.find((c) => c.date === today);

  function finishCheckIn(minutes: number, method: 'manual' | 'stopwatch') {
    const minutesToday = (todayRecord?.minutes ?? 0) + minutes;
    const streakCurrent =
      streak.lastCheckInDate === today
        ? streak.current
        : streak.lastCheckInDate
          ? updateStreak({ current: streak.current, best: streak.longest }, streak.lastCheckInDate, today).current
          : 1;

    const checkInResult = upsertCheckInToday(minutes, method);
    const streakResult = applyStreak();

    if (!checkInResult.ok || !streakResult.ok) {
      setError('저장 공간이 부족해요. 기기 저장공간을 확인해 주세요');
      try {
        toast.openToast('저장에 실패했어요. 저장 공간을 확인해 주세요');
      } catch {
        /* WebView 밖에서는 throw될 수 있음 — 무시 */
      }
      return;
    }

    try {
      toast.openToast(`${minutes}분 기록 완료!`);
    } catch {
      /* WebView 밖에서는 throw될 수 있음 — 무시 */
    }

    navigate('/checkin/done', { state: { minutesToday, streakCurrent } });
  }

  function handleManualSubmit() {
    const minutes = Number(manualMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 1440) {
      setError('1분~1440분 사이로 입력해주세요');
      return;
    }
    finishCheckIn(minutes, 'manual');
  }

  function handleStopwatchAction() {
    if (phase === 'idle') {
      setElapsedSec(0);
      setPhase('running');
      return;
    }
    if (phase === 'running') {
      setPhase('stopped');
      return;
    }
    const minutes = Math.max(1, Math.round(elapsedSec / 60));
    finishCheckIn(minutes, 'stopwatch');
  }

  const footerLabel = mode === 'manual' ? '기록' : phase === 'idle' ? '시작' : phase === 'running' ? '정지' : '기록';
  const footerDisabled = mode === 'manual' && !manualMinutes;

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>오늘 공부 체크인</Top.TitleParagraph>} />}
      bottom={
        <SubmitFooter
          label={footerLabel}
          disabled={footerDisabled}
          onClick={mode === 'manual' ? handleManualSubmit : handleStopwatchAction}
        />
      }
    >
      <Tab
        onChange={(index) => {
          setMode(index === 0 ? 'manual' : 'stopwatch');
          setError('');
        }}
      >
        <Tab.Item selected={mode === 'manual'}>수동 입력</Tab.Item>
        <Tab.Item selected={mode === 'stopwatch'}>스탑워치</Tab.Item>
      </Tab>

      <Spacing size={24} />

      {mode === 'manual' ? (
        <TextField
          variant="box"
          label="학습 시간(분)"
          placeholder="예: 90"
          inputMode="numeric"
          value={manualMinutes}
          onChange={(e) => {
            setManualMinutes(e.target.value);
            setError('');
          }}
          hasError={!!error}
          help={error || undefined}
        />
      ) : (
        <Card>
          <Paragraph.Text typography="t2">{formatElapsed(elapsedSec)}</Paragraph.Text>
        </Card>
      )}

      {mode === 'stopwatch' && error ? (
        <>
          <Spacing size={8} />
          <Paragraph.Text typography="st13">{error}</Paragraph.Text>
        </>
      ) : null}

      <Spacing size={16} />

      <Paragraph.Text typography="t6">
        {todayRecord ? `오늘 ${todayRecord.minutes}분 기록했어요` : '아직 오늘 기록이 없어요'}
      </Paragraph.Text>

      <Spacing size={96} />
    </ScreenScaffold>
  );
}
