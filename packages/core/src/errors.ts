import type { ApiError } from "./types.js";

/** Base error for all gh-api SDK errors. Wraps an API error response. */
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

/** Thrown when the API returns a 429 Too Many Requests response. */
export class RateLimitError extends GhApiError {
  public readonly retryAfter: number;

  public constructor(error: ApiError, retryAfter: number) {
    super(error);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/** Thrown when the API returns a 401 Unauthorized response or no API key was provided. */
export class AuthenticationError extends GhApiError {
  public constructor(
    message = "Invalid or missing API key",
    code = "UNAUTHORIZED",
  ) {
    super({ status: 401, message, code });
    this.name = "AuthenticationError";
  }
}
