import { GhApiClient, createLogger } from "@gh-api/core";
import type { Logger } from "@gh-api/core";
import type {
  ListSmsParams,
  SendSmsParams,
  SendSmsResponse,
  SmsMessage,
} from "./types.js";

/** Generic SMS client for sending, listing, and retrieving SMS messages. */
export class Sms {
  private readonly client: GhApiClient;
  private readonly logger: Logger;

  public constructor(client: GhApiClient, logger?: Logger) {
    this.client = client;
    this.logger = logger ?? createLogger();
  }

  /** Send an SMS message. */
  public async send(params: SendSmsParams): Promise<SendSmsResponse> {
    this.logger.info({ to: params.to }, "sms.send started");

    try {
      const { data } = await this.client.request<SendSmsResponse>(
        "POST",
        "/sms",
        params,
      );

      this.logger.info(
        { id: data.id, status: data.status },
        "sms.send succeeded",
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "sms.send failed");
      throw error;
    }
  }

  /** List sent SMS messages, with optional filtering. */
  public async list(params?: ListSmsParams): Promise<SmsMessage[]> {
    const query = new URLSearchParams();
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    if (params?.status != null) query.set("status", params.status);

    const qs = query.toString();
    const path = qs ? `/sms?${qs}` : "/sms";

    this.logger.info({ path }, "sms.list started");

    try {
      const { data } = await this.client.request<SmsMessage[]>("GET", path);

      this.logger.info({ count: data.length }, "sms.list succeeded");
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message }, "sms.list failed");
      throw error;
    }
  }

  /** Get a single SMS message by ID. */
  public async get(id: string): Promise<SmsMessage> {
    this.logger.info({ id }, "sms.get started");

    try {
      const { data } = await this.client.request<SmsMessage>(
        "GET",
        `/sms/${id}`,
      );

      this.logger.info(
        { id: data.id, status: data.status },
        "sms.get succeeded",
      );
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message, id }, "sms.get failed");
      throw error;
    }
  }
}
