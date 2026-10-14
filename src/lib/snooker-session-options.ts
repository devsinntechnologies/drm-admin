/** Mirrors Flutter SessionTimer minutePresets + game types (pricing in session-billing.util). */
import { SNOOKER_GAME_TYPE_OPTIONS, snookerOptionFor } from "@/lib/session-billing.util";

export { SNOOKER_GAME_TYPE_OPTIONS, snookerOptionFor };

export const SNOOKER_MINUTE_PRESETS = [15, 30, 45, 60, 90, 120] as const;

export type SnookerBookingDetails = {
  tableGuestName?: string;
  gameType: string;
  sessionMinutes: number;
};

export function defaultSessionMinutesForGame(gameType: string): number {
  const opt = snookerOptionFor(gameType);
  if (opt?.isPerMinute) return 0;
  return SNOOKER_MINUTE_PRESETS[0];
}
