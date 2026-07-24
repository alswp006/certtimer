import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderHook, act } from "@testing-library/react";

/**
 * Packet-0003 Test Suite: 상태 관리 스토어 (useAppData 훅/컨텍스트)
 *
 * src/lib/store.tsx MUST export:
 *  - AppDataProvider: React context provider component
 *  - useAppData(): {
 *      userCert, checkIns, streak, quiz, flags,       // entities (mirrors of storage)
 *      upsertCheckInToday(minutes, method),            // { ok: boolean }
 *      applyStreak(),                                  // { ok: boolean }
 *      addWrongId(id),                                 // { ok: boolean }
 *      setUserCert(cert),                              // { ok: boolean }
 *      setFlags(partialFlags),                         // { ok: boolean }
 *    }
 *
 * AC-1: useAppData()가 각 엔티티 + mutator 반환, mutator 호출 시 storage 저장 + 리렌더
 * AC-2: 저장 실패 시 {ok:false} 반환으로 Toast 표시 가능 (상태는 롤백 없이 유지)
 * AC-3: setFlags로 reportDisclaimerSeen 단독 갱신 가능
 */

import type { UserCert } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
function loadStore() {
  return require("@/lib/store");
}

function wrapper({ children }: { children: React.ReactNode }) {
  const { AppDataProvider } = loadStore();
  return React.createElement(AppDataProvider, null, children);
}

describe("AC-1[P0]: useAppData entities + mutators, storage 저장 + 리렌더", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AC-1: useAppData() returns default entities and mutator functions on empty storage", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    expect(result.current.userCert).toBeNull();
    expect(result.current.checkIns).toEqual([]);
    expect(result.current.streak).toEqual({
      current: 0,
      longest: 0,
      lastCheckInDate: "",
      _v: 1,
    });
    expect(result.current.flags).toEqual({
      onboarded: false,
      reportDisclaimerSeen: false,
      _v: 1,
    });
    expect(typeof result.current.upsertCheckInToday).toBe("function");
    expect(typeof result.current.applyStreak).toBe("function");
    expect(typeof result.current.addWrongId).toBe("function");
    expect(typeof result.current.setUserCert).toBe("function");
    expect(typeof result.current.setFlags).toBe("function");
  });

  it("AC-1[P0]: upsertCheckInToday persists to storage and re-renders with accumulated minutes for the same day", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    act(() => {
      const res = result.current.upsertCheckInToday(30, "manual");
      expect(res.ok).toBe(true);
    });

    expect(result.current.checkIns.length).toBe(1);
    expect(result.current.checkIns[0].minutes).toBe(30);
    expect(result.current.checkIns[0].method).toBe("manual");

    act(() => {
      result.current.upsertCheckInToday(20, "manual");
    });

    // same day → upserted into the SAME entry, not appended as a new one
    expect(result.current.checkIns.length).toBe(1);
    expect(result.current.checkIns[0].minutes).toBe(50);

    const stored = JSON.parse(localStorage.getItem("certtimer.checkins")!);
    expect(stored.length).toBe(1);
    expect(stored[0].minutes).toBe(50);
  });

  it("AC-1[P0]: setUserCert updates state and persists to certtimer.userCert", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    const cert: UserCert = {
      certId: "cert_sqld",
      name: "SQLD",
      examDate: "2026-09-05",
      targetTotalMinutes: 6000,
      selectedAt: 1721901000000,
      _v: 1,
    };

    act(() => {
      const res = result.current.setUserCert(cert);
      expect(res.ok).toBe(true);
    });

    expect(result.current.userCert).toEqual(cert);
    expect(JSON.parse(localStorage.getItem("certtimer.userCert")!)).toEqual(cert);
  });

  it("AC-1: applyStreak increments current on first check-in and does not double-increment same day", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    act(() => {
      const res = result.current.applyStreak();
      expect(res.ok).toBe(true);
    });

    expect(result.current.streak.current).toBe(1);
    expect(result.current.streak.longest).toBe(1);
    expect(result.current.streak.lastCheckInDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    act(() => {
      result.current.applyStreak();
    });

    // same day again → no double increment
    expect(result.current.streak.current).toBe(1);
  });

  it("AC-1: addWrongId creates today's quiz progress and appends wrong ids without duplicating date entries", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    expect(result.current.quiz).toBeNull();

    act(() => {
      const res = result.current.addWrongId("q1");
      expect(res.ok).toBe(true);
    });

    expect(result.current.quiz?.wrongIds).toEqual(["q1"]);

    act(() => {
      result.current.addWrongId("q2");
    });

    expect(result.current.quiz?.wrongIds).toEqual(["q1", "q2"]);
    const stored = JSON.parse(localStorage.getItem("certtimer.quiz")!);
    expect(stored.wrongIds).toEqual(["q1", "q2"]);
  });
});

describe("AC-2[P0]: 저장 실패 시 {ok:false} 반환, 상태는 롤백 없이 유지", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AC-2: setUserCert returns { ok:false } when localStorage.setItem throws, but in-memory state still updates (no rollback)", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const error = new Error("QuotaExceededError");
      error.name = "QuotaExceededError";
      throw error;
    });

    const cert: UserCert = {
      certId: "cert_fail",
      name: "실패 테스트",
      examDate: "2026-12-31",
      targetTotalMinutes: 100,
      selectedAt: 1000,
      _v: 1,
    };

    act(() => {
      const res = result.current.setUserCert(cert);
      expect(res.ok).toBe(false);
    });

    // state is not rolled back — UI shows the attempted value even though persistence failed
    expect(result.current.userCert).toEqual(cert);

    Storage.prototype.setItem = originalSetItem;
  });

  it("AC-2: upsertCheckInToday returns { ok:false } on save failure (Toast-able signal)", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    const originalSetItem = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      const error = new Error("QuotaExceededError");
      error.name = "QuotaExceededError";
      throw error;
    });

    act(() => {
      const res = result.current.upsertCheckInToday(15, "stopwatch");
      expect(res.ok).toBe(false);
    });

    Storage.prototype.setItem = originalSetItem;
  });
});

describe("AC-3[P0]: setFlags로 reportDisclaimerSeen 단독 갱신", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("AC-3: setFlags({ reportDisclaimerSeen: true }) updates only that field, leaving onboarded untouched", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    expect(result.current.flags.onboarded).toBe(false);
    expect(result.current.flags.reportDisclaimerSeen).toBe(false);

    act(() => {
      const res = result.current.setFlags({ reportDisclaimerSeen: true });
      expect(res.ok).toBe(true);
    });

    expect(result.current.flags.reportDisclaimerSeen).toBe(true);
    expect(result.current.flags.onboarded).toBe(false);

    const stored = JSON.parse(localStorage.getItem("certtimer.flags")!);
    expect(stored.reportDisclaimerSeen).toBe(true);
    expect(stored.onboarded).toBe(false);
  });

  it("AC-3: setFlags({ onboarded: true }) after reportDisclaimerSeen was set preserves the earlier field (merge, not overwrite)", () => {
    const { useAppData } = loadStore();
    const { result } = renderHook(() => useAppData(), { wrapper });

    act(() => {
      result.current.setFlags({ reportDisclaimerSeen: true });
    });
    act(() => {
      result.current.setFlags({ onboarded: true });
    });

    expect(result.current.flags).toEqual({
      onboarded: true,
      reportDisclaimerSeen: true,
      _v: 1,
    });
  });
});
