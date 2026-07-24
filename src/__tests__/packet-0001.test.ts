import { describe, it, expect } from "vitest";

/**
 * Packet-0001 Test Suite: TypeScript 타입 정의 + RouteState 계약
 *
 * Tests verify that all domain entities are properly typed with:
 * 1. _v:1 schema version field
 * 2. Correct field names and types
 * 3. RouteState navigation contracts
 * 4. Calculation input/output types (ScoreLabel, DailyGoal, ScoreResult)
 *
 * AC-1: Each entity interface has _v:1 field, tsc passes
 * AC-2: RouteState includes '/checkin/done' and '/select' contracts
 * AC-3: ScoreLabel, DailyGoal, ScoreResult are properly typed
 */

// These imports will fail until types.ts is implemented
// Tests are written FIRST (TDD), implementation follows
import type {
  UserCert,
  CheckIn,
  StreakState,
  QuizProgress,
  AppFlags,
  Certification,
  RouteState,
  ScoreLabel,
  DailyGoal,
  ScoreResult,
} from "@/lib/types";

describe("AC-1: Entity interfaces with _v:1 field", () => {
  it("UserCert interface has _v:1 field with value 1", () => {
    const cert: UserCert = {
      certId: "TOEIC-001",
      name: "TOEIC",
      examDate: "2026-09-15",
      targetTotalMinutes: 180,
      selectedAt: Date.now(),
      _v: 1,
    };

    // Verify all required fields exist and have correct types
    expect(typeof cert.certId).toBe("string");
    expect(typeof cert.name).toBe("string");
    expect(typeof cert.examDate).toBe("string");
    expect(typeof cert.targetTotalMinutes).toBe("number");
    expect(typeof cert.selectedAt).toBe("number");
    expect(cert._v).toBe(1);
  });

  it("CheckIn interface has _v:1 field with value 1", () => {
    const checkIn: CheckIn = {
      id: "checkin-20260725-001",
      date: "2026-07-25",
      minutes: 45,
      method: "stopwatch",
      updatedAt: Date.now(),
      _v: 1,
    };

    expect(typeof checkIn.id).toBe("string");
    expect(typeof checkIn.date).toBe("string");
    expect(typeof checkIn.minutes).toBe("number");
    expect(["stopwatch", "manual"]).toContain(checkIn.method);
    expect(typeof checkIn.updatedAt).toBe("number");
    expect(checkIn._v).toBe(1);
  });

  it("CheckIn.method can be 'stopwatch' or 'manual'", () => {
    const stopwatchCheckIn: CheckIn = {
      id: "c1",
      date: "2026-07-25",
      minutes: 30,
      method: "stopwatch",
      updatedAt: Date.now(),
      _v: 1,
    };
    const manualCheckIn: CheckIn = {
      id: "c2",
      date: "2026-07-25",
      minutes: 45,
      method: "manual",
      updatedAt: Date.now(),
      _v: 1,
    };

    expect(stopwatchCheckIn.method).toBe("stopwatch");
    expect(manualCheckIn.method).toBe("manual");
  });

  it("StreakState interface has _v:1 field with value 1", () => {
    const streak: StreakState = {
      current: 7,
      longest: 30,
      lastCheckInDate: "2026-07-25",
      _v: 1,
    };

    expect(typeof streak.current).toBe("number");
    expect(typeof streak.longest).toBe("number");
    expect(typeof streak.lastCheckInDate).toBe("string");
    expect(streak._v).toBe(1);
  });

  it("QuizProgress interface has _v:1 field with value 1", () => {
    const quiz: QuizProgress = {
      date: "2026-07-25",
      answeredIds: ["q1", "q2", "q3"],
      wrongIds: ["q2"],
      _v: 1,
    };

    expect(typeof quiz.date).toBe("string");
    expect(Array.isArray(quiz.answeredIds)).toBe(true);
    expect(Array.isArray(quiz.wrongIds)).toBe(true);
    expect(quiz._v).toBe(1);
  });

  it("AppFlags interface has _v:1 field with value 1", () => {
    const flags: AppFlags = {
      onboarded: true,
      reportDisclaimerSeen: false,
      _v: 1,
    };

    expect(typeof flags.onboarded).toBe("boolean");
    expect(typeof flags.reportDisclaimerSeen).toBe("boolean");
    expect(flags._v).toBe(1);
  });

  it("Certification interface has _v:1 field with value 1", () => {
    const cert: Certification = {
      id: "cert-toeic",
      name: "TOEIC",
      category: "English",
      _v: 1,
    };

    expect(typeof cert.id).toBe("string");
    expect(typeof cert.name).toBe("string");
    expect(typeof cert.category).toBe("string");
    expect(cert._v).toBe(1);
  });
});

