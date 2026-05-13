import { GhApiClient } from "@gh-api/core";
import type { ListSmsParams, SendSmsParams, SendSmsResponse, SmsMessage } from "./types.js";

export class Sms {
  private readonly client: GhApiClient;

  public constructor(client: GhApiClient) {
    this.client = client;
  }

  public async send(params: SendSmsParams): Promise<SendSmsResponse> {
    const { data } = await this.client.request<SendSmsResponse>(
      "POST",
      "/sms",
      params,
    );
    return data;
  }

  public async list(params?: ListSmsParams): Promise<SmsMessage[]> {
    const query = new URLSearchParams();
    if (params?.limit != null) query.set("limit", String(params.limit));
    if (params?.offset != null) query.set("offset", String(params.offset));
    if (params?.status != null) query.set("status", params.status);

    const qs = query.toString();
    const path = qs ? `/sms?${qs}` : "/sms";

    const { data } = await this.client.request<SmsMessage[]>("GET", path);
    return data;
  }

  public async get(id: string): Promise<SmsMessage> {
    const { data } = await this.client.request<SmsMessage>(
      "GET",
      `/sms/${id}`,
    );
    return data;
  }
}
