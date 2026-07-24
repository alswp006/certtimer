# SPEC — CertTimer

## Common Principles

- **플랫폼**: 앱인토스 (Vite + React + TypeScript + TDS `@toss/tds-mobile`), React Router(`react-router-dom`) 클라이언트 라우팅, 데이터는 전량 `localStorage` 저장. 서버/DB 없음.
- **인증**: 토스 세션 자동 제공. 별도 로그인 호출 없음. 사용자 식별 필요 시 `getIsTossLoginIntegratedService()`로 통합 여부만 확인.
- **UI**: 모든 화면은 TDS 컴포넌트로만 구성(ListRow, Button, TextField, Paragraph.Text, Chip, Switch, AlertDialog, BottomSheet, Toast, Top, Tab). 하단 탭은 템플릿 제공 `src/components/FloatingTabBar` 사용. 여백은 TDS `Spacing`(size 필수)만 사용, TDS 컴포넌트 padding/margin 오버라이드 금지.
- **색상**: HEX 하드코딩 금지 → `var(--tds-color-*)` 또는 TDS 컴포넌트만. 다크모드 필수 지원.
- **모바일**: 3000만 유저 모바일 전용. 모든 터치 타깃 ≥ 44px. 폼은 모바일 키보드 대응.
- **광고**: 배너 `<AdSlot adGroupId={import.meta.env.VITE_TOSS_AD_GROUP_ID} />`, 리워드 게이트 `<TossRewardAd slotId={import.meta.env.VITE_TOSS_AD_SLOT_ID}>{children}</TossRewardAd>`. 광고는 콘텐츠와 겹치지 않게 섹션 사이/결과 뒤에만 배치.
- **결과물 성격**: 합격 예측 리포트는 **누적 학습량 기반 결정론적(rule-based) 계산**이며 생성형 AI 미사용 → AI 고지 의무 비대상(Assumptions 참조).
- **외부 이탈 금지**: `window.location.href`/`window.open` 외부 URL 이동 금지. 외부 분석 솔루션(GA/Amplitude) 미사용.
- **호환성**: Android 7+, iOS 16+. 프로덕션 빌드에서 `console.error` 0개, CORS 에러 0개.
- **날짜 기준**: 모든 “오늘” 판정은 디바이스 로컬 타임존 `YYYY-MM-DD` 문자열 비교.

---

## Data Models

### Certification — 시험 정의(내장 50종 + 커스텀)
```typescript
interface Certification {
  id: string;              // 내장: "cert_gongin", 커스텀: "custom_" + timestamp
  name: string;            // "공인중개사", 최대 30자
  category: string;        // "부동산" | "IT" | "어학" | "역사" | "기타"
  examDate: string;        // ISO "YYYY-MM-DD"
  isBuiltIn: boolean;      // 내장 여부
  recommendedTotalMinutes: number; // 권장 총 학습시간(분), 내장 프리셋값. 예: 12000
}
```
- constraints: `name` 1~30자, `examDate`는 유효한 날짜 문자열, `recommendedTotalMinutes` ≥ 60.

### UserCert — 사용자가 선택/등록한 목표 자격증(1개, MVP)
```typescript
interface UserCert {
  certId: string;             // Certification.id 참조
  name: string;               // 스냅샷(커스텀/삭제 대비)
  examDate: string;           // "YYYY-MM-DD"
  targetTotalMinutes: number; // 사용자 목표 총 학습시간(분), 기본=recommendedTotalMinutes
  selectedAt: number;         // epoch ms
}
```
- constraints: `targetTotalMinutes` 60~600000, `examDate`는 오늘 이후 권장(과거면 D+N 표기).

### CheckIn — 일일 학습 체크인 기록
```typescript
interface CheckIn {
  id: string;                       // "ci_" + epoch ms
  date: string;                     // "YYYY-MM-DD" (하루 1레코드, 합산)
  minutes: number;                  // 누적 분, 1~1440
  method: 'stopwatch' | 'manual';   // 마지막 입력 방식
  updatedAt: number;                // epoch ms
}
```
- constraints: `date`당 최대 1개(같은 날 재체크인 시 `minutes` 누적/갱신), `minutes` 1~1440.

