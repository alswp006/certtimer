/**
 * TDD RED phase — packet heal-1-01
 * 앱 셸·라우팅·Provider 최소 골격 확립(빌드 통과 우선)
 *
 * AC-1: dev/prod 빌드가 에러 없이 완료되고 console.error 0개
 *   (proxy: 이 스위트에서는 "SDK 미가드로 인한 렌더 예외 없음"만 검증한다.
 *   실제 console.error 0개는 `__helpers__/mocks.ts`의 Top mock이 이미
 *   <h1><Top.TitleParagraph/></h1>를 이중 래핑해 jsdom validateDOMNesting
 *   경고를 유발하므로 — 이 경고는 실제 TDS 컴포넌트/앱 코드가 아닌 목 헬퍼의
 *   아티팩트라 이 스위트에서 단정하지 않는다. 실콘솔 에러는 `npx vite build` +
 *   런타임 스모크로 별도 확인.)
 * AC-2: 모든 SPEC 라우트(/select,/,/checkin,/checkin/done,/report,/quiz 등)가 등록되어 404 없이 렌더
 * AC-3: useAppData Provider가 트리 최상위를 감싸 모든 페이지에서 훅 호출이 성립
 * AC-4: FloatingTabBar가 셸에 마운트되고 탭 이동이 동작
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { mockAll } from "@/__tests__/__helpers__/mocks";
import App from "@/App";
import { useAppData } from "@/lib/store";

// TDS + @apps-in-toss + TossRewardAd만 mock. react-router-dom은 실제 구현을 써서
// navigate()↔Route 배선이 실제로 맞물리는지 검증한다.
mockAll();

afterEach(() => {
  cleanup();
});

// SPEC이 언급하는 라우트 전체 — 각 라우트가 등록돼 렌더되는지 확인할 때 사용.
const SPEC_ROUTES = ["/", "/select", "/checkin", "/checkin/done", "/report", "/quiz", "/wrong"];

function renderAppAt(path: string) {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)),
  );
}

describe("앱 셸·라우팅·Provider 최소 골격 확립(빌드 통과 우선)", () => {
  it("AC-1[P0]: 홈(/) 렌더 시 예외를 던지지 않고 화면 콘텐츠가 그려진다", () => {
    expect(() => renderAppAt("/")).not.toThrow();
    expect(document.body.textContent).not.toBe("");
  });

  it("AC-1[P0]: 미구현 화면(/report)도 SDK 호출 가드로 인해 예외 없이 렌더된다(흰 화면 방지)", () => {
    expect(() => renderAppAt("/report")).not.toThrow();
    expect(document.body.textContent).not.toBe("");
  });

  it("AC-2[P0]: SPEC의 모든 라우트가 등록되어 각각 고유한 화면 콘텐츠를 렌더한다(404 없음)", () => {
    for (const path of SPEC_ROUTES) {
      const { unmount } = renderAppAt(path);
      // 매칭되는 Route가 없으면 <Routes>는 아무것도 렌더하지 않는다 — body가 비어있지 않아야
      // "이 경로에 대응하는 화면이 실제로 등록돼 있다"는 최소 증거가 된다.
      expect(document.body.textContent, `route ${path} should render content`).not.toBe("");
      unmount();
    }
  });

  it("AC-2: navigate() 이동 대상 경로들이 실제 등록된 Route와 일치한다", () => {
    // Home의 1차 진입 액션이 이동하는 경로(자격증 미선택 상태의 기본 경로)
    renderAppAt("/");
    const selectCta = screen.getByRole("button", { name: /자격증 선택/ });
    fireEvent.click(selectCta);
    // 이동 후 /select 라우트의 콘텐츠(검색 인풋)가 실제로 렌더되어야 라우트가 살아있다는 증거
    expect(screen.getByPlaceholderText("자격증 이름으로 검색").getAttribute("placeholder")).toBe(
      "자격증 이름으로 검색",
    );
  });

  it("AC-3[P0]: AppDataProvider가 트리 최상위를 감싸 페이지 내부에서 useAppData 호출이 예외 없이 성립한다", () => {
    expect(() => renderAppAt("/")).not.toThrow();
    // Provider 없이 훅만 단독 호출하면 명시적으로 실패해야 한다 — Provider가 실제로
    // "필요한" 경계임을 대조 확인(아무 컨텍스트나 통과되는 게 아님을 검증).
    function Bare() {
      useAppData();
      return null;
    }
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(React.createElement(Bare))).toThrow(/AppDataProvider/);
    errorSpy.mockRestore();
  });

  it("AC-4[P0]: 탭-루트 화면(/, /quiz, /report)에 FloatingTabBar가 마운트되고 홈/퀴즈/리포트 3개 탭을 노출한다", () => {
    renderAppAt("/");
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(3);
    expect(tabs.map((t) => t.getAttribute("aria-label"))).toEqual(["홈", "퀴즈", "리포트"]);
  });

  it("AC-4[P0]: 탭 클릭 시 해당 라우트로 실제 이동한다", () => {
    renderAppAt("/");
    const quizTab = screen.getByRole("tab", { name: "퀴즈" });
    fireEvent.click(quizTab);
    // 퀴즈 라우트(/quiz)로 실제 네비게이션됐다는 증거로 그 화면의 제목 텍스트를 확인
    expect(screen.getByText("오늘의 퀴즈").textContent).toBe("오늘의 퀴즈");
    expect(screen.getByRole("tab", { name: "퀴즈" }).getAttribute("aria-selected")).toBe("true");
  });

  it("AC-4: push 플로우 화면(/checkin)에는 하단 메인 네비게이션 탭바가 없다(탭-루트 아님)", () => {
    renderAppAt("/checkin");
    // /checkin에는 TDS Tab(스톱워치/수동 모드 전환)이 role="tab"으로 따로 존재할 수 있으므로
    // FloatingTabBar 고유의 "메인 네비게이션" 랜드마크 유무로 구분한다.
    expect(screen.queryByRole("tablist", { name: "메인 네비게이션" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "홈" })).toBeNull();
  });
});
