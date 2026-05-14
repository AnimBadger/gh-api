import { test, expect } from "@playwright/test";
import { OtpService } from "../src/otp.js";
import { createLogger } from "@gh-api/core";

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

let fetchCalls: { input: string | URL | Request; options: RequestInit }[] = [];

function trackableMockFetch(
  status: number,
  body: Record<string, unknown>,
): () => void {
  const original = globalThis.fetch;
  fetchCalls = [];
  globalThis.fetch = (input: string | URL | Request, options?: RequestInit) => {
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

const logger = createLogger("silent");

test.describe("OtpService", () => {
  test("exposes send and verify methods", () => {
    const service = new OtpService({ apiKey: "test-key", logger });

    expect(typeof service.send).toBe("function");
    expect(typeof service.verify).toBe("function");
  });

  test("send returns success when Arkesel returns code 1000", async () => {
    const restore = mockFetch(200, {
      code: "1000",
      message: "OTP sent",
      ussd_code: "*928*01#",
    });
    const service = new OtpService({ apiKey: "test-key", logger });

    const result = await service.send({
      number: "233544919953",
      senderId: "Arkesel",
      expiry: 5,
    });
    restore();

    expect(result.success).toBe(true);
    expect(result.code).toBe("1000");
    expect(result.provider).toBe("arkesel");
  });

  test("send returns failure when Arkesel returns non-1000 code", async () => {
    const restore = mockFetch(200, {
      code: "1001",
      message: "Validation error",
    });
    const service = new OtpService({ apiKey: "test-key", logger });

    const result = await service.send({
      number: "233544919953",
      senderId: "Arkesel",
      expiry: 5,
    });
    restore();

    expect(result.success).toBe(false);
  });

  test("send returns failure on network error", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("Network down"));
    const service = new OtpService({ apiKey: "test-key", logger });

    const result = await service.send({
      number: "233544919953",
      senderId: "Arkesel",
      expiry: 5,
    });
    globalThis.fetch = original;

    expect(result.success).toBe(false);
    expect(result.error).toContain("Network down");
  });

  test("send sends the correct request body", async () => {
    const restore = trackableMockFetch(200, { code: "1000", message: "OK" });
    const service = new OtpService({ apiKey: "test-key", logger });

    await service.send({
      number: "233544919953",
      senderId: "Arkesel",
      expiry: 5,
      length: 6,
      medium: "sms",
      type: "numeric",
      message: "This is OTP from Arkesel, %otp_code%",
    });
    restore();

    const body = JSON.parse(fetchCalls[0]?.options.body as string) as Record<
      string,
      unknown
    >;

    expect(body.number).toBe("233544919953");
    expect(body.sender_id).toBe("Arkesel");
    expect(body.expiry).toBe(5);
    expect(body.length).toBe(6);
    expect(body.medium).toBe("sms");
    expect(body.type).toBe("numeric");
    expect(body.message).toBe("This is OTP from Arkesel, %otp_code%");
  });

  test("verify returns success when Arkesel returns code 1100", async () => {
    const restore = mockFetch(200, {
      code: "1100",
      message: "Verification successful",
    });
    const service = new OtpService({ apiKey: "test-key", logger });

    const result = await service.verify({
      code: "123456",
      number: "233544919953",
    });
    restore();

    expect(result.success).toBe(true);
    expect(result.code).toBe("1100");
  });

  test("verify returns failure on network error", async () => {
    const original = globalThis.fetch;
    globalThis.fetch = () => Promise.reject(new Error("Timeout"));
    const service = new OtpService({ apiKey: "test-key", logger });

    const result = await service.verify({
      code: "123456",
      number: "233544919953",
    });
    globalThis.fetch = original;

    expect(result.success).toBe(false);
    expect(result.error).toContain("Timeout");
  });
});
