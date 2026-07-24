import { describe, it, expect } from "vitest";

// Regression test for the require() "@/" alias resolution hook added to
// vitest.setup.ts (needed because packet-0002.test.ts uses require("@/lib/storage")).
describe("require() alias resolution (vitest.setup.ts hook)", () => {
  it("resolves @/ alias via require()", () => {
    const mod = require("@/lib/storage");
    expect(typeof mod.getUserCert).toBe("function");
  });
});
