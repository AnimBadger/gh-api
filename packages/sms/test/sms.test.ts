import { test, expect } from "@playwright/test";
import { Sms } from "../src/sms.js";
import { GhApiClient } from "@gh-api/core";

test.describe("Sms", () => {
  test("exposes send, list, get methods", () => {
    const client = new GhApiClient({ apiKey: "test" });
    const sms = new Sms(client);

    expect(typeof sms.send).toBe("function");
    expect(typeof sms.list).toBe("function");
    expect(typeof sms.get).toBe("function");
  });
});
