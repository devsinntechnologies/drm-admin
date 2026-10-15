/** Keep session timer fields in sync across refetch, socket, and optimistic UI. */

export type OrderSessionFields = {
  updatedAt?: string;
  sessionMinutes?: number | null;
  sessionPausedAt?: string | null;
  sessionPausedMs?: number | null;
  gameType?: string | null;
};

function updatedAtMs(value?: string | null): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export function pickNewerSessionTimerSource<A extends OrderSessionFields>(
  a: A,
  b: A,
): A {
  const aMs = updatedAtMs(a.updatedAt);
  const bMs = updatedAtMs(b.updatedAt);
  if (bMs > aMs) return b;
  if (aMs > bMs) return a;
  if (!a.sessionPausedAt && b.sessionPausedAt) return a;
  if (!b.sessionPausedAt && a.sessionPausedAt) return b;
  const aPause = Number(a.sessionPausedMs ?? 0);
  const bPause = Number(b.sessionPausedMs ?? 0);
  if (aPause !== bPause) return aPause >= bPause ? a : b;
  return a;
}

export function mergeOrderSessionFields<T extends OrderSessionFields>(
  existing: T,
  incoming: T,
): T {
  if (updatedAtMs(existing.updatedAt) > updatedAtMs(incoming.updatedAt) && incoming.updatedAt) {
    return existing;
  }
  const timer = pickNewerSessionTimerSource(existing, incoming);
  return {
    ...existing,
    ...incoming,
    sessionMinutes:
      timer.sessionMinutes ?? existing.sessionMinutes ?? incoming.sessionMinutes,
    sessionPausedAt: timer.sessionPausedAt ?? null,
    sessionPausedMs: timer.sessionPausedMs ?? existing.sessionPausedMs ?? 0,
    gameType: timer.gameType ?? existing.gameType ?? incoming.gameType,
    updatedAt:
      updatedAtMs(incoming.updatedAt) >= updatedAtMs(existing.updatedAt)
        ? incoming.updatedAt ?? existing.updatedAt
        : existing.updatedAt ?? incoming.updatedAt,
  };
}

export function isTerminalOrderStatus(status?: string | null): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "completed" || s === "complete" || s === "deleted" || s === "cancelled";
}
