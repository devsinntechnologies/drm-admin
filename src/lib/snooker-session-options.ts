/** Mirrors Flutter SessionTimer.gameTypeOptions / minutePresets. */
export const SNOOKER_GAME_TYPE_OPTIONS = [
  { name: "Single", includedMinutes: 15 },
  { name: "Double", includedMinutes: 15 },
  { name: "Century", includedMinutes: 60 },
] as const;

export const SNOOKER_MINUTE_PRESETS = [15, 30, 45, 60, 90, 120] as const;

export type SnookerBookingDetails = {
  tableGuestName: string;
  gameType: string;
  sessionMinutes: number;
};
