import { createLogger } from "@gh-api/core";
import type { Logger, SendOtpParams, SendOtpResult, VerifyOtpParams, VerifyOtpResult } from "@gh-api/core";
import type { OtpConfig } from "./types.js";
import { ARKESEL_BASE_URL, DEFAULT_TIMEOUT, DEFAULT_MESSAGE } from "./constants.js";

/** Arkesel SMS/OTP provider. Implements the `SmsProvider` interface. */
export class Otp {
  public readonly name = "arkesel";
  private readonly apiKey: string;
  private readonly logger: Logger;

  public constructor(config: OtpConfig) {
    this.apiKey = config.apiKey;
    this.logger = config.logger ?? createLogger();
    this.logger.info({ provider: this.name }, "Arkesel Otp initialized");
  }

  /** Send an OTP code via the Arkesel API. */
  public async sendOtp(params: SendOtpParams): Promise<SendOtpResult> {
    this.logger.info(
      { number: maskNumber(params.number), senderId: params.senderId, medium: params.medium },
      "arkesel sendOtp started",
    );

    try {
      const data = await this.post<{ code: string; message: string; ussd_code?: string }>(
        "/api/otp/generate",
        {
          number: params.number,
          sender_id: params.senderId,
          expiry: params.expiry,
          length: params.length ?? 6,
          medium: params.medium ?? "sms",
          message: params.message ?? DEFAULT_MESSAGE,
          type: params.type ?? "numeric",
        },
      );

      const success = data.code === "1000";

      if (success) {
        this.logger.info(
          { code: data.code, message: data.message, ussdCode: data.ussd_code },
          "arkesel sendOtp succeeded",
        );
      } else {
        this.logger.warn(
          { code: data.code, message: data.message },
          "arkesel sendOtp returned non-success code",
        );
      }

      return { success, provider: this.name, code: data.code, message: data.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "arkesel sendOtp failed");
      return { success: false, provider: this.name, error: message };
    }
  }

  /** Verify an OTP code via the Arkesel API. */
  public async verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult> {
    this.logger.info(
      { number: maskNumber(params.number) },
      "arkesel verifyOtp started",
    );

    try {
      const data = await this.post<{ code: string; message: string }>(
        "/api/otp/verify",
        { code: params.code, number: params.number },
      );

      const success = data.code === "1100";

      if (success) {
        this.logger.info(
          { code: data.code, message: data.message },
          "arkesel verifyOtp succeeded",
        );
      } else {
        this.logger.warn(
          { code: data.code, message: data.message },
          "arkesel verifyOtp returned non-success code",
        );
      }

      return { success, provider: this.name, code: data.code, message: data.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "arkesel verifyOtp failed");
      return { success: false, provider: this.name, error: message };
    }
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${ARKESEL_BASE_URL}${path}`;

    this.logger.info({ path }, "arkesel request started");

    const controller = new AbortController();
    const timer = setTimeout(() => { controller.abort(); }, DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": this.apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = (await response.json()) as T;

      if (!response.ok) {
        this.logger.error({ status: response.status, data }, "arkesel request returned error");
        throw new Error(`Arkesel API error: ${response.status}`);
      }

      this.logger.info({ status: response.status, path }, "arkesel request completed");
      return data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("Arkesel API error")) {
        throw error;
      }
      this.logger.error({ error }, "arkesel request failed");
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

function maskNumber(number: string): string {
  if (number.length <= 4) return "****";
  return `${number.slice(0, 2)}****${number.slice(-2)}`;
}
