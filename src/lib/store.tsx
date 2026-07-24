// Unused placeholder: the real implementation lives in ./store.ts.
// Node's native require() type-stripping (used by src/__tests__/packet-0003.test.ts
// via the "@/" resolver in vitest.setup.ts) does not support the .tsx extension,
// so AppDataProvider/useAppData had to move to store.ts. Both "@/lib/store" imports
// and require() calls resolve store.ts first, so this file is never loaded.
export {};
