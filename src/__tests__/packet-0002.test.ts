import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Packet-0002 Test Suite: localStorage 저장소 헬퍼 (CRUD + 안전 처리)
 *
 * Tests verify that all storage helpers:
 * 1. Use certtimer.* namespace keys for isolation
 * 2. Tag payloads with _v:1 for versioning
 * 3. Handle corrupted JSON gracefully (no exceptions, return defaults)
 * 4. Handle QuotaExceededError (return false for save operations)
 * 5. Provide sensible defaults for empty states
 *
 * AC-1: saveUserCert/getUserCert roundtrip with deep-equal, key is 'certtimer.userCert'
 * AC-2: corrupted JSON in localStorage returns defaults without exception/console.error
 * AC-3: QuotaExceededError → saveCheckIns()===false, getStreak()===empty, getFlags()===empty
 */

import type { UserCert, CheckIn, StreakState, QuizProgress, AppFlags } from "@/lib/types";

describe("AC-1[P0]: saveUserCert/getUserCert roundtrip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AC-1: saveUserCert and getUserCert roundtrip with deep equality", () => {
    // NOTE: These imports will fail until src/lib/storage.ts is implemented
    // For now, this test demonstrates the expected API contract
    const { saveUserCert, getUserCert } = require("@/lib/storage");

    const testCert: UserCert = {
      certId: "TOEIC-001",
      name: "TOEIC",
      examDate: "2026-09-15",
      targetTotalMinutes: 180,
      selectedAt: 1721901000000,
      _v: 1,
    };

    // Save
    saveUserCert(testCert);

    // Retrieve
    const retrieved = getUserCert();

    // Deep equality check
    expect(retrieved).toEqual(testCert);
    expect(retrieved?.certId).toBe(testCert.certId);
    expect(retrieved?.name).toBe(testCert.name);
    expect(retrieved?.examDate).toBe(testCert.examDate);
    expect(retrieved?.targetTotalMinutes).toBe(testCert.targetTotalMinutes);
    expect(retrieved?._v).toBe(1);
  });

  it("AC-1: localStorage key must be exactly 'certtimer.userCert'", () => {
    const { saveUserCert } = require("@/lib/storage");

    const testCert: UserCert = {
      certId: "TOEIC-002",
      name: "TOEIC Advanced",
      examDate: "2026-10-20",
      targetTotalMinutes: 240,
      selectedAt: 1721901000000,
      _v: 1,
    };

    saveUserCert(testCert);

    // Verify exact key
    const stored = localStorage.getItem("certtimer.userCert");
    expect(stored).not.toBeNull();
    expect(typeof stored).toBe("string");

    // Verify it's parseable and has _v:1
    const parsed = JSON.parse(stored!);
    expect(parsed._v).toBe(1);
  });
});

