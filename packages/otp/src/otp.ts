import { SmsRouter, createLogger } from "@gh-api/core";
import type {
  Logger,
  SendOtpParams,
  SendOtpResult,
  VerifyOtpParams,
  VerifyOtpResult,
} from "@gh-api/core";
import { Otp as ArkeselOtp } from "@gh-api/arkesel";
import type { OtpServiceConfig } from "./types.js";

/** High-level OTP service that uses Arkesel as the primary provider. */
export class OtpService {
  private readonly router: SmsRouter;
  private readonly logger: Logger;

  public constructor(config: OtpServiceConfig) {
    this.logger = config.logger ?? createLogger();
    const provider = new ArkeselOtp({ apiKey: config.apiKey, logger: this.logger });
    this.router = new SmsRouter({ providers: [provider], logger: this.logger });
    this.logger.info({ provider: "arkesel" }, "OtpService initialized");
  }

  /** Send an OTP code to the given phone number. */
  public async send(params: SendOtpParams): Promise<SendOtpResult> {
    this.logger.info(
      { number: params.number, senderId: params.senderId, medium: params.medium },
      "otpService.send started",
    );

    try {
      const result = await this.router.sendOtp(params);
      this.logger.info(
        { success: result.success, provider: result.provider, code: result.code },
        "otpService.send completed",
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "otpService.send failed");
      return { success: false, provider: "otp-service", error: message };
    }
  }

  /** Verify an OTP code. */
  public async verify(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    this.logger.info({ number: params.number }, "otpService.verify started");

    try {
      const result = await this.router.verifyOtp(params);
      this.logger.info(
        { success: result.success, provider: result.provider, code: result.code },
        "otpService.verify completed",
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "otpService.verify failed");
      return { success: false, provider: "otp-service", error: message };
    }
  }
}