### StreakState — 연속 체크인 스트릭
```typescript
interface StreakState {
  current: number;          // 현재 연속일, ≥0
  longest: number;          // 최장 연속일, ≥0
  lastCheckInDate: string;  // "YYYY-MM-DD", 없으면 ""
}
```

### QuizProgress — 일일 퀴즈 진행/오답
```typescript
interface QuizProgress {
  date: string;             // "YYYY-MM-DD" (오늘 세트 기준)
  answeredIds: string[];    // 오늘 푼 문제 id (최대 3)
  wrongIds: string[];       // 누적 오답 문제 id (중복 제거, 최대 500)
}
```

### AppFlags — 1회성 플래그/온보딩
```typescript
interface AppFlags {
  onboarded: boolean;           // 자격증 최초 선택 완료
  reportDisclaimerSeen: boolean;// 예측 리포트 안내 확인
}
```

### localStorage 키 목록 & 크기 추정
| key | shape | 예상 크기 |
|---|---|---|
| `certtimer.userCert` | `UserCert` | ~0.2KB |
| `certtimer.checkins` | `CheckIn[]` | 1년치 365개 × ~0.1KB ≈ 40KB |
| `certtimer.streak` | `StreakState` | ~0.1KB |
| `certtimer.quiz` | `QuizProgress` | 오답 500개 × ~15B ≈ 8KB |
| `certtimer.flags` | `AppFlags` | ~0.1KB |
| `certtimer.builtinCerts`(선택적 캐시) | `Certification[]` | 50개 × ~0.15KB ≈ 8KB |
- **총합 < 100KB** → 5MB 한도 대비 충분. 내장 시험 DB는 코드 번들 상수로 포함(별도 저장 불필요).

---

## Feature List

> 5~8개 앱 고유 기능. 로그인/TDS 셋업/광고 래퍼 컴포넌트는 이미 제공됨(재설계 금지).

### F1. 데이터 레이어 & 저장소 헬퍼
- **Description**: 모든 엔티티(UserCert, CheckIn, StreakState, QuizProgress, AppFlags)의 타입 정의와 localStorage read/write/마이그레이션 헬퍼를 제공한다. 저장 실패(QuotaExceeded)·손상 데이터 파싱 오류를 안전하게 처리하는 단일 진입점을 만든다.
- **Data**: 위 Data Models 전체
- **API**: 없음(로컬 전용)
- **Requirements**:
  - AC-1 [U][P0]: Scenario: 저장/조회 왕복
    - Given 저장소 헬퍼 `saveUserCert()`, `getUserCert()`가 있을 때
    - When `{ certId: "cert_sqld", name: "SQLD", examDate: "2026-09-05", targetTotalMinutes: 6000, selectedAt: 1750000000000 }`를 저장 후 조회
    - Then 동일한 객체가 반환됨(deep equal)
  - AC-2 [U][P0]: Scenario: 키 네임스페이스 고정
    - Given 저장 헬퍼가 있을 때
    - When UserCert를 저장
    - Then `localStorage`에 정확히 `certtimer.userCert` 키로 JSON 문자열이 기록됨
  - AC-3 [W][P1]: Scenario: 손상 JSON 복구
    - Given `localStorage["certtimer.checkins"] = "{broken"` 인 상태
    - When `getCheckIns()` 호출
    - Then 예외를 던지지 않고 `[]`를 반환하며 `console.error` 미출력
  - AC-4 [W][P1]: Scenario: 저장 용량 초과 처리
    - Given `localStorage.setItem`이 `QuotaExceededError`를 던지는 상태
    - When `saveCheckIns(list)` 호출
    - Then `false`를 반환하고 토스트 "저장 공간이 부족해요. 오래된 기록을 정리해주세요"를 트리거할 수 있게 실패 신호를 반환
  - AC-5 [E][P1]: Scenario: 초기 빈 상태
    - Given 어떤 키도 없는 신규 유저
    - When 각 getter 호출
    - Then `getUserCert()=null`, `getCheckIns()=[]`, `getStreak()={current:0,longest:0,lastCheckInDate:""}`, `getFlags()={onboarded:false,reportDisclaimerSeen:false}` 반환
  - AC-6 [U][P2]: Scenario: 스키마 버전 태그
    - Given 저장 데이터가 있을 때
    - When 저장
    - Then 각 payload에 `_v: 1` 필드가 포함되어 향후 마이그레이션 분기가 가능함

