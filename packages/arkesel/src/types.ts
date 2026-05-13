import type { Logger } from "@gh-api/core";

export interface OtpConfig {
  apiKey: string;
  logger?: Logger;
}

export interface GenerateOtpParams {
  number: string;
  senderId: string;
  expiry: number;
  message?: string;
  length?: number;
  medium?: "sms" | "voice";
  type?: "numeric" | "alphanumeric";
}

export interface GenerateOtpResponse {
  code: string;
  message: string;
  ussd_code?: string;
}

export interface VerifyOtpParams {
  code: string;
  number: string;
}

export interface VerifyOtpResponse {
  code: string;
  message: string;
}

export type ArkeselResponseCode =
  | "1000"
  | "1001"
  | "1002"
  | "1003"
  | "1004"
  | "1005"
  | "1006"
  | "1007"
  | "1008"
  | "1009"
  | "1010"
  | "1011"
  | "1100";
