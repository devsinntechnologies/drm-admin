import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

export const BUSINESS_INACTIVE_CODE = "BUSINESS_INACTIVE";
export const PRODUCT_DISABLED_CODE = "PRODUCT_DISABLED";

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

function payloadCode(data: unknown): string {
  const record = data as Record<string, unknown> | undefined;
  if (!record) return "";
  const messageField = record.message;
  if (messageField && typeof messageField === "object" && (messageField as { code?: string }).code) {
    return String((messageField as { code?: string }).code);
  }
  return typeof record.code === "string" ? record.code : "";
}

function payloadProduct(data: unknown): string {
  const record = data as Record<string, unknown> | undefined;
  if (!record) return "";
  const messageField = record.message;
  if (messageField && typeof messageField === "object" && (messageField as { product?: string }).product) {
    return String((messageField as { product?: string }).product);
  }
  return typeof record.product === "string" ? record.product : "";
}

/** Detects the "business paused/deactivated" error shape from any raw {status, data} pair. */
export function isBusinessInactivePayload(status: number | undefined, data: unknown): boolean {
  if (status !== 403) return false;
  const code = payloadCode(data);
  if (code === BUSINESS_INACTIVE_CODE || code === PRODUCT_DISABLED_CODE) return true;

  const record = data as Record<string, unknown> | undefined;
  if (!record) return false;
  const text = readMessageField(record.message) || readMessageField(record);
  const lower = text.toLowerCase();
  return lower.includes("deactivated") || lower.includes("turned off");
}

export function isPortalSessionEndedPayload(status: number | undefined, data: unknown): boolean {
  if (!isBusinessInactivePayload(status, data)) return false;
  const product = payloadProduct(data);
  return !product || product === "portal";
}

export function businessInactivePayloadMessage(data: unknown): string {
  const record = data as Record<string, unknown> | undefined;
  if (!record) return BUSINESS_INACTIVE_MESSAGE;

  const messageField = record.message;
  const text = readMessageField(messageField);
  return text || BUSINESS_INACTIVE_MESSAGE;
}

export function isBusinessInactiveError(error: FetchBaseQueryError | undefined): boolean {
  if (!error) return false;
  return isBusinessInactivePayload(error.status as number | undefined, error.data);
}

export function businessInactiveMessage(error: FetchBaseQueryError | undefined): string {
  return businessInactivePayloadMessage(error?.data);
}