### F2. 자격증 선택 & 커스텀 등록 (온보딩)
- **Description**: 내장 50종 시험 DB에서 검색·선택하거나 커스텀 시험을 직접 등록한다. 선택 시 UserCert가 생성되고 홈으로 이동한다. 최초 진입 시 온보딩으로 강제된다.
- **Data**: `Certification`(내장 상수), `UserCert`, `AppFlags`
- **API**: 없음
- **Requirements**:
  - AC-1 [E][P0]: Scenario: 내장 시험 선택
    - Given 온보딩 화면에서
    - When 목록에서 "SQLD"(examDate "2026-09-05", recommendedTotalMinutes 6000)를 탭
    - Then UserCert `{certId:"cert_sqld", name:"SQLD", examDate:"2026-09-05", targetTotalMinutes:6000}`가 저장되고 `flags.onboarded=true`로 갱신, `/`로 이동
  - AC-2 [E][P0]: Scenario: 커스텀 시험 등록
    - Given 커스텀 등록 BottomSheet에서
    - When `{ name:"사내 승진시험", category:"기타", examDate:"2026-12-01", targetTotalMinutes:3000 }` 제출
    - Then `id="custom_"+timestamp`인 UserCert가 저장되고 홈으로 이동
  - AC-3 [E][P1]: Scenario: 시험 검색 필터
    - Given 내장 50종 목록에서
    - When 검색 필드에 "컴활" 입력
    - Then name에 "컴활" 포함 항목만 리스트에 표시되고, 0건이면 빈 상태 문구 "검색 결과가 없어요"와 "직접 등록" 버튼 표시
  - AC-4 [W][P1]: Scenario: 빈 이름 거부
    - Given 커스텀 등록에서
    - When `{ name:"", examDate:"2026-12-01", targetTotalMinutes:3000 }` 제출
    - Then 에러 메시지 "시험 이름을 입력해주세요" 표시, 저장 안 됨
  - AC-5 [W][P1]: Scenario: 과거 시험일 경고
    - Given 커스텀 등록에서 오늘이 2026-07-25일 때
    - When `examDate:"2026-01-01"` 제출
    - Then 에러 메시지 "시험일은 오늘 이후로 설정해주세요" 표시, 저장 안 됨
  - AC-6 [S][P1]: Scenario: 이미 온보딩 완료 시 스킵
    - Given `flags.onboarded=true`이고 UserCert가 존재하는 상태
    - When 앱 진입
    - Then 온보딩 화면을 건너뛰고 홈(`/`)이 표시됨
  - AC-7 [U][P1]: Scenario: 목록 로딩/빈 상태
    - Given 내장 목록 렌더 전
    - Then 스켈레톤 로딩 표시, 데이터 준비 후 목록 표시(내장은 항상 50건이라 빈 목록 없음, 검색 결과 0건만 빈 상태)

