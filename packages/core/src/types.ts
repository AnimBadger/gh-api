export interface ClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  logger?: Logger;
  headers?: Record<string, string>;
}

export interface Logger {
  info(msgOrObj: string | object, msg?: string): void;
  warn(msgOrObj: string | object, msg?: string): void;
  error(msgOrObj: string | object, msg?: string): void;
  debug(msgOrObj: string | object, msg?: string): void;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export interface SendOtpParams {
  number: string;
  senderId: string;
  expiry: number;
  message?: string;
  length?: number;
  medium?: "sms" | "voice";
  type?: "numeric" | "alphanumeric";
}

export interface SendOtpResult {
  success: boolean;
  provider: string;
  code?: string;
  message?: string;
  error?: string;
}

export interface VerifyOtpParams {
  code: string;
  number: string;
}

export interface VerifyOtpResult {
  success: boolean;
  provider: string;
  code?: string;
  message?: string;
  error?: string;
}

export interface SmsProvider {
  readonly name: string;
  sendOtp(params: SendOtpParams): Promise<SendOtpResult>;
  verifyOtp(params: VerifyOtpParams): Promise<VerifyOtpResult>;
}
