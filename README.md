# CertTimer

앱인토스 (Vite + React + TDS) 자격증 시험 D-day·학습 진도 트래커 — 매일 체크인하면 배너 광고, 합격 예측 리포트는 리워드 광고 후 공개 자격증 준비생은 시험 일정·학습량을 분산된 앱·메모장에 기록하며 동기부여를 유지하기 어려움. 하루 공부량 추적과 남은 일수 가시화 도구가 토스 생태계에 없음

## Tech Stack

- React 18.0.0
- TypeScript
- Vitest

## Routes

| Path | Description |
|------|-------------|
| `/Checkin` | Checkin |
| `/CheckinDone` | CheckinDone |
| `/Home` | Home |
| `/Select` | Select |

## Getting Started

```bash
pnpm install
pnpm dev
```

## Development

```bash
pnpm typecheck    # Type checking
pnpm test         # Run tests
pnpm build        # Production build
```

## Design Documents

See `.ai-factory/` directory for full design artifacts:
- `prd.md` — Product Requirements Document
- `spec.md` — Technical Specification
- `task.md` — Epic/Task Breakdown

---
Built with [AI Factory](https://github.com/alswp006/ai-factory) · Last synced: 2026-07-24
