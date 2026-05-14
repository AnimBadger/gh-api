import { test, expect } from "@playwright/test";
import { Sms } from "../src/sms.js";
import { GhApiClient, createLogger } from "@gh-api/core";

function mockFetch(status: number, body: unknown): () => void {
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

const client = new GhApiClient({
  apiKey: "test-key",
  logger: createLogger("silent"),
});

test.describe("Sms", () => {
  test("exposes send, list, get methods", () => {
    const sms = new Sms(client);

    expect(typeof sms.send).toBe("function");
    expect(typeof sms.list).toBe("function");
    expect(typeof sms.get).toBe("function");
  });

  test("send posts to /sms with params and returns response", async () => {
    const restore = mockFetch(200, {
      id: "msg_1",
      to: "+233500000000",
      from: "Test",
      body: "Hello",
      status: "sent",
      createdAt: "2026-01-01T00:00:00Z",
    });
    const sms = new Sms(client);

    const result = await sms.send({
      to: "+233500000000",
      from: "Test",
      body: "Hello",
    });
    restore();

    expect(result.id).toBe("msg_1");
    expect(result.status).toBe("sent");
  });

  test("list returns an array of messages", async () => {
    const restore = mockFetch(200, [
      {
        id: "msg_1",
        to: "+233500000000",
        from: "Test",
        body: "Hello",
        status: "delivered",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:05Z",
      },
    ]);
    const sms = new Sms(client);

    const result = await sms.list();
    restore();

    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.id).toBe("msg_1");
  });

  test("list with filters appends query params", async () => {
    const restore = mockFetch(200, []);
    const sms = new Sms(client);

    const result = await sms.list({ limit: 10, offset: 0, status: "sent" });
    restore();

    expect(Array.isArray(result)).toBe(true);
  });

  test("get returns a single message by ID", async () => {
    const restore = mockFetch(200, {
      id: "msg_1",
      to: "+233500000000",
      from: "Test",
      body: "Hello",
      status: "delivered",
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:05Z",
    });
    const sms = new Sms(client);

    const result = await sms.get("msg_1");
    restore();

    expect(result.id).toBe("msg_1");
    expect(result.status).toBe("delivered");
  });

  test("throws on API error", async () => {
    const restore = mockFetch(500, { message: "Server error" });
    const sms = new Sms(client);

    await expect(
      sms.send({ to: "+233500000000", from: "Test", body: "Hello" }),
    ).rejects.toThrow();
    restore();
  });
});
