export type SessionOrderLike = {
  createdAt: string;
  sessionMinutes?: number | null;
  sessionPausedAt?: string | null;
  sessionPausedMs?: number | null;
};

export function isSessionPaused(order: SessionOrderLike): boolean {
  return Boolean(order.sessionPausedAt);
}

export function sessionRemainingSeconds(order: SessionOrderLike, nowMs = Date.now()): number {
  const minutes = order.sessionMinutes ?? 0;
  if (minutes <= 0) return 24 * 60 * 60;

  const start = new Date(order.createdAt).getTime();
  if (!Number.isFinite(start)) return 0;

  const end = start + minutes * 60 * 1000;
  let pausedMs = Number(order.sessionPausedMs ?? 0);
  if (order.sessionPausedAt) {
    pausedMs += Math.max(0, nowMs - new Date(order.sessionPausedAt).getTime());
  }
  const adjustedEnd = end + pausedMs;
  return Math.floor((adjustedEnd - nowMs) / 1000);
}

/** Convert desired remaining minutes into absolute sessionMinutes (matches Flutter). */
export function sessionMinutesForRemaining(
  order: SessionOrderLike,
  remainingMinutes: number,
  nowMs = Date.now(),
): number {
  const want = remainingMinutes < 1 ? 1 : remainingMinutes;
  const start = new Date(order.createdAt).getTime();
  let pausedMs = Number(order.sessionPausedMs ?? 0);
  if (order.sessionPausedAt) {
    pausedMs += Math.max(0, nowMs - new Date(order.sessionPausedAt).getTime());
  }
  const elapsedMs = nowMs - start - pausedMs;
  const elapsedMin = Math.ceil(elapsedMs / 60000);
  const total = (elapsedMin < 0 ? 0 : elapsedMin) + want;
  return total < 1 ? 1 : total;
}

export function formatSessionClock(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const core = `${m}:${s.toString().padStart(2, "0")}`;
  return totalSeconds < 0 ? `+${core}` : core;
}
