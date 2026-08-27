import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

export const BUSINESS_INACTIVE_CODE = "BUSINESS_INACTIVE";

export const BUSINESS_INACTIVE_MESSAGE =
  "This business has been deactivated. Please contact your administrator.";

function readMessageField(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "message" in value) {
    const nested = (value as { message?: unknown }).message;
    return typeof nested === "string" ? nested : "";
  }
  return "";
}

export function isBusinessInactiveError(error: FetchBaseQueryError | undefined): boolean {
  if (!error || error.status !== 403) return false;

  const data = error.data as Record<string, unknown> | undefined;
  if (!data) return false;

  const messageField = data.message;
  if (
    messageField &&
    typeof messageField === "object" &&
    (messageField as { code?: string }).code === BUSINESS_INACTIVE_CODE
  ) {
    return true;
  }

  if (data.code === BUSINESS_INACTIVE_CODE) return true;

  const text = readMessageField(messageField) || readMessageField(data);
  return text.toLowerCase().includes("deactivated");
}

export function businessInactiveMessage(error: FetchBaseQueryError | undefined): string {
  const data = error?.data as Record<string, unknown> | undefined;
  if (!data) return BUSINESS_INACTIVE_MESSAGE;

  const messageField = data.message;
  const text = readMessageField(messageField);
  return text || BUSINESS_INACTIVE_MESSAGE;
}