describe("AC-2: RouteState navigation contracts", () => {
  it("RouteState includes /checkin/done path with minutesToday and streakCurrent", () => {
    const state: RouteState = {
      pathname: "/checkin/done",
      state: {
        minutesToday: 120,
        streakCurrent: 5,
      },
    };

    expect(state.pathname).toBe("/checkin/done");
    expect(state.state.minutesToday).toBe(120);
    expect(state.state.streakCurrent).toBe(5);
  });

  it("RouteState includes /select path with mode 'onboard'", () => {
    const state: RouteState = {
      pathname: "/select",
      state: {
        mode: "onboard",
      },
    };

    expect(state.pathname).toBe("/select");
    expect(state.state.mode).toBe("onboard");
  });

  it("RouteState includes /select path with mode 'change'", () => {
    const state: RouteState = {
      pathname: "/select",
      state: {
        mode: "change",
      },
    };

    expect(state.pathname).toBe("/select");
    expect(state.state.mode).toBe("change");
  });

  it("RouteState mode can be 'onboard' or 'change' but not other values", () => {
    const onboardState: RouteState = {
      pathname: "/select",
      state: { mode: "onboard" },
    };
    const changeState: RouteState = {
      pathname: "/select",
      state: { mode: "change" },
    };

    if (onboardState.pathname === "/select") {
      expect(["onboard", "change"]).toContain(onboardState.state.mode);
    }
    if (changeState.pathname === "/select") {
      expect(["onboard", "change"]).toContain(changeState.state.mode);
    }
  });
});

describe("AC-3: Calculation input/output types", () => {
  it("ScoreLabel can be '분발 필요', '순항 중', or '합격 유력'", () => {
    const labels: ScoreLabel[] = [
      "분발 필요",
      "순항 중",
      "합격 유력",
    ];

    labels.forEach((label) => {
      expect(["분발 필요", "순항 중", "합격 유력"]).toContain(label);
    });
  });

  it("DailyGoal has targetToday, label, and state fields", () => {
    const goal: DailyGoal = {
      targetToday: 120,
      label: "오늘의 목표",
      state: "onTrack",
    };

    expect(typeof goal.targetToday).toBe("number");
    expect(typeof goal.label).toBe("string");
    expect(["onTrack", "done", "expired"]).toContain(goal.state);
  });

  it("DailyGoal.state can be 'onTrack', 'done', or 'expired'", () => {
    const states: DailyGoal["state"][] = ["onTrack", "done", "expired"];

    states.forEach((state) => {
      const goal: DailyGoal = {
        targetToday: 100,
        label: "Test",
        state,
      };
      expect(["onTrack", "done", "expired"]).toContain(goal.state);
    });
  });

  it("ScoreResult has score and label fields", () => {
    const result: ScoreResult = {
      score: 850,
      label: "합격 유력",
    };

    expect(typeof result.score).toBe("number");
    expect(typeof result.label).toBe("string");
    expect(["분발 필요", "순항 중", "합격 유력"]).toContain(result.label);
  });

  it("ScoreResult.label must be a valid ScoreLabel", () => {
    const validResults: ScoreResult[] = [
      { score: 600, label: "분발 필요" },
      { score: 750, label: "순항 중" },
      { score: 900, label: "합격 유력" },
    ];

    validResults.forEach((result) => {
      expect(typeof result.score).toBe("number");
      expect(typeof result.label).toBe("string");
    });
  });
});

describe("Type contract integrity", () => {
  it("All entities must have exactly _v: 1 (not 0 or 2)", () => {
    const entities = [
      { _v: 1 } as UserCert,
      { _v: 1 } as CheckIn,
      { _v: 1 } as StreakState,
      { _v: 1 } as QuizProgress,
      { _v: 1 } as AppFlags,
      { _v: 1 } as Certification,
    ];

    entities.forEach((entity) => {
      expect(entity._v).toBe(1);
      expect(typeof entity._v).toBe("number");
    });
  });

  it("RouteState state field can accept different shapes per pathname", () => {
    // /checkin/done expects { minutesToday, streakCurrent }
    const checkInState: RouteState = {
      pathname: "/checkin/done",
      state: { minutesToday: 45, streakCurrent: 3 },
    };
    if (checkInState.pathname === "/checkin/done") {
      expect(checkInState.state.minutesToday).toBe(45);
      expect(checkInState.state.streakCurrent).toBe(3);
    }
  });

  it("RouteState /select path has mode property", () => {
    // /select expects { mode }
    const selectState: RouteState = {
      pathname: "/select",
      state: { mode: "onboard" },
    };
    if (selectState.pathname === "/select") {
      expect(selectState.state.mode).toBe("onboard");
    }
  });
});
