import { DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from "./constants.js";
import { createLogger } from "./logger.js";
import { AuthenticationError, GhApiError, RateLimitError } from "./errors.js";
import type { ApiResponse, ClientConfig, Logger } from "./types.js";

export class GhApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly logger: Logger;
  private readonly defaultHeaders: Record<string, string>;

  public constructor(config: ClientConfig) {
    if (!config.apiKey) {
      throw new AuthenticationError("API key is required");
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.logger = config.logger ?? createLogger();
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...config.headers,
    };
  }

  public async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    this.logger.info({ method, path, baseUrl: this.baseUrl }, "request started");

    const controller = new AbortController();
    const timer = setTimeout(() => { controller.abort(); }, this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: { ...this.defaultHeaders },
        body: body != null ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = (await response.json()) as T;
      this.logger.info({ status: response.status, method, path }, "request completed");

      return { data, status: response.status };
    } catch (error) {
      if (error instanceof GhApiError) throw error;

      this.logger.error({ error, method, path }, "request failed");

      throw new GhApiError({
        status: 0,
        message:
          error instanceof Error ? error.message : "Unknown network error",
        code: "NETWORK_ERROR",
      });
    } finally {
      clearTimeout(timer);
    }
  }

  private async handleError(response: Response): Promise<never> {
    const body = await response.json().catch(() => ({}));

    const apiError = {
      status: response.status,
      message: (body as { message?: string }).message ?? response.statusText,
      code: (body as { code?: string }).code,
    };

    this.logger.error({ status: response.status, apiError }, "request returned error");

    if (response.status === 401) {
      throw new AuthenticationError();
    }

    if (response.status === 429) {
      const retryAfter = Number.parseInt(
        response.headers.get("Retry-After") ?? "5",
        10,
      );
      throw new RateLimitError(apiError, retryAfter);
    }

    throw new GhApiError(apiError);
  }

}