### F3. 홈 대시보드 — D-day & 일일 목표 학습량
- **Description**: 선택한 자격증의 D-day, 오늘 목표 학습량, 오늘/누적 달성률을 시각화한다. 남은 학습량 = `max(0, targetTotalMinutes - 누적분)`을 남은 일수로 나눠 일일 목표를 산출한다. 핵심 가치 화면으로 히어로 숫자와 카드 위계를 갖춘다.
- **Data**: `UserCert`, `CheckIn[]`, `StreakState`
- **API**: 없음
- **Requirements**:
  - AC-1 [U][P0]: Scenario: D-day 계산
    - Given UserCert `examDate:"2026-09-05"`, 오늘 2026-07-25
    - When 홈 렌더
    - Then D-day 배지에 "D-42" 표시(examDate−오늘, 로컬 날짜 차이)
  - AC-2 [U][P0]: Scenario: 일일 목표 학습량 계산
    - Given `targetTotalMinutes=6000`, 누적 체크인 합계 `1200분`, 남은 일수 42일
    - When 홈 렌더
    - Then 오늘 목표 = `ceil((6000-1200)/42) = 115분`이 "오늘 목표 115분"으로 표시
  - AC-3 [U][P0]: Scenario: 누적 달성률 시각화
    - Given `targetTotalMinutes=6000`, 누적 `1200분`
    - When 홈 렌더
    - Then 진행률 = `20%`가 프로그레스 UI와 히어로 숫자로 표시(`data-testid="progress-hero"`)
  - AC-4 [S][P1]: Scenario: 시험일 경과 상태
    - Given examDate가 과거(2026-07-01), 오늘 2026-07-25
    - When 홈 렌더
    - Then "D+24" 표기 및 일일 목표는 "시험일이 지났어요"로 대체, 음수 목표 미표시
  - AC-5 [W][P1]: Scenario: 목표 달성 시 0 클램프
    - Given 누적 `6500분` ≥ `targetTotalMinutes=6000`
    - When 홈 렌더
    - Then 진행률 "100%", 오늘 목표 "목표 달성! 오늘도 복습해요"로 표시(음수/100% 초과 없음)
  - AC-6 [E][P1]: Scenario: 자격증 미선택 빈 상태
    - Given UserCert가 `null`
    - When 홈 진입
    - Then 빈 상태 카드(Asset.ContentIcon + "학습할 자격증을 선택해주세요")와 "자격증 선택" 버튼 표시, 탭 시 `/select` 이동
  - AC-7 [U][P1]: Scenario: 로딩 상태
    - Given 저장소 조회 중
    - Then 히어로/카드 자리에 스켈레톤 표시 후 데이터로 치환
  - AC-8 [U][P0]: Scenario: 레이아웃 계약
    - Given 홈 렌더 완료
    - Then `ScreenScaffold`로 감싸이고, `data-testid="dday-card"`·`data-testid="progress-hero"`·`data-testid="today-goal-card"` 3개 Card가 존재하며 D-day는 t2 강조 타이포로 표기

### F4. 공부 체크인 (스탑워치 / 수동 입력) & 스트릭
- **Description**: 스탑워치로 실시간 측정하거나 분 단위로 수동 입력하여 오늘 학습을 기록한다. 같은 날 재기록은 누적된다. 하루 최초 체크인 시 스트릭이 갱신되고 완료 화면에 배너 광고를 노출한다.
- **Data**: `CheckIn[]`, `StreakState`
- **API**: 없음
- **Requirements**:
  - AC-1 [E][P0]: Scenario: 수동 체크인 성공
    - Given 오늘 2026-07-25, 기존 오늘 기록 없음
    - When 수동 입력 `{ minutes: 90, method:"manual" }` 제출
    - Then `certtimer.checkins`에 `{date:"2026-07-25", minutes:90, method:"manual"}` 저장, 성공 토스트 "90분 기록 완료!" 표시, 체크인 완료 화면 이동
  - AC-2 [E][P0]: Scenario: 같은 날 누적
    - Given 오늘 기록 `minutes:90` 존재
    - When 추가로 `minutes:30` 체크인
    - Then 오늘 레코드가 `minutes:120`으로 갱신(신규 레코드 미생성)
  - AC-3 [E][P0]: Scenario: 스탑워치 측정 반영
    - Given 스탑워치를 시작 후 정지했을 때 경과 `00:25:30`
    - When "기록" 탭
    - Then `minutes = round(1530s/60) = 26분`이 오늘 기록에 누적, `method:"stopwatch"`
  - AC-4 [E][P0]: Scenario: 스트릭 증가
    - Given `streak={current:3, longest:5, lastCheckInDate:"2026-07-24"}`, 오늘 2026-07-25 첫 체크인
    - When 체크인 완료
    - Then `streak.current=4`, `longest=5`, `lastCheckInDate="2026-07-25"`로 갱신
  - AC-5 [W][P1]: Scenario: 스트릭 끊김 리셋
    - Given `lastCheckInDate:"2026-07-22"`, 오늘 2026-07-25 첫 체크인(하루 이상 공백)
    - When 체크인 완료
    - Then `streak.current=1`로 리셋(끊긴 후 재시작)
  - AC-6 [W][P1]: Scenario: 잘못된 수동 입력 거부
    - Given 수동 입력 폼에서
    - When `minutes:0` 또는 `minutes:1441` 제출
    - Then 에러 메시지 "1분~1440분 사이로 입력해주세요" 표시, 저장 안 됨
  - AC-7 [E][P1]: Scenario: 키보드 대응
    - Given 수동 입력 TextField 포커스 시
    - Then 숫자 키보드(inputMode="numeric")가 뜨고, 제출 버튼은 키보드 위에 하단 고정되어 가려지지 않음
  - AC-8 [E][P0]: Scenario: 체크인 완료 배너 광고
    - Given 체크인 완료 화면
    - When 화면 렌더
    - Then 결과 카드 하단(콘텐츠와 비겹침 섹션)에 `<AdSlot adGroupId={VITE_TOSS_AD_GROUP_ID} />` 배너 노출

