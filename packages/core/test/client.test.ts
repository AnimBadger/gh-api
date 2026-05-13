import { test, expect } from "@playwright/test";
import { GhApiClient } from "../src/client.js";

test.describe("GhApiClient", () => {
  test("creates a client with an API key", () => {
    const client = new GhApiClient({ apiKey: "test-key" });
    expect(client).toBeInstanceOf(GhApiClient);
  });

  test("throws on missing API key", () => {
    // @ts-expect-error testing invalid config
    expect(() => new GhApiClient({})).toThrow();
  });
});
