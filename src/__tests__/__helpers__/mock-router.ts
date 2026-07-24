/**
 * Router mock — kept in its own module on purpose.
 *
 * `vi.mock()` is hoisted to the top of whichever FILE it's written in,
 * regardless of whether it's nested inside a function. Previously this call
 * lived inside a `mockRouter()` function in mocks.ts — but since mocks.ts also
 * exports mockTds/mockAppsInToss, merely importing THOSE (without ever calling
 * mockRouter()) silently hoisted and activated this mock for every consumer of
 * mocks.ts, pinning useLocation()/useNavigate() everywhere. Splitting it into
 * its own file means the mock only activates for test files that explicitly
 * import from here.
 *
 * Usage: import { mockRouter, mockNavigate, mockLocation } from "@/__tests__/__helpers__/mock-router";
 * mockRouter();
 */
import { vi } from "vitest";

export const mockNavigate = vi.fn();
export const mockLocation = { pathname: "/", search: "", state: null, key: "default" };

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// No-op marker call to keep the `mockRouter()` call-site convention from
// testing.md — the mock above is already active once this module is imported.
export function mockRouter() {}
