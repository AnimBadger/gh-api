export interface SendSmsParams {
  to: string;
  from: string;
  body: string;
}

export interface SendSmsResponse {
  id: string;
  to: string;
  from: string;
  body: string;
  status: SmsStatus;
  createdAt: string;
}

export type SmsStatus =
  | "queued"
  | "sent"
  | "delivered"
  | "failed"
  | "undelivered";

export interface SmsMessage {
  id: string;
  to: string;
  from: string;
  body: string;
  status: SmsStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ListSmsParams {
  limit?: number;
  offset?: number;
  status?: SmsStatus;
}
