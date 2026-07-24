/**
 * TDD RED phase — packet 0015
 * 온보딩 가드 · 광고 배치 · 검수 가드 폴리시
 *
 * Files this packet creates (not yet implemented):
 * - src/lib/guard.tsx        → shouldRedirectToSelect() pure decision fn + <OnboardingGuard> wrapper
 * - src/components/AdPlacement.tsx → non-overlapping AdSlot section wrapper
 *
 * AC-1: onboarded=false 또는 UserCert 없으면 /select로 유도(mode:'change'는 예외)
 * AC-2: 배너 AdSlot이 홈/리포트 결과 뒤 섹션에 겹침 없이 배치
 * AC-3: 프로덕션 빌드 console.error 0개 · window.open/외부 URL 이동 0개 · HEX 하드코딩 0개
 */
import { describe, it, expect } from "vitest";
import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach } from "vitest";
import { mockTds, mockAppsInToss, mockTossRewardAd } from "@/__tests__/__helpers__/mocks";
import { mockNavigate, mockLocation, mockRouter } from "@/__tests__/__helpers__/mock-router";
import { seedLocalStorage } from "@/__tests__/__helpers__/test-utils";

// TDS + SDK + reward-ad-gate mocked. react-router-dom's useNavigate/useLocation are
// pinned to the shared mockNavigate/mockLocation so guard redirects are observable.
mockTds();
mockAppsInToss();
mockTossRewardAd();
mockRouter();

import { AppDataProvider } from "@/lib/store";
import { shouldRedirectToSelect, OnboardingGuard } from "@/lib/guard";
import { AdPlacement } from "@/components/AdPlacement";
import Home from "@/pages/Home";
import Report from "@/pages/Report";

afterEach(() => {
  cleanup();
  mockLocation.pathname = "/";
  mockLocation.state = null;
});

function renderWithProvider(ui: React.ReactElement) {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(AppDataProvider, null, ui)),
  );
}

