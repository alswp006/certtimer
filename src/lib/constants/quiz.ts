import type { QuizQuestion } from '@/lib/types';

/** BUILTIN_CERTS의 category 값과 1:1로 대응하는 문제 뱅크(카테고리당 코드 상수). */
const RAW_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  IT: [
    {
      id: 'quiz_it_1',
      type: 'ox',
      question: '관계형 데이터베이스에서 기본키(Primary Key)는 NULL 값을 가질 수 있다.',
      answer: false,
      explanation: '기본키는 NULL을 허용하지 않아 각 행을 고유하게 식별합니다.',
    },
    {
      id: 'quiz_it_2',
      type: 'mcq',
      question: 'SQL에서 중복된 행을 제거하고 조회할 때 사용하는 키워드는?',
      options: ['DISTINCT', 'GROUP BY', 'HAVING', 'LIMIT'],
      answer: 'DISTINCT',
      explanation: 'DISTINCT는 SELECT 결과에서 중복 행을 제거합니다.',
    },
    {
      id: 'quiz_it_3',
      type: 'ox',
      question: '정규화(Normalization)는 데이터 중복을 줄이고 무결성을 높이는 과정이다.',
      answer: true,
      explanation: '정규화는 테이블을 분해해 중복을 최소화하고 이상 현상을 방지합니다.',
    },
    {
      id: 'quiz_it_4',
      type: 'mcq',
      question: '다음 중 NoSQL 데이터베이스가 아닌 것은?',
      options: ['MongoDB', 'Redis', 'Oracle', 'Cassandra'],
      answer: 'Oracle',
      explanation: 'Oracle은 대표적인 관계형(RDBMS) 데이터베이스입니다.',
    },
  ],
  어학: [
    {
      id: 'quiz_lang_1',
      type: 'ox',
      question: '정규 TOEIC 시험은 듣기(LC)와 읽기(RC) 두 영역으로 구성된다.',
      answer: true,
      explanation: 'Speaking·Writing은 별도의 TOEIC Speaking/Writing 시험입니다.',
    },
    {
      id: 'quiz_lang_2',
      type: 'mcq',
      question: '다음 중 수동태 문장은?',
      options: ['He wrote the letter.', 'The letter was written by him.', 'He is writing the letter.', 'He will write the letter.'],
      answer: 'The letter was written by him.',
      explanation: "'be동사 + 과거분사' 형태가 수동태입니다.",
    },
    {
      id: 'quiz_lang_3',
      type: 'ox',
      question: 'JLPT는 N1이 가장 낮은 등급, N5가 가장 높은 등급이다.',
      answer: false,
      explanation: 'N1이 가장 높은 등급이고 N5가 가장 낮은 등급입니다.',
    },
    {
      id: 'quiz_lang_4',
      type: 'mcq',
      question: 'HSK는 어떤 언어의 능력을 평가하는 시험인가?',
      options: ['중국어', '일본어', '베트남어', '태국어'],
      answer: '중국어',
      explanation: 'HSK(汉语水平考试)는 중국어 능력을 평가하는 시험입니다.',
    },
  ],
  역사: [
    {
      id: 'quiz_history_1',
      type: 'ox',
      question: '한국사능력검정시험은 국사편찬위원회가 주관한다.',
      answer: true,
      explanation: '교육부 산하 국사편찬위원회가 시행·주관합니다.',
    },
    {
      id: 'quiz_history_2',
      type: 'mcq',
      question: '훈민정음을 창제한 왕은?',
      options: ['태조', '세종대왕', '정조', '고종'],
      answer: '세종대왕',
      explanation: '세종대왕이 1443년 훈민정음을 창제했습니다.',
    },
    {
      id: 'quiz_history_3',
      type: 'ox',
      question: '임진왜란은 조선 후기에 발생한 전쟁이다.',
      answer: false,
      explanation: '임진왜란(1592)은 조선 중기에 발생했습니다.',
    },
    {
      id: 'quiz_history_4',
      type: 'mcq',
      question: '고려를 건국한 인물은?',
      options: ['왕건', '이성계', '김유신', '광개토대왕'],
      answer: '왕건',
      explanation: '왕건이 918년 고려를 건국했습니다.',
    },
  ],
  부동산: [
    {
      id: 'quiz_realestate_1',
      type: 'ox',
      question: '공인중개사 시험은 1차·2차로 나뉘어 시행된다.',
      answer: true,
      explanation: '1차(부동산학개론 등), 2차(공인중개사법령 등)로 나뉩니다.',
    },
    {
      id: 'quiz_realestate_2',
      type: 'mcq',
      question: '부동산 등기부등본에서 소유권에 관한 사항이 기재되는 부분은?',
      options: ['표제부', '갑구', '을구', '별지'],
      answer: '갑구',
      explanation: '갑구에는 소유권, 을구에는 소유권 이외 권리(저당권 등)가 기재됩니다.',
    },
    {
      id: 'quiz_realestate_3',
      type: 'ox',
      question: '전세권은 등기해야만 효력이 발생하는 물권이다.',
      answer: true,
      explanation: '전세권은 민법상 물권으로 등기해야 효력이 생깁니다.',
    },
    {
      id: 'quiz_realestate_4',
      type: 'mcq',
      question: '감정평가사가 주로 수행하는 업무는?',
      options: ['부동산 중개', '부동산 가치 평가', '건축 설계', '세금 신고 대행'],
      answer: '부동산 가치 평가',
      explanation: '감정평가사는 토지·건물 등의 경제적 가치를 평가합니다.',
    },
  ],
  기타: [
    {
      id: 'quiz_etc_1',
      type: 'ox',
      question: '요양보호사는 국가자격이 아닌 민간자격이다.',
      answer: false,
      explanation: '요양보호사는 노인복지법에 근거한 국가자격입니다.',
    },
    {
      id: 'quiz_etc_2',
      type: 'mcq',
      question: '산업안전기사 시험 과목에 해당하지 않는 것은?',
      options: ['산업재해 예방', '기계·기구 위험방지', '외국어 회화', '전기 위험방지'],
      answer: '외국어 회화',
      explanation: '산업안전기사는 산업안전 관련 과목으로 구성되며 외국어 회화는 포함되지 않습니다.',
    },
    {
      id: 'quiz_etc_3',
      type: 'ox',
      question: '지게차운전기능사는 필기시험만으로 취득할 수 있다.',
      answer: false,
      explanation: '필기 합격 후 실기(주행·화물 적재 등) 시험도 통과해야 합니다.',
    },
    {
      id: 'quiz_etc_4',
      type: 'mcq',
      question: '다음 중 국가기술자격에 해당하는 것은?',
      options: ['전기기사', '바리스타 2급', '한자능력검정', 'TOEIC'],
      answer: '전기기사',
      explanation: '전기기사는 국가기술자격이며, 나머지는 대부분 민간자격 또는 어학시험입니다.',
    },
  ],
};

const FALLBACK_CATEGORY = '기타';
const MIN_PER_CATEGORY = 3;

/** 카테고리 문제 수가 최소치 미만이면 '기타' 문제로 채워 항상 최소치를 보장한다. */
function withFallback(bank: Record<string, QuizQuestion[]>): Record<string, QuizQuestion[]> {
  const fallbackQuestions = bank[FALLBACK_CATEGORY] ?? [];
  const result: Record<string, QuizQuestion[]> = {};

  for (const [category, questions] of Object.entries(bank)) {
    if (questions.length >= MIN_PER_CATEGORY || category === FALLBACK_CATEGORY) {
      result[category] = questions;
      continue;
    }
    const existingIds = new Set(questions.map((q) => q.id));
    const padding = fallbackQuestions.filter((q) => !existingIds.has(q.id)).slice(0, MIN_PER_CATEGORY - questions.length);
    result[category] = [...questions, ...padding];
  }

  return result;
}

export const QUIZ_BANK: Record<string, QuizQuestion[]> = withFallback(RAW_QUIZ_BANK);
