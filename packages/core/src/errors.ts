import type { ApiError } from "./types.js";

export class GhApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  public constructor(error: ApiError) {
    super(error.message);
    this.name = "GhApiError";
    this.status = error.status;
    this.code = error.code;
  }
}

export class RateLimitError extends GhApiError {
  public readonly retryAfter: number;

  public constructor(error: ApiError, retryAfter: number) {
    super(error);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class AuthenticationError extends GhApiError {
  public constructor(
    message = "Invalid or missing API key",
    code = "UNAUTHORIZED",
  ) {
    super({ status: 401, message, code });
    this.name = "AuthenticationError";
  }
}