### F5. 합격 가능성 예측 리포트 (리워드 광고 게이트)
- **Description**: 누적 학습량·일일 목표 달성 추세·남은 일수를 기반으로 결정론적 점수(0~100)와 상태 라벨을 산출하여 리포트로 보여준다. 리포트 본문은 `TossRewardAd`로 게이트되어 광고 시청 완료 후 공개된다. 생성형 AI 미사용.
- **Data**: `UserCert`, `CheckIn[]`(누적/최근 7일), `StreakState`
- **API**: 없음
- **Requirements**:
  - AC-1 [U][P0]: Scenario: 예측 점수 산출식
    - Given `targetTotalMinutes=6000`, 누적 `1800분`(진행 30%), 최근 7일 목표 대비 평균 달성률 80%, 남은 42일
    - When 리포트 계산
    - Then 점수 = `round(진행률가중 + 최근추세가중)` 결정론적 값이 산출되고, 동일 입력에 항상 동일 점수(재현성 보장)
  - AC-2 [E][P0]: Scenario: 리워드 광고 게이트
    - Given 홈에서 "합격 예측 리포트 보기" 탭 → `/report` 진입
    - When `TossRewardAd` 광고 시청 완료
    - Then 리포트 본문(점수·상태 라벨·조언 카드)이 표시됨
  - AC-3 [W][P1]: Scenario: 광고 미시청 시 잠금 유지
    - Given `/report`에서 광고를 시청하지 않고 닫음
    - When 리포트 화면 상태
    - Then 본문은 블러/잠금 상태로 유지되고 "광고 시청 후 리포트가 공개돼요" 안내 표시, 점수 값 미노출
  - AC-4 [S][P0]: Scenario: 상태 라벨 매핑
    - Given 계산 점수가 각각 25 / 55 / 85일 때
    - When 리포트 렌더
    - Then 각각 "분발 필요"(≤40) / "순항 중"(41~70) / "합격 유력"(≥71) 라벨과 대응 Chip 색상(TDS 시맨틱 컬러)로 표시
  - AC-5 [W][P1]: Scenario: 데이터 부족 처리
    - Given 체크인 기록이 0건
    - When `/report` 진입
    - Then 광고 게이트 대신 빈 상태 "학습 기록이 있어야 예측할 수 있어요"와 "체크인하러 가기" 버튼 표시, 광고 미호출
  - AC-6 [U][P1]: Scenario: 계산 로딩 상태
    - Given 광고 시청 완료 직후
    - Then 리포트 계산 중 스켈레톤(≤300ms) 후 결과 카드로 치환
  - AC-7 [U][P0]: Scenario: 레이아웃 계약
    - Given 리포트 공개 상태
    - Then `data-testid="score-hero"` SummaryHero(CountUp 점수)와 `data-testid="advice-card"` Card가 존재하고, 최근 7일 학습 추이는 Sparkline으로 시각화됨

