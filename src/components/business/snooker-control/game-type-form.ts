import type { SnookerGameTypeRow } from "@/hooks/useSnooker";
import { gameTypeRowToOption, snookerDurationChoices } from "@/lib/snooker-session-options";
import { billingMethodOf, type BillingMethod } from "./format";

/** Editor state: numbers stay strings so inputs can be cleared while typing. */
export type GameTypeFormState = {
  code: string;
  name: string;
  billingMethod: BillingMethod;
  basePrice: string;
  includedMinutes: string;
  perMinuteRate: string;
  overtimeRate: string;
  maxDurationMinutes: string;
  useCustomDurations: boolean;
  durationOptions: number[];
  isActive: boolean;
  visibleToBusiness: boolean;
  priceLocked: boolean;
  /** Empty = backend places it after the existing game types. */
  sortOrder: string;
};

/** Body accepted by POST/PATCH /admin/businesses/:id/snooker/game-types. */
export type GameTypePayload = {
  code?: string;
  name: string;
  billingMethod: BillingMethod;
  billingMode: "flat" | "per_minute";
  basePrice: number;
  includedMinutes: number;
  perMinuteRate: number;
  overtimeEnabled: boolean;
  overtimeRate: number;
  maxDurationMinutes: number | null;
  durationOptions: number[] | null;
  isActive: boolean;
  visibleToBusiness: boolean;
  priceLocked: boolean;
  sortOrder?: number;
};

export const EMPTY_GAME_TYPE_FORM: GameTypeFormState = {
  code: "",
  name: "",
  billingMethod: "fixed_plus_overtime",
  basePrice: "100",
  includedMinutes: "15",
  perMinuteRate: "0",
  overtimeRate: "8",
  maxDurationMinutes: "",
  useCustomDurations: true,
  durationOptions: [15, 30, 60],
  isActive: true,
  visibleToBusiness: true,
  priceLocked: false,
  sortOrder: "",
};

export function formFromRow(row: SnookerGameTypeRow): GameTypeFormState {
  const configured = Array.isArray(row.durationOptions) && row.durationOptions.length > 0;
  return {
    code: row.code,
    name: row.name,
    billingMethod: billingMethodOf(row),
    basePrice: String(Number(row.basePrice ?? 0)),
    includedMinutes: String(Number(row.includedMinutes ?? 0)),
    perMinuteRate: String(Number(row.perMinuteRate ?? 0)),
    overtimeRate: String(Number(row.overtimeRate ?? 0)),
    maxDurationMinutes: row.maxDurationMinutes ? String(row.maxDurationMinutes) : "",
    useCustomDurations: configured,
    // Start the custom list from what staff see today, so switching is lossless.
    durationOptions: configured ? row.durationOptions! : snookerDurationChoices(gameTypeRowToOption(row)),
    isActive: row.isActive,
    visibleToBusiness: row.visibleToBusiness !== false,
    priceLocked: Boolean(row.priceLocked),
    sortOrder: String(row.sortOrder ?? 0),
  };
}

const toNumber = (value: string) => (value.trim() === "" ? 0 : Number(value));

/** Only the fields that matter for the chosen billing method are sent non-zero. */
export function payloadFromForm(form: GameTypeFormState, creating: boolean): GameTypePayload {
  const method = form.billingMethod;
  const perMinute = method === "per_minute";
  const overtime = method === "fixed_plus_overtime";
  return {
    ...(creating ? { code: form.code.trim() || form.name.trim() } : {}),
    name: form.name.trim(),
    billingMethod: method,
    billingMode: perMinute ? "per_minute" : "flat",
    basePrice: perMinute ? 0 : toNumber(form.basePrice),
    includedMinutes: perMinute ? 0 : toNumber(form.includedMinutes),
    perMinuteRate: perMinute ? toNumber(form.perMinuteRate) : 0,
    overtimeEnabled: overtime,
    overtimeRate: overtime ? toNumber(form.overtimeRate) : 0,
    maxDurationMinutes: form.maxDurationMinutes.trim() ? toNumber(form.maxDurationMinutes) : null,
    durationOptions: form.useCustomDurations ? [...form.durationOptions].sort((a, b) => a - b) : null,
    isActive: form.isActive,
    visibleToBusiness: form.visibleToBusiness,
    priceLocked: form.priceLocked,
    ...(form.sortOrder.trim() !== "" ? { sortOrder: toNumber(form.sortOrder) } : {}),
  };
}

/** Returns a user-facing message, or null when the form can be saved. */
export function validateGameTypeForm(form: GameTypeFormState): string | null {
  if (!form.name.trim()) return "Name is required.";
  const money = [form.basePrice, form.perMinuteRate, form.overtimeRate, form.includedMinutes];
  if (money.some((v) => v.trim() !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0))) {
    return "Prices and minutes cannot be negative.";
  }
  if (form.useCustomDurations && form.durationOptions.length === 0) {
    return "Pick at least one duration, or use the default durations.";
  }
  return null;
}
