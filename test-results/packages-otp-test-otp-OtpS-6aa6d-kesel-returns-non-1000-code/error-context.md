# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: packages/otp/test/otp.test.ts >> OtpService >> send returns failure when Arkesel returns non-1000 code
- Location: test/otp.test.ts:69:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "1001"
Received: undefined
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { OtpService } from "../src/otp.js";
  3   | import { createLogger } from "@gh-api/core";
  4   | 
  5   | function mockFetch(status: number, body: Record<string, unknown>): () => void {
  6   |   const original = globalThis.fetch;
  7   |   globalThis.fetch = () =>
  8   |     Promise.resolve({
  9   |       ok: status >= 200 && status < 300,
  10  |       status,
  11  |       json: () => Promise.resolve(body),
  12  |     } as Response);
  13  |   return () => {
  14  |     globalThis.fetch = original;
  15  |   };
  16  | }
  17  | 
  18  | let fetchCalls: { input: string | URL | Request; options: RequestInit }[] = [];
  19  | 
  20  | function trackableMockFetch(
  21  |   status: number,
  22  |   body: Record<string, unknown>,
  23  | ): () => void {
  24  |   const original = globalThis.fetch;
  25  |   fetchCalls = [];
  26  |   globalThis.fetch = (input: string | URL | Request, options?: RequestInit) => {
  27  |     fetchCalls.push({ input, options: options ?? {} });
  28  |     return Promise.resolve({
  29  |       ok: status >= 200 && status < 300,
  30  |       status,
  31  |       json: () => Promise.resolve(body),
  32  |     } as Response);
  33  |   };
  34  |   return () => {
  35  |     globalThis.fetch = original;
  36  |   };
  37  | }
  38  | 
  39  | const logger = createLogger("silent");
  40  | 
  41  | test.describe("OtpService", () => {
  42  |   test("exposes send and verify methods", () => {
  43  |     const service = new OtpService({ apiKey: "test-key", logger });
  44  | 
  45  |     expect(typeof service.send).toBe("function");
  46  |     expect(typeof service.verify).toBe("function");
  47  |   });
  48  | 
  49  |   test("send returns success when Arkesel returns code 1000", async () => {
  50  |     const restore = mockFetch(200, {
  51  |       code: "1000",
  52  |       message: "OTP sent",
  53  |       ussd_code: "*928*01#",
  54  |     });
  55  |     const service = new OtpService({ apiKey: "test-key", logger });
  56  | 
  57  |     const result = await service.send({
  58  |       number: "233544919953",
  59  |       senderId: "Arkesel",
  60  |       expiry: 5,
  61  |     });
  62  |     restore();
  63  | 
  64  |     expect(result.success).toBe(true);
  65  |     expect(result.code).toBe("1000");
  66  |     expect(result.provider).toBe("arkesel");
  67  |   });
  68  | 
  69  |   test("send returns failure when Arkesel returns non-1000 code", async () => {
  70  |     const restore = mockFetch(200, { code: "1001", message: "Validation error" });
  71  |     const service = new OtpService({ apiKey: "test-key", logger });
  72  | 
  73  |     const result = await service.send({
  74  |       number: "233544919953",
  75  |       senderId: "Arkesel",
  76  |       expiry: 5,
  77  |     });
  78  |     restore();
  79  | 
  80  |     expect(result.success).toBe(false);
> 81  |     expect(result.code).toBe("1001");
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  82  |   });
  83  | 
  84  |   test("send returns failure on network error", async () => {
  85  |     const original = globalThis.fetch;
  86  |     globalThis.fetch = () => Promise.reject(new Error("Network down"));
  87  |     const service = new OtpService({ apiKey: "test-key", logger });
  88  | 
  89  |     const result = await service.send({
  90  |       number: "233544919953",
  91  |       senderId: "Arkesel",
  92  |       expiry: 5,
  93  |     });
  94  |     globalThis.fetch = original;
  95  | 
  96  |     expect(result.success).toBe(false);
  97  |     expect(result.error).toContain("Network down");
  98  |   });
  99  | 
  100 |   test("send sends the correct request body", async () => {
  101 |     const restore = trackableMockFetch(200, { code: "1000", message: "OK" });
  102 |     const service = new OtpService({ apiKey: "test-key", logger });
  103 | 
  104 |     await service.send({
  105 |       number: "233544919953",
  106 |       senderId: "Arkesel",
  107 |       expiry: 5,
  108 |       length: 6,
  109 |       medium: "sms",
  110 |       type: "numeric",
  111 |       message: "This is OTP from Arkesel, %otp_code%",
  112 |     });
  113 |     restore();
  114 | 
  115 |     const body = JSON.parse(
  116 |       fetchCalls[0]?.options.body as string,
  117 |     ) as Record<string, unknown>;
  118 | 
  119 |     expect(body.number).toBe("233544919953");
  120 |     expect(body.sender_id).toBe("Arkesel");
  121 |     expect(body.expiry).toBe(5);
  122 |     expect(body.length).toBe(6);
  123 |     expect(body.medium).toBe("sms");
  124 |     expect(body.type).toBe("numeric");
  125 |     expect(body.message).toBe("This is OTP from Arkesel, %otp_code%");
  126 |   });
  127 | 
  128 |   test("verify returns success when Arkesel returns code 1100", async () => {
  129 |     const restore = mockFetch(200, {
  130 |       code: "1100",
  131 |       message: "Verification successful",
  132 |     });
  133 |     const service = new OtpService({ apiKey: "test-key", logger });
  134 | 
  135 |     const result = await service.verify({
  136 |       code: "123456",
  137 |       number: "233544919953",
  138 |     });
  139 |     restore();
  140 | 
  141 |     expect(result.success).toBe(true);
  142 |     expect(result.code).toBe("1100");
  143 |   });
  144 | 
  145 |   test("verify returns failure on network error", async () => {
  146 |     const original = globalThis.fetch;
  147 |     globalThis.fetch = () => Promise.reject(new Error("Timeout"));
  148 |     const service = new OtpService({ apiKey: "test-key", logger });
  149 | 
  150 |     const result = await service.verify({
  151 |       code: "123456",
  152 |       number: "233544919953",
  153 |     });
  154 |     globalThis.fetch = original;
  155 | 
  156 |     expect(result.success).toBe(false);
  157 |     expect(result.error).toContain("Timeout");
  158 |   });
  159 | });
  160 | 
```