### F6. 기출 키워드 퀴즈 (1일 3문제 + 오답 저장)
- **Description**: 선택 자격증 카테고리의 기출 키워드 O/X·객관식 문제를 하루 3문제 제공한다. 정답 여부를 즉시 피드백하고 오답은 localStorage에 누적 저장한다. 하루 세트를 모두 풀면 완료 상태로 잠긴다.
- **Data**: `QuizProgress`, 문제 뱅크(코드 상수)
- **API**: 없음
- **Requirements**:
  - AC-1 [E][P0]: Scenario: 정답 처리
    - Given 오늘 세트의 1번 문제(정답 "O")
    - When 사용자가 "O" 선택
    - Then "정답이에요" 피드백 표시, `answeredIds`에 문제 id 추가, 다음 문제로 이동
  - AC-2 [E][P0]: Scenario: 오답 저장
    - Given 2번 문제(정답 "X")
    - When 사용자가 "O" 선택
    - Then "오답이에요" 피드백 + 해설 표시, `quiz.wrongIds`에 문제 id 추가(중복 제거)
  - AC-3 [S][P0]: Scenario: 일일 3문제 제한
    - Given 오늘 `answeredIds.length === 3`
    - When 퀴즈 화면 진입
    - Then 문제 대신 완료 상태 "오늘 퀴즈 완료! 내일 또 만나요" 표시, 추가 문제 미노출
  - AC-4 [E][P1]: Scenario: 날짜 변경 시 새 세트
    - Given `quiz.date="2026-07-24"`, 오늘 2026-07-25
    - When 퀴즈 진입
    - Then `date`가 "2026-07-25"로 갱신되고 `answeredIds=[]`로 초기화, 새 3문제 제공(`wrongIds`는 유지)
  - AC-5 [W][P1]: Scenario: 오답 저장 한도
    - Given `wrongIds.length === 500`
    - When 새 오답 발생
    - Then 가장 오래된 오답 1개를 제거하고 신규 오답 추가(FIFO, 500 상한 유지)
  - AC-6 [U][P1]: Scenario: 문제 없음/로딩 상태
    - Given 해당 카테고리 문제 뱅크 로드 중
    - Then 스켈레톤 표시; 뱅크가 3문제 미만이면 있는 문제만 제공하고 "오늘은 N문제예요" 안내
  - AC-7 [U][P2]: Scenario: 진행 인디케이터
    - Given 퀴즈 진행 중
    - Then 상단에 "2 / 3" 진행 표시가 갱신됨

### F7. 앱 셸 & 하단 탭 네비게이션 + 검수 가드
- **Description**: 홈/체크인/퀴즈/리포트 진입을 잇는 `FloatingTabBar` 기반 셸과 라우팅, 온보딩 리다이렉트, 토스 검수 통과용 공통 가드(외부 이탈 차단·콘솔 에러 0·색상 토큰)를 구성한다.
- **Data**: `AppFlags`
- **API**: 없음
- **Requirements**:
  - AC-1 [U][P0]: Scenario: 탭 네비게이션
    - Given 앱 셸 렌더
    - When 하단 탭 "홈/퀴즈" 탭
    - Then `FloatingTabBar`로 각 라우트(`/`, `/quiz`)로 전환, 각 탭 터치 타깃 ≥ 44px
  - AC-2 [E][P0]: Scenario: 미온보딩 리다이렉트
    - Given `flags.onboarded=false`
    - When 임의 경로 진입
    - Then `/select`로 리다이렉트
  - AC-3 [W][P0]: Scenario: 외부 도메인 이탈 차단
    - Given 앱 내 어떤 액션
    - When 외부 URL로의 `window.location.href`/`window.open` 시도가 코드에 존재
    - Then 해당 호출이 없어야 함(정적 검사) — 외부 이동 미발생
  - AC-4 [U][P0]: Scenario: 콘솔/CORS 에러 0
    - Given 프로덕션 빌드 실행
    - Then 전 플로우에서 `console.error` 0개, 외부 API 없음으로 CORS 에러 0개
  - AC-5 [W][P0]: Scenario: 색상 하드코딩 금지
    - Given 전 컴포넌트 스타일
    - When 스타일 검사
    - Then `#`로 시작하는 HEX 리터럴이 없어야 하고 색상은 `var(--tds-color-*)`/TDS 컴포넌트만 사용(다크모드 동작)
  - AC-6 [W][P1]: Scenario: 앱 설치 유도 문구 금지
    - Given 전 화면 텍스트
    - Then "앱을 설치하세요/다운로드" 등 외부 앱 설치 유도 문구·배너·링크가 없어야 함
  - AC-7 [U][P2]: Scenario: 라우트 폴백
    - Given 정의되지 않은 경로 진입
    - Then 홈(`/`)으로 리다이렉트

---

## Screen Definitions

