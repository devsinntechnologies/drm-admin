/** Mirrors Flutter SessionTimer minutePresets + game types (pricing in session-billing.util). */
import {
  SNOOKER_GAME_TYPE_OPTIONS,
  snookerOptionFor,
  type SnookerGameTypeOption,
} from "@/lib/session-billing.util";

export { SNOOKER_GAME_TYPE_OPTIONS, snookerOptionFor };

export const SNOOKER_MINUTE_PRESETS = [15, 30, 45, 60, 90, 120] as const;

export type SnookerBookingDetails = {
  tableGuestName?: string;
  gameType: string;
  sessionMinutes: number;
};

/** Minimal shape of a `/snooker/game-types` row needed for POS pricing. */
export type GameTypeRowLike = {
  name: string;
  billingMethod?: "fixed" | "fixed_plus_overtime" | "per_minute";
  basePrice?: number | string | null;
  includedMinutes?: number | string | null;
  perMinuteRate?: number | string | null;
  overtimeEnabled?: boolean;
  overtimeRate?: number | string | null;
  maxDurationMinutes?: number | null;
  durationOptions?: number[] | null;
  isActive?: boolean;
  visibleToBusiness?: boolean;
};

/**
 * Game type row → POS option. Single source of truth for the billing-method → rate
 * rule; mirrors Flutter `SnookerGameTypeOption.fromGameTypeRow`.
 */
export function gameTypeRowToOption(row: GameTypeRowLike): SnookerGameTypeOption {
  const method = row.billingMethod ?? "fixed";
  const isPerMinute = method === "per_minute";
  const overtimeOn = method === "fixed_plus_overtime" && Boolean(row.overtimeEnabled);
  return {
    name: row.name,
    basePrice: Number(row.basePrice ?? 0),
    includedMinutes: Number(row.includedMinutes ?? 0),
    maxDurationMinutes: row.maxDurationMinutes ?? null,
    durationOptions: row.durationOptions ?? null,
    isPerMinute,
    perMinuteRate: Number(isPerMinute ? row.perMinuteRate ?? 0 : overtimeOn ? row.overtimeRate ?? 0 : 0),
  };
}

/** Offered to staff only when enabled and not hidden by the platform. */
export function isOfferedGameType(row: GameTypeRowLike): boolean {
  return row.isActive !== false && row.visibleToBusiness !== false;
}

/**
 * apiClient returns `{ data, pagination }` when the backend adds pagination to a
 * list response; accept that and a bare array.
 */
export function asRowList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const inner = (payload as { data?: unknown } | null)?.data;
  return Array.isArray(inner) ? (inner as T[]) : [];
}

/**
 * Duration choices (minutes) for a game type; `0` = open-ended.
 * Keep in sync with Flutter `SnookerGameTypeOption.durationChoices`.
 * - Configured list (Snooker Table Control) → exactly that list (capped by max duration).
 * - No list → legacy: open-ended + included minutes + standard presets (+ max).
 */
export function snookerDurationChoices(option: SnookerGameTypeOption | null | undefined): number[] {
  if (!option) return [0, ...SNOOKER_MINUTE_PRESETS];
  const max = option.maxDurationMinutes && option.maxDurationMinutes > 0 ? option.maxDurationMinutes : null;
  const withinMax = (m: number) => m === 0 || !max || m <= max;
  const configured = Array.isArray(option.durationOptions) ? option.durationOptions : null;
  const raw = configured && configured.length
    ? configured
    : [0, option.includedMinutes, ...SNOOKER_MINUTE_PRESETS, ...(max ? [max] : [])];
  const clean = Array.from(new Set(raw.map((m) => Math.round(Number(m)))))
    .filter((m) => Number.isFinite(m) && m >= 0 && withinMax(m))
    .sort((a, b) => a - b);
  return clean.length ? clean : [0];
}

/** Best default duration for a game type (first timed choice, else open-ended). */
export function defaultDurationFor(option: SnookerGameTypeOption | null | undefined): number {
  const choices = snookerDurationChoices(option);
  if (option?.isPerMinute && choices.includes(0)) return 0;
  if (option?.includedMinutes && choices.includes(option.includedMinutes)) return option.includedMinutes;
  return choices.find((m) => m > 0) ?? choices[0];
}

export function defaultSessionMinutesForGame(gameType: string): number {
  const opt = snookerOptionFor(gameType);
  if (opt?.isPerMinute) return 0;
  return SNOOKER_MINUTE_PRESETS[0];
}
