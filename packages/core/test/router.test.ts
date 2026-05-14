import { test, expect } from "@playwright/test";
import { SmsRouter } from "../src/router.js";
import { createLogger } from "../src/logger.js";
import type { SmsProvider, SendOtpResult, VerifyOtpResult, SendOtpParams, VerifyOtpParams } from "../src/types.js";

function makeProvider(name: string, succeeds: boolean, throws = false): SmsProvider {
  return {
    name,
    sendOtp: (_params: SendOtpParams): Promise<SendOtpResult> =>
      throws
        ? Promise.reject(new Error("Unexpected error"))
        : Promise.resolve(
            succeeds
              ? { success: true, provider: name, code: "1000" }
              : { success: false, provider: name, error: "declined" },
          ),
    verifyOtp: (_params: VerifyOtpParams): Promise<VerifyOtpResult> =>
      throws
        ? Promise.reject(new Error("Unexpected error"))
        : Promise.resolve(
            succeeds
              ? { success: true, provider: name, code: "1100" }
              : { success: false, provider: name, error: "declined" },
          ),
  };
}

test.describe("SmsRouter", () => {
  test("throws when no providers given", () => {
    expect(() => new SmsRouter({ providers: [] })).toThrow("At least one SMS provider is required");
  });

  test("routes sendOtp to the first successful provider", async () => {
    const router = new SmsRouter({
      providers: [makeProvider("failer", false), makeProvider("winner", true)],
      logger: createLogger("silent"),
    });

    const result = await router.sendOtp({
      number: "+233000000000",
      senderId: "Test",
      expiry: 5,
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("winner");
  });

  test("fails when all providers fail for sendOtp", async () => {
    const router = new SmsRouter({
      providers: [makeProvider("failer1", false)],
      logger: createLogger("silent"),
    });

    const result = await router.sendOtp({
      number: "+233000000000",
      senderId: "Test",
      expiry: 5,
    });

    expect(result.success).toBe(false);
  });

  test("routes verifyOtp to the first successful provider", async () => {
    const router = new SmsRouter({
      providers: [makeProvider("failer", false), makeProvider("winner", true)],
      logger: createLogger("silent"),
    });

    const result = await router.verifyOtp({ code: "123456", number: "+233000000000" });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("winner");
  });

  test("fails when all providers fail for verifyOtp", async () => {
    const router = new SmsRouter({
      providers: [makeProvider("failer1", false)],
      logger: createLogger("silent"),
    });

    const result = await router.verifyOtp({ code: "123456", number: "+233000000000" });

    expect(result.success).toBe(false);
  });

  test("handles provider throwing in verifyOtp", async () => {
    const router = new SmsRouter({
      providers: [makeProvider("failer1", false, true), makeProvider("backup", true)],
      logger: createLogger("silent"),
    });

    const result = await router.verifyOtp({ code: "123456", number: "+233000000000" });

    expect(result.success).toBe(true);
    expect(result.provider).toBe("backup");
  });
});
