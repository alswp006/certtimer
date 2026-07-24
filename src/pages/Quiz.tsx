import { useMemo, useState } from 'react';
import { Top, Paragraph, Spacing, Button } from '@toss/tds-mobile';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { Card } from '@/components/Card';
import { EmptyState, LoadingState } from '@/components/StateView';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { TAB_ITEMS } from '@/components/tabItems';
import { useAppData } from '@/lib/store';
import { QUIZ_BANK } from '@/lib/constants/quiz';
import { BUILTIN_CERTS } from '@/lib/constants/certs';
import { pickDailyQuizIds } from '@/lib/calc';
import { todayStr } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/types';

const DAILY_QUIZ_COUNT = 3;
const FALLBACK_CATEGORY = '기타';

export default function Quiz() {
  const { userCert, quiz, answerQuizQuestion } = useAppData();
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string } | null>(null);

  const today = todayStr();
  // UserCert에는 category가 없다(내장 프리셋 스냅샷 아님) — certId로 내장 목록에서 역참조,
  // 커스텀/미매칭 시 '기타'로 폴백.
  const matchedCert = userCert ? BUILTIN_CERTS.find((c) => c.id === userCert.certId) : undefined;
  const category = matchedCert && QUIZ_BANK[matchedCert.category] ? matchedCert.category : FALLBACK_CATEGORY;
  const bank = QUIZ_BANK[category] ?? [];

  const dailyIds = useMemo(
    () => pickDailyQuizIds(bank, DAILY_QUIZ_COUNT, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [category, today]
  );
  const questions = dailyIds
    .map((id) => bank.find((q) => q.id === id))
    .filter((q): q is QuizQuestion => Boolean(q));

  const answeredIds = quiz?.date === today ? quiz.answeredIds : [];
  const doneCount = answeredIds.length;
  const isComplete = questions.length > 0 && doneCount >= questions.length;
  const currentQuestion = questions[doneCount];

  const top = <Top title={<Top.TitleParagraph>오늘의 퀴즈</Top.TitleParagraph>} />;

  if (questions.length === 0) {
    return (
      <ScreenScaffold top={top} bottom={<FloatingTabBar items={TAB_ITEMS} />}>
        <LoadingState rows={3} testId="quiz-loading" />
      </ScreenScaffold>
    );
  }

  if (isComplete) {
    return (
      <ScreenScaffold top={top} bottom={<FloatingTabBar items={TAB_ITEMS} />}>
        <EmptyState title="오늘 퀴즈 완료! 내일 또 만나요" testId="quiz-complete" />
      </ScreenScaffold>
    );
  }

  function handleAnswer(choice: string) {
    if (!currentQuestion || selected) return;
    const correct =
      currentQuestion.type === 'ox'
        ? currentQuestion.answer === (choice === 'O')
        : currentQuestion.answer === choice;
    setSelected(choice);
    setFeedback({ correct, explanation: currentQuestion.explanation });
    answerQuizQuestion(currentQuestion.id, correct);
  }

  function handleNext() {
    setSelected(null);
    setFeedback(null);
  }

  const options = currentQuestion.type === 'ox' ? ['O', 'X'] : (currentQuestion.options ?? []);
  const insufficientNotice = bank.length < DAILY_QUIZ_COUNT ? `오늘은 ${questions.length}문제예요` : null;

  return (
    <ScreenScaffold top={top} bottom={<FloatingTabBar items={TAB_ITEMS} />}>
      <Paragraph.Text typography="st11">
        {doneCount + 1} / {questions.length}
      </Paragraph.Text>
      <Spacing size={16} />

      <Card testId="quiz-question-card">
        <Paragraph.Text typography="t4">{currentQuestion.question}</Paragraph.Text>
      </Card>

      {insufficientNotice ? (
        <>
          <Spacing size={8} />
          <Paragraph.Text typography="st13">{insufficientNotice}</Paragraph.Text>
        </>
      ) : null}

      <Spacing size={24} />

      {options.map((opt) => (
        <div key={opt}>
          <Button
            variant={selected === opt ? 'fill' : 'weak'}
            display="block"
            disabled={!!selected}
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </Button>
          <Spacing size={12} />
        </div>
      ))}

      {feedback ? (
        <Card testId="quiz-feedback-card">
          <Paragraph.Text typography="t6">{feedback.correct ? '정답이에요' : '오답이에요'}</Paragraph.Text>
          <Spacing size={4} />
          <Paragraph.Text typography="st13">{feedback.explanation}</Paragraph.Text>
          <Spacing size={16} />
          <Button variant="fill" display="block" onClick={handleNext}>
            다음 문제
          </Button>
        </Card>
      ) : null}

      <Spacing size={80} />
    </ScreenScaffold>
  );
}