describe("AC-2[P0]: corrupted/malformed JSON handling", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AC-2: getCheckIns() returns empty array [] when localStorage contains broken JSON", () => {
    const { getCheckIns } = require("@/lib/storage");

    // Simulate corrupted data
    localStorage.setItem("certtimer.checkins", "{broken");

    const result = getCheckIns();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it("AC-2: no exception thrown when parsing corrupted JSON", () => {
    const { getCheckIns } = require("@/lib/storage");

    localStorage.setItem("certtimer.checkins", "{not:valid json}");

    // Should not throw
    expect(() => {
      getCheckIns();
    }).not.toThrow();
  });

  it("AC-2: no console.error when handling corrupted data", () => {
    const { getCheckIns } = require("@/lib/storage");

    const consoleErrorSpy = vi.spyOn(console, "error");

    localStorage.setItem("certtimer.checkins", "{broken json");
    getCheckIns();

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("AC-2: getUserCert() returns null on corrupted data", () => {
    const { getUserCert } = require("@/lib/storage");

    localStorage.setItem("certtimer.userCert", "not-json-at-all");

    const result = getUserCert();

    expect(result).toBeNull();
  });

  it("AC-2: getStreak() returns default empty state on corrupted data", () => {
    const { getStreak } = require("@/lib/storage");

    localStorage.setItem("certtimer.streak", "{incomplete:");

    const result = getStreak();

    expect(result).toEqual({
      current: 0,
      longest: 0,
      lastCheckInDate: "",
      _v: 1,
    });
  });
});

describe("AC-3[P0]: QuotaExceededError and default states", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AC-3: saveCheckIns() returns false when localStorage.setItem throws QuotaExceededError", () => {
    const { saveCheckIns } = require("@/lib/storage");

    // Mock localStorage.setItem to throw QuotaExceededError
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const error = new Error("QuotaExceededError");
      error.name = "QuotaExceededError";
      throw error;
    });

    const testCheckIns: CheckIn[] = [
      {
        id: "c1",
        date: "2026-07-25",
        minutes: 60,
        method: "stopwatch",
        updatedAt: 1721901000000,
        _v: 1,
      },
    ];

    const result = saveCheckIns(testCheckIns);

    expect(result).toBe(false);

    Storage.prototype.setItem = originalSetItem;
  });

  it("AC-3: getStreak() returns default empty state { current: 0, longest: 0, lastCheckInDate: '' }", () => {
    const { getStreak } = require("@/lib/storage");

    // No data in localStorage
    localStorage.clear();

    const result = getStreak();

    expect(result).toEqual({
      current: 0,
      longest: 0,
      lastCheckInDate: "",
      _v: 1,
    });
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.lastCheckInDate).toBe("");
    expect(result._v).toBe(1);
  });

  it("AC-3: getFlags() returns default empty state { onboarded: false, reportDisclaimerSeen: false }", () => {
    const { getFlags } = require("@/lib/storage");

    // No data in localStorage
    localStorage.clear();

    const result = getFlags();

    expect(result).toEqual({
      onboarded: false,
      reportDisclaimerSeen: false,
      _v: 1,
    });
    expect(result.onboarded).toBe(false);
    expect(result.reportDisclaimerSeen).toBe(false);
    expect(result._v).toBe(1);
  });

  it("AC-3: all save functions return false on QuotaExceededError", () => {
    const { saveUserCert, saveCheckIns, saveStreak, saveQuizProgress, saveFlags } =
      require("@/lib/storage");

    // Mock localStorage.setItem to throw QuotaExceededError
    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const error = new Error("QuotaExceededError");
      error.name = "QuotaExceededError";
      throw error;
    });

    const testCert: UserCert = {
      certId: "TEST",
      name: "Test",
      examDate: "2026-12-31",
      targetTotalMinutes: 100,
      selectedAt: Date.now(),
      _v: 1,
    };

    const testCheckIns: CheckIn[] = [];
    const testStreak: StreakState = { current: 0, longest: 0, lastCheckInDate: "", _v: 1 };
    const testQuiz: QuizProgress = { date: "2026-07-25", answeredIds: [], wrongIds: [], _v: 1 };
    const testFlags: AppFlags = { onboarded: false, reportDisclaimerSeen: false, _v: 1 };

    expect(saveUserCert(testCert)).toBe(false);
    expect(saveCheckIns(testCheckIns)).toBe(false);
    expect(saveStreak(testStreak)).toBe(false);
    expect(saveQuizProgress(testQuiz)).toBe(false);
    expect(saveFlags(testFlags)).toBe(false);

    Storage.prototype.setItem = originalSetItem;
  });
});

describe("Complete CRUD workflow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("complete workflow: save, retrieve, update for UserCert", () => {
    const { saveUserCert, getUserCert } = require("@/lib/storage");

    const cert1: UserCert = {
      certId: "CERT-001",
      name: "First Cert",
      examDate: "2026-08-01",
      targetTotalMinutes: 100,
      selectedAt: 1000,
      _v: 1,
    };

    // Save first cert
    saveUserCert(cert1);
    expect(getUserCert()).toEqual(cert1);

    // Update to new cert
    const cert2: UserCert = {
      certId: "CERT-002",
      name: "Second Cert",
      examDate: "2026-09-01",
      targetTotalMinutes: 200,
      selectedAt: 2000,
      _v: 1,
    };

    saveUserCert(cert2);
    expect(getUserCert()).toEqual(cert2);
    expect(getUserCert()?.certId).toBe("CERT-002");
  });

  it("complete workflow: save multiple CheckIns, retrieve as array", () => {
    const { saveCheckIns, getCheckIns } = require("@/lib/storage");

    const checkIns: CheckIn[] = [
      {
        id: "c1",
        date: "2026-07-24",
        minutes: 45,
        method: "stopwatch",
        updatedAt: 1721814600000,
        _v: 1,
      },
      {
        id: "c2",
        date: "2026-07-25",
        minutes: 60,
        method: "manual",
        updatedAt: 1721901000000,
        _v: 1,
      },
      {
        id: "c3",
        date: "2026-07-26",
        minutes: 30,
        method: "stopwatch",
        updatedAt: 1721987400000,
        _v: 1,
      },
    ];

    const saved = saveCheckIns(checkIns);
    expect(saved).toBe(true);

    const retrieved = getCheckIns();
    expect(retrieved.length).toBe(3);
    expect(retrieved[0].id).toBe("c1");
    expect(retrieved[1].id).toBe("c2");
    expect(retrieved[2].id).toBe("c3");
    expect(retrieved).toEqual(checkIns);
  });

  it("complete workflow: save and retrieve StreakState", () => {
    const { saveStreak, getStreak } = require("@/lib/storage");

    const streak: StreakState = {
      current: 7,
      longest: 15,
      lastCheckInDate: "2026-07-25",
      _v: 1,
    };

    const saved = saveStreak(streak);
    expect(saved).toBe(true);

    const retrieved = getStreak();
    expect(retrieved).toEqual(streak);
    expect(retrieved.current).toBe(7);
    expect(retrieved.longest).toBe(15);
  });

  it("complete workflow: save and retrieve QuizProgress", () => {
    const { saveQuizProgress, getQuizProgress } = require("@/lib/storage");

    const quiz: QuizProgress = {
      date: "2026-07-25",
      answeredIds: ["q1", "q2", "q3", "q4", "q5"],
      wrongIds: ["q2", "q4"],
      _v: 1,
    };

    const saved = saveQuizProgress(quiz);
    expect(saved).toBe(true);

    const retrieved = getQuizProgress();
    expect(retrieved).toEqual(quiz);
    expect(retrieved?.answeredIds.length).toBe(5);
    expect(retrieved?.wrongIds.length).toBe(2);
  });

  it("complete workflow: save and retrieve AppFlags", () => {
    const { saveFlags, getFlags } = require("@/lib/storage");

    const flags: AppFlags = {
      onboarded: true,
      reportDisclaimerSeen: true,
      _v: 1,
    };

    const saved = saveFlags(flags);
    expect(saved).toBe(true);

    const retrieved = getFlags();
    expect(retrieved).toEqual(flags);
    expect(retrieved.onboarded).toBe(true);
    expect(retrieved.reportDisclaimerSeen).toBe(true);
  });
});

