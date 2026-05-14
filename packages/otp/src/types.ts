import type { Logger } from "@gh-api/core";

/** Configuration for the OtpService. */
export interface OtpServiceConfig {
  /** Arkesel API key. */
  apiKey: string;
  /** Optional logger instance. Defaults to a pino console logger. */
  logger?: Logger;
}