### S1. 자격증 선택/온보딩 — `/select`
- **TDS 컴포넌트**: `Top`(타이틀 "학습할 자격증 선택"), `TextField`(검색, inputMode="text"), `ListRow`(시험 항목, 우측 D-day Chip), `Chip`(카테고리 필터), `Button`(하단 "직접 등록" display="block"), `BottomSheet`(커스텀 등록 폼: `TextField` name, `TextField`(numeric) 목표시간, 날짜 입력, `Button` 제출), `Toast`(등록 완료).
- **레이아웃**: `ScreenScaffold`로 감싸고 검색바 고정 상단, 목록 스크롤, "직접 등록"은 `SubmitFooter` 하단 고정.
- **상태**: 로딩=목록 스켈레톤 6행 / 빈=검색 0건 "검색 결과가 없어요" + 직접 등록 버튼 / 에러=저장 실패 토스트.
- **터치**: 각 `ListRow` 높이 ≥ 56px(≥44px 충족), 카테고리 Chip ≥ 44px.
- **스크롤**: 내장 50종 단일 리스트(≤50건) 일반 스크롤. 커스텀 누적 없음(MVP 1개).
- **Navigation 계약**:
  - Incoming: `location.state = undefined`
  - Outgoing: 선택/등록 완료 → `navigate('/', { replace: true })` (state 없음)

### S2. 홈 대시보드 — `/`
- **TDS 컴포넌트**: `Top`, `Chip`(D-day 배지), `Paragraph.Text`, `Button`(체크인/리포트 진입, display="block"), TDS 프로그레스/`Spacing`. Card 위계 사용, `SummaryHero`(진행률 CountUp), `Sparkline`(최근 7일 추이).
- **레이아웃**: `ScreenScaffold` + Card 3개(`data-testid="dday-card"`, `progress-hero`, `today-goal-card`). D-day t2 강조.
- **상태**: 로딩=히어로/카드 스켈레톤 / 빈=UserCert null → 빈 상태 카드(Asset.ContentIcon) + "자격증 선택" / 에러=저장소 손상 시 기본값 렌더.
- **터치**: "오늘 공부 체크인", "합격 예측 리포트 보기" 버튼 높이 ≥ 48px.
- **Navigation 계약**:
  - Incoming: `location.state = undefined`
  - Outgoing: 체크인 → `navigate('/checkin')`; 리포트 → `navigate('/report')`; 자격증 변경 → `navigate('/select')`

### S3. 공부 체크인 — `/checkin` → 완료 `/checkin/done`
- **TDS 컴포넌트**: `Tab`(스탑워치/수동 전환), `Button`(시작·정지·기록, display="block"), `TextField`(numeric, 분 입력), `Paragraph.Text`(경과 시간 `HH:MM:SS`), `Toast`(성공), 완료 화면 Card + `AdSlot` 배너.
- **레이아웃**: `ScreenScaffold`. 상단 Tab, 중앙 타이머/입력, `SubmitFooter`에 "기록" 버튼 하단 고정(키보드 위 유지).
- **상태**: 로딩=없음(즉시) / 빈=오늘 기록 0 "아직 오늘 기록이 없어요" / 에러=`minutes` 범위/저장 실패 인라인 에러.
- **터치**: 시작/정지/기록 버튼 ≥ 48px, Tab 항목 ≥ 44px.
- **키보드**: numeric 키보드, 제출 버튼 키보드 겹침 방지 하단 고정.
- **Navigation 계약**:
  - Incoming: `location.state = undefined`
  - Outgoing: 기록 완료 → `navigate('/checkin/done', { state: { minutesToday: number, streakCurrent: number } })`
  - 완료 화면 Incoming: `location.state = { minutesToday: number, streakCurrent: number }` (없으면 저장소에서 재조회 fallback)

### S4. 합격 예측 리포트 — `/report`
- **TDS 컴포넌트**: `Top`, `TossRewardAd`(본문 게이트), `SummaryHero`(점수 CountUp, `data-testid="score-hero"`), `Chip`(상태 라벨), `Card`(조언 `data-testid="advice-card"`), `Sparkline`(최근 7일 추이), `Button`.
- **레이아웃**: `ScreenScaffold`. 게이트 전=잠금 카드 + "광고 보고 리포트 공개" 버튼(display="block"); 게이트 후=점수 히어로 + 상태 Chip + 조언 Card.
- **상태**: 로딩=계산 스켈레톤(≤300ms) / 빈=체크인 0건 "학습 기록이 있어야 예측할 수 있어요" + "체크인하러 가기"(광고 미호출) / 에러=계산 실패 시 "잠시 후 다시 시도해주세요".
- **터치**: "광고 보고 공개"/"체크인하러 가기" 버튼 ≥ 48px.
- **Navigation 계약**:
  - Incoming: `location.state = undefined` (데이터는 저장소에서 계산)
  - Outgoing: 빈 상태 → `navigate('/checkin')`; 뒤로 → `navigate('/')`

