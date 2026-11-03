// Vitest setup: maps the @ import alias and runs test files one at a time against the shared database.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "postgres://formula:formula@localhost:55432/formula_test",
      SESSION_SECRET: "test-secret-that-is-long-enough-for-hs256-signing",
    },
  },
});
