import { test, expect } from "@playwright/test";
import { Otp } from "../src/otp.js";
import { SmsRouter, createLogger } from "@gh-api/core";

function silentLogger() {
  return createLogger("silent");
}

function mockFetch(status: number, body: Record<string, unknown>): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = () =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response);
  return () => {
    globalThis.fetch = original;
  };
}

let fetchCalls: { input: string | Request | URL; options: RequestInit }[] = [];

function trackableMockFetch(
  status: number,
  body: Record<string, unknown>,
): () => void {
  const original = globalThis.fetch;
  fetchCalls = [];
  globalThis.fetch = (input: string | Request | URL, options?: RequestInit) => {
    fetchCalls.push({ input, options: options ?? {} });
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    } as Response);
  };
  return () => {
    globalThis.fetch = original;
  };
}

const otp = new Otp({ apiKey: "test-key", logger: silentLogger() });

test.describe("Otp", () => {
  test("exposes sendOtp and verifyOtp methods", () => {
    expect(typeof otp.sendOtp).toBe("function");
    expect(typeof otp.verifyOtp).toBe("function");
  });

  test("provides a name property", () => {
    expect(otp.name).toBe("arkesel");
  });

  test("can be used with SmsRouter", () => {
    const router = new SmsRouter({
      providers: [otp],
      logger: silentLogger(),
    });
    expect(router).toBeInstanceOf(SmsRouter);
  });
});

test.describe("Otp.sendOtp", () => {
  test("returns success when API returns code 1000", async () => {
    const restore = mockFetch(200, {
      code: "1000",
      message: "OTP sent",
      ussd_code: "*928*01#",
    });
    const result = await otp.sendOtp({
      number: "233541232346",
      senderId: "Test",
      expiry: 5,
    });
    restore();

    expect(result.success).toBe(true);
    expect(result.code).toBe("1000");
    expect(result.provider).toBe("arkesel");
  });

  test("returns failure when API returns non-1000 code", async () => {
    const restore = mockFetch(200, {
      code: "1001",
      message: "Validation error",
    });
    const result = await otp.sendOtp({
      number: "233541232346",
      senderId: "Test",
      expiry: 5,
    });
    restore();

    expect(result.success).toBe(false);
    expect(result.code).toBe("1001");
  });

  test("returns failure on network error", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("Network down"));

    const result = await otp.sendOtp({
      number: "233541232346",
      senderId: "Test",
      expiry: 5,
    });
    globalThis.fetch = original;

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network down");
  });

  test("returns failure on HTTP error", async () => {
    const restore = mockFetch(500, { message: "Server error" });
    const result = await otp.sendOtp({
      number: "233541232346",
      senderId: "Test",
      expiry: 5,
    });
    restore();

    expect(result.success).toBe(false);
  });

  test("sends the correct request body", async () => {
    const restore = trackableMockFetch(200, { code: "1000", message: "OK" });

    await otp.sendOtp({
      number: "233541232346",
      senderId: "TestApp",
      expiry: 10,
      length: 4,
      medium: "voice",
      type: "alphanumeric",
    });
    restore();

    const body = JSON.parse(fetchCalls[0]?.options.body as string) as Record<
      string,
      unknown
    >;

    expect(body.number).toBe("233541232346");
    expect(body.sender_id).toBe("TestApp");
    expect(body.expiry).toBe(10);
    expect(body.length).toBe(4);
    expect(body.medium).toBe("voice");
    expect(body.type).toBe("alphanumeric");
  });
});

test.describe("Otp.verifyOtp", () => {
  test("returns success when API returns code 1100", async () => {
    const restore = mockFetch(200, {
      code: "1100",
      message: "Verification successful",
    });
    const result = await otp.verifyOtp({
      code: "123456",
      number: "233541232346",
    });
    restore();

    expect(result.success).toBe(true);
    expect(result.code).toBe("1100");
    expect(result.provider).toBe("arkesel");
  });

  test("returns failure when API returns non-1100 code", async () => {
    const restore = mockFetch(200, { code: "1101", message: "Invalid code" });
    const result = await otp.verifyOtp({
      code: "000000",
      number: "233541232346",
    });
    restore();

    expect(result.success).toBe(false);
    expect(result.code).toBe("1101");
  });

  test("returns failure on network error", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("Timeout"));

    const result = await otp.verifyOtp({
      code: "123456",
      number: "233541232346",
    });
    globalThis.fetch = original;

    expect(result.success).toBe(false);
    expect(result.error).toContain("Timeout");
  });
});
