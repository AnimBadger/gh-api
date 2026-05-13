import { defineConfig } from "@playwright/test";

export default defineConfig({
  testMatch: "**/test/**/*.test.ts",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  retries: 0,
  workers: 4,
  reporter: "list",
  use: {
    headless: true,
  },
});