### S5. 기출 키워드 퀴즈 — `/quiz`
- **TDS 컴포넌트**: `Top`, `Paragraph.Text`(문제·"2/3" 진행), `Button`(O/X·보기 선택, display="block", 최소 높이 48px), `Card`(해설), `Toast`.
- **레이아웃**: `ScreenScaffold`. 문제 Card 중앙, 선택 버튼 세로 나열(각 ≥48px), 하단 진행 인디케이터.
- **상태**: 로딩=문제 스켈레톤 / 빈=완료 "오늘 퀴즈 완료! 내일 또 만나요" / 에러=뱅크 부족 "오늘은 N문제예요".
- **터치**: 보기 버튼 세로 간격 `Spacing size` 적용, 각 ≥48px.
- **Navigation 계약**:
  - Incoming: `location.state = undefined`
  - Outgoing: 완료 후 → `navigate('/')` (선택)

---

## API Contract

**외부 API 없음.** 모든 데이터는 `localStorage`에 저장되며, 예측 점수·목표 계산·퀴즈 채점은 클라이언트 순수 함수로 처리한다. 향후 크로스 디바이스 동기화가 필요하면 별도 Railway API 서버(예: `POST /sync {userCert, checkins} → {ok:boolean}`, 에러 `{ error: string }`)를 신설하되 **MVP 범위 아님**.

> 참고: 프로모션(사용자 획득) 캠페인을 붙일 경우에만 `grantPromotionReward({ promotionCode, amount })`를 사용하며 `amount ≤ 5000` 검증 필수(현재 브리프에 프로모션 코드 미포함 → MVP 미포함, Open Questions 참조).

---

## Assumptions

1. **합격 예측 리포트는 생성형 AI가 아니다.** 누적 학습량·최근 7일 달성 추세·남은 일수를 입력으로 하는 결정론적 공식 기반이므로 생성형 AI 고지 의무(사전 고지/결과물 라벨) 비대상. 만약 향후 LLM 기반 조언 문구를 도입하면 AI 고지 ACs를 추가해야 함.
2. **MVP는 자격증 1개**만 활성 추적(UserCert 단일). 다중 자격증 전환은 후속.
3. 내장 시험 DB 50종의 `examDate`·`recommendedTotalMinutes`는 앱 배포 시점 상수로 하드코딩. 매년 시험일 갱신은 번들 업데이트로 처리.
4. 예측 점수 가중치(진행률 vs 최근 추세 비율)는 구현 시 고정 상수(예: 진행률 60% + 추세 40%)로 확정하며 동일 입력→동일 출력 재현성 보장.
5. 퀴즈 문제 뱅크는 카테고리별 코드 상수(외부 호출 없음). 하루 세트는 날짜 시드 기반 결정론적 선택.
6. 배너/리워드 광고 및 SKU/그룹 ID는 앱인토스 콘솔에서 발급되어 env로 주입(`VITE_TOSS_AD_GROUP_ID`, `VITE_TOSS_AD_SLOT_ID`).

## Open Questions

1. **예측 공식 가중치·구간 컷오프**(분발/순항/유력 경계 40·70) 확정 필요 — 도메인 근거가 있는지?
2. **내장 50종 시험 목록·정확한 시험일** 소스 확정 필요(공식 시행 일정 반영 방식).
3. **퀴즈 문제 뱅크** 콘텐츠(자격증별 최소 문항 수) 공급 주체·규모 미정 — 카테고리당 최소 몇 문항 확보?
4. **프로모션(신규 유저 5,000원 지급) 캠페인** 진행 여부 및 `promotionCode` 발급 여부 — 하면 별도 F 추가.
5. **다중 자격증 지원** 시점 — MVP 이후 로드맵에 포함할지.
6. 리워드 광고 **일일 시청 횟수 제한** 정책(하루 1회 vs 무제한) — 수익/UX 균형.