describe("온보딩 가드 · 광고 배치 · 검수 가드 폴리시", () => {
  describe("AC-1[P0]: 온보딩 가드 — flags.onboarded=false 또는 UserCert 없으면 /select 유도", () => {
    it("shouldRedirectToSelect: onboarded=false·userCert 없음이면 true, 온보딩 완료+userCert 있으면 false", () => {
      expect(
        shouldRedirectToSelect({ pathname: "/checkin", onboarded: false, hasUserCert: false }),
      ).toBe(true);
      expect(
        shouldRedirectToSelect({ pathname: "/checkin", onboarded: true, hasUserCert: true }),
      ).toBe(false);
    });

    it("shouldRedirectToSelect: '/select' 자체와 mode:'change'는 리다이렉트 예외", () => {
      expect(
        shouldRedirectToSelect({ pathname: "/select", onboarded: false, hasUserCert: false }),
      ).toBe(false);
      expect(
        shouldRedirectToSelect({
          pathname: "/",
          onboarded: false,
          hasUserCert: false,
          mode: "change",
        }),
      ).toBe(false);
    });

    it("OnboardingGuard: 미온보딩 상태에서 보호된 화면 진입 시 /select로 리다이렉트되고 children이 렌더되지 않는다", () => {
      seedLocalStorage({
        "certtimer.flags": { onboarded: false, reportDisclaimerSeen: false, _v: 1 },
      });
      mockLocation.pathname = "/checkin";
      mockLocation.state = null;

      renderWithProvider(
        React.createElement(
          OnboardingGuard,
          null,
          React.createElement("div", { "data-testid": "protected" }, "secret"),
        ),
      );

      expect(mockNavigate).toHaveBeenCalledWith("/select", {
        state: { mode: "onboard" },
        replace: true,
      });
      expect(screen.queryByTestId("protected")).toBeNull();
    });

    it("OnboardingGuard: 온보딩 완료(userCert 존재) 상태에서는 리다이렉트 없이 children을 그대로 렌더한다", () => {
      seedLocalStorage({
        "certtimer.flags": { onboarded: true, reportDisclaimerSeen: true, _v: 1 },
        "certtimer.userCert": {
          certId: "cert_sqld",
          name: "SQLD",
          examDate: "2027-01-01",
          targetTotalMinutes: 3000,
          selectedAt: 1750000000000,
          _v: 1,
        },
      });
      mockLocation.pathname = "/checkin";
      mockLocation.state = null;

      renderWithProvider(
        React.createElement(
          OnboardingGuard,
          null,
          React.createElement("div", { "data-testid": "protected" }, "secret"),
        ),
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByTestId("protected").textContent).toBe("secret");
    });
  });

  describe("AC-2[P0]: 배너 AdSlot이 홈/리포트 결과 뒤 섹션에 겹침 없이 배치", () => {
    it("AdPlacement: 주어진 adGroupId로 AdSlot을 별도 비침투 섹션 안에 렌더한다", () => {
      render(React.createElement(AdPlacement, { adGroupId: "unit-test-banner", testId: "unit-ad" }));

      const section = screen.getByTestId("unit-ad");
      const adNode = section.querySelector("[data-ad-group-id]");
      expect(adNode).not.toBeNull();
      expect(adNode?.getAttribute("data-ad-group-id")).toBe("unit-test-banner");
    });

    it("Home: 대시보드 결과 카드들 뒤(하단)에 광고 섹션이 배치되고 카드 내부에 중첩되지 않는다", () => {
      seedLocalStorage({
        "certtimer.flags": { onboarded: true, reportDisclaimerSeen: true, _v: 1 },
        "certtimer.userCert": {
          certId: "cert_sqld",
          name: "SQLD",
          examDate: "2027-01-01",
          targetTotalMinutes: 3000,
          selectedAt: 1750000000000,
          _v: 1,
        },
        "certtimer.checkins": [
          { id: "checkin_1", date: "2026-07-20", minutes: 60, method: "manual", updatedAt: 1750000000000, _v: 1 },
        ],
      });
      mockLocation.pathname = "/";
      mockLocation.state = null;

      renderWithProvider(React.createElement(Home));

      const adSection = screen.getByTestId("home-ad-placement");
      const goalCard = screen.getByTestId("today-goal-card");
      // 광고가 마지막 결과 카드 내부에 중첩되지 않았다는 증거
      expect(goalCard.contains(adSection)).toBe(false);
      // 광고 섹션이 마지막 결과 카드보다 문서상 뒤에 위치(결과 뒤 배치)
      expect(
        !!(goalCard.compareDocumentPosition(adSection) & Node.DOCUMENT_POSITION_FOLLOWING),
      ).toBe(true);
    });

    it("Report: 리포트 결과 콘텐츠 뒤에 광고 섹션이 배치되고 조언 카드 내부에 중첩되지 않는다", () => {
      seedLocalStorage({
        "certtimer.flags": { onboarded: true, reportDisclaimerSeen: true, _v: 1 },
        "certtimer.userCert": {
          certId: "cert_sqld",
          name: "SQLD",
          examDate: "2027-01-01",
          targetTotalMinutes: 3000,
          selectedAt: 1750000000000,
          _v: 1,
        },
        "certtimer.checkins": [
          { id: "checkin_1", date: "2026-07-20", minutes: 90, method: "manual", updatedAt: 1750000000000, _v: 1 },
        ],
      });
      mockLocation.pathname = "/report";
      mockLocation.state = null;

      renderWithProvider(React.createElement(Report));

      const adSection = screen.getByTestId("report-ad-placement");
      const adviceCard = screen.getByTestId("advice-card");
      expect(adviceCard.contains(adSection)).toBe(false);
      expect(
        !!(adviceCard.compareDocumentPosition(adSection) & Node.DOCUMENT_POSITION_FOLLOWING),
      ).toBe(true);
    });
  });

  describe("AC-3[P0]: 검수 가드 — console.error 0 · 외부 이탈 0 · HEX 하드코딩 0", () => {
    it("src 전체 소스에 console.error 호출, window.open/location.href 외부 이탈, HEX 리터럴이 없다", () => {
      const srcDir = path.resolve(__dirname, "..");
      const files: string[] = [];

      function walk(dir: string) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (entry.name === "__tests__") continue;
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(full);
          } else if (/\.(ts|tsx)$/.test(entry.name)) {
            files.push(full);
          }
        }
      }
      walk(srcDir);

      const consoleErrorHits: string[] = [];
      const outlinkHits: string[] = [];
      const hexHits: string[] = [];

      for (const file of files) {
        const src = fs.readFileSync(file, "utf-8");
        if (/console\.error/.test(src)) consoleErrorHits.push(file);
        if (/window\.location\.href\s*=|window\.open\(/.test(src)) outlinkHits.push(file);
        if (/#[0-9a-fA-F]{3,8}\b/.test(src)) hexHits.push(file);
      }

      expect(consoleErrorHits, `console.error found in: ${consoleErrorHits.join(", ")}`).toEqual([]);
      expect(outlinkHits, `external navigation found in: ${outlinkHits.join(", ")}`).toEqual([]);
      expect(hexHits, `hardcoded HEX found in: ${hexHits.join(", ")}`).toEqual([]);
    });
  });
});