describe("Version compatibility and schema", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("all saved entities include _v: 1 field", () => {
    const { saveUserCert, getUserCert, saveCheckIns, getCheckIns, saveStreak, getStreak } =
      require("@/lib/storage");

    const cert: UserCert = {
      certId: "TEST",
      name: "Test",
      examDate: "2026-12-31",
      targetTotalMinutes: 100,
      selectedAt: Date.now(),
      _v: 1,
    };

    saveUserCert(cert);
    expect(getUserCert()?._v).toBe(1);

    const checkIns: CheckIn[] = [
      {
        id: "c1",
        date: "2026-07-25",
        minutes: 60,
        method: "stopwatch",
        updatedAt: Date.now(),
        _v: 1,
      },
    ];

    saveCheckIns(checkIns);
    expect(getCheckIns()[0]?._v).toBe(1);

    const streak: StreakState = { current: 5, longest: 10, lastCheckInDate: "2026-07-25", _v: 1 };
    saveStreak(streak);
    expect(getStreak()._v).toBe(1);
  });

  it("default states always include _v: 1", () => {
    const { getStreak, getFlags, getCheckIns } = require("@/lib/storage");

    localStorage.clear();

    expect(getStreak()._v).toBe(1);
    expect(getFlags()._v).toBe(1);
    expect(Array.isArray(getCheckIns())).toBe(true);
  });
});

describe("Edge cases and isolation", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("certtimer namespace keys are isolated from other localStorage entries", () => {
    const { saveUserCert } = require("@/lib/storage");

    // Set unrelated entry
    localStorage.setItem("other.key", "other value");

    const cert: UserCert = {
      certId: "TEST",
      name: "Test",
      examDate: "2026-12-31",
      targetTotalMinutes: 100,
      selectedAt: Date.now(),
      _v: 1,
    };

    saveUserCert(cert);

    // Both should exist independently
    expect(localStorage.getItem("certtimer.userCert")).not.toBeNull();
    expect(localStorage.getItem("other.key")).toBe("other value");
  });

  it("each entity type has distinct storage key", () => {
    const { saveUserCert, saveCheckIns, saveStreak, saveFlags, saveQuizProgress } =
      require("@/lib/storage");

    const cert: UserCert = {
      certId: "TEST",
      name: "Test",
      examDate: "2026-12-31",
      targetTotalMinutes: 100,
      selectedAt: Date.now(),
      _v: 1,
    };

    saveUserCert(cert);
    saveCheckIns([]);
    saveStreak({ current: 0, longest: 0, lastCheckInDate: "", _v: 1 });
    saveFlags({ onboarded: false, reportDisclaimerSeen: false, _v: 1 });
    saveQuizProgress({ date: "2026-07-25", answeredIds: [], wrongIds: [], _v: 1 });

    // All keys should be distinct
    expect(localStorage.getItem("certtimer.userCert")).not.toBeNull();
    expect(localStorage.getItem("certtimer.checkins")).not.toBeNull();
    expect(localStorage.getItem("certtimer.streak")).not.toBeNull();
    expect(localStorage.getItem("certtimer.flags")).not.toBeNull();
    expect(localStorage.getItem("certtimer.quiz")).not.toBeNull();
  });

  it("empty CheckIns array is stored and retrieved as []", () => {
    const { saveCheckIns, getCheckIns } = require("@/lib/storage");

    saveCheckIns([]);
    const result = getCheckIns();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("null/missing UserCert returns null (not default object)", () => {
    const { getUserCert } = require("@/lib/storage");

    localStorage.clear();
    const result = getUserCert();

    expect(result).toBeNull();
    expect(result).not.toEqual({});
  });
});
