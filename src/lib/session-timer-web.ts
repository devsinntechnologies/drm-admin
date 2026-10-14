import { scheduledEndAt } from "@/lib/session-billing.util";

export type SessionOrderLike = {
  createdAt: string;
  sessionMinutes?: number | null;
  sessionPausedAt?: string | null;
  sessionPausedMs?: number | null;
  gameType?: string | null;
};

export function isSessionPaused(order: SessionOrderLike): boolean {
  return Boolean(order.sessionPausedAt);
}

export function sessionRemainingSeconds(order: SessionOrderLike, nowMs = Date.now()): number {
  const minutes = order.sessionMinutes ?? 0;
  if (minutes <= 0) {
    if (String(order.gameType ?? "").trim()) return 24 * 60 * 60;
    return 0;
  }

  const start = new Date(order.createdAt).getTime();
  if (!Number.isFinite(start)) return 0;

  const adjustedEnd = scheduledEndAt(order, new Date(nowMs)).getTime();
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

export function sessionPlayedSeconds(order: SessionOrderLike, nowMs = Date.now()): number {
  const start = new Date(order.createdAt).getTime();
  if (!Number.isFinite(start)) return 0;
  let pausedMs = Number(order.sessionPausedMs ?? 0);
  if (order.sessionPausedAt) {
    pausedMs += Math.max(0, nowMs - new Date(order.sessionPausedAt).getTime());
  }
  return Math.max(0, Math.floor((nowMs - start - pausedMs) / 1000));
}

export function sessionBookedMinutes(order: SessionOrderLike): number {
  return Math.max(0, Number(order.sessionMinutes ?? 0));
}

export function sessionProgress(order: SessionOrderLike, remainingSec: number): number {
  const bookedSec = sessionBookedMinutes(order) * 60;
  if (bookedSec <= 0 || remainingSec <= 0) return remainingSec <= 0 ? 0 : 1;
  return Math.min(1, Math.max(0, remainingSec / bookedSec));
}
