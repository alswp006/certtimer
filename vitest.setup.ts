/**
 * Vitest setup — runs before each test file.
 *
 * Handles:
 *  - localStorage isolation between tests (prevents cross-test pollution)
 *  - requestAnimationFrame shim for jsdom (needed for animate/countup utilities)
 *  - sessionStorage isolation
 *  - console.error filtering (React Router warnings etc.)
 */

import { beforeEach, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── "@/" alias support for CJS require() in test files ──
// Vite's `resolve.alias` only applies to `import`/dynamic `import()`. Some tests use
// `require("@/lib/...")`, which goes through Node's native CJS resolver and knows
// nothing about the alias or extensionless .ts resolution. Teach it here, once,
// for the whole test process.
const srcRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "src");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const originalResolveFilename = (Module as any)._resolveFilename;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Module as any)._resolveFilename = function (request: string, ...rest: any[]) {
  if (request.startsWith("@/")) {
    const base = path.join(srcRoot, request.slice(2));
    for (const candidate of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
      try {
        return originalResolveFilename.call(this, candidate, ...rest);
      } catch {
        // try next candidate
      }
    }
  }
  return originalResolveFilename.call(this, request, ...rest);
};

// ── localStorage / sessionStorage isolation ──
// jsdom's storage persists between tests by default. Clear it to prevent pollution.
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

// ── requestAnimationFrame shim for jsdom ──
// jsdom does NOT implement rAF natively, so animate/countup code hangs forever.
// Shim that immediately invokes callback with a monotonic timestamp.
if (typeof globalThis.requestAnimationFrame !== "function") {
  let now = 0;
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
    now += 16;
    return setTimeout(() => cb(now), 0) as unknown as number;
  }) as typeof globalThis.requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as typeof globalThis.cancelAnimationFrame;
}

// ── afterEach reset ──
afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers(); // in case a test used fake timers
});
