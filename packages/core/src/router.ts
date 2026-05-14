import { createLogger } from "./logger.js";
import type {
  Logger,
  SendOtpParams,
  SendOtpResult,
  SmsProvider,
  VerifyOtpParams,
  VerifyOtpResult,
} from "./types.js";

export interface RouterConfig {
  providers: SmsProvider[];
  logger?: Logger;
}

/** Routes OTP operations across multiple SMS providers, falling through until one succeeds. */
export class SmsRouter {
  private readonly providers: SmsProvider[];
  private readonly logger: Logger;

  public constructor(config: RouterConfig) {
    if (config.providers.length === 0) {
      throw new Error("At least one SMS provider is required");
    }
    this.providers = config.providers;
    this.logger = config.logger ?? createLogger();

    this.logger.info(
      {
        providerCount: this.providers.length,
        providers: this.providers.map((p) => p.name),
      },
      "SmsRouter initialized",
    );
  }

  /** Send an OTP through the first provider that succeeds. */
  public async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    const errors: string[] = [];

    this.logger.info(
      {
        number: this.maskNumber(params.number),
        senderId: params.senderId,
        medium: params.medium,
      },
      "sendOtp started",
    );

    for (const provider of this.providers) {
      this.logger.info(
        { provider: provider.name },
        "sendOtp attempting provider",
      );

      try {
        const result = await provider.sendOtp(params);

        if (result.success) {
          this.logger.info({ provider: provider.name }, "sendOtp succeeded");
          return result;
        }

        this.logger.warn(
          { provider: provider.name, error: result.error, code: result.code },
          "sendOtp declined by provider",
        );
        errors.push(
          `[${provider.name}] ${result.error ?? result.message ?? "declined"}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { provider: provider.name, error: message },
          "sendOtp failed with exception",
        );
        errors.push(`[${provider.name}] ${message}`);
      }
    }

    this.logger.error(
      { providerCount: this.providers.length, errors },
      "sendOtp all providers failed",
    );

    return {
      success: false,
      provider: this.providers.map((p) => p.name).join(","),
      error: errors.join("; "),
    };
  }

  /** Verify an OTP code through the first provider that succeeds. */
  public async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    const errors: string[] = [];

    this.logger.info(
      { number: this.maskNumber(params.number) },
      "verifyOtp started",
    );

    for (const provider of this.providers) {
      this.logger.info(
        { provider: provider.name },
        "verifyOtp attempting provider",
      );

      try {
        const result = await provider.verifyOtp(params);

        if (result.success) {
          this.logger.info({ provider: provider.name }, "verifyOtp succeeded");
          return result;
        }

        this.logger.warn(
          { provider: provider.name, error: result.error, code: result.code },
          "verifyOtp declined by provider",
        );
        errors.push(
          `[${provider.name}] ${result.error ?? result.message ?? "declined"}`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { provider: provider.name, error: message },
          "verifyOtp failed with exception",
        );
        errors.push(`[${provider.name}] ${message}`);
      }
    }

    this.logger.error(
      { providerCount: this.providers.length, errors },
      "verifyOtp all providers failed",
    );

    return {
      success: false,
      provider: this.providers.map((p) => p.name).join(","),
      error: errors.join("; "),
    };
  }

  private maskNumber(number: string): string {
    if (number.length <= 4) return "****";
    return `${number.slice(0, 2)}****${number.slice(-2)}`;
  }
}
