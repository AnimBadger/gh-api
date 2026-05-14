# gh-api

TypeScript SDK for Ghana-based APIs — messaging, payments, identity, and more.

## Packages

| Package           | Description                               |
| ----------------- | ----------------------------------------- |
| `@gh-api/core`    | Shared HTTP client, router, types, logger |
| `@gh-api/arkesel` | Arkesel SMS / OTP provider                |
| `@gh-api/sms`     | Generic SMS client                        |

## Usage

```ts
import { createLogger } from "@gh-api/core";
import { Otp } from "@gh-api/arkesel";

const otp = new Otp({ apiKey: process.env.ARKESEL_API_KEY! });

const result = await otp.sendOtp({
  number: "23354******6",
  senderId: "SenderID",
  expiry: 5,
});
```

## Development

```sh
npm install
npm run build
npm run test
npm run lint
```

## License

MIT
