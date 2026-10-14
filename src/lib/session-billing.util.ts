/** Snooker timed-table pricing — keep in sync with vendor_backend and Flutter SessionTimer. */

export type SnookerGameTypeOption = {
  name: string;
  basePrice: number;
  includedMinutes: number;
  perMinuteRate: number;
  isPerMinute: boolean;
};

export const SNOOKER_GAME_TYPE_OPTIONS: SnookerGameTypeOption[] = [
  {
    name: "Single",
    basePrice: 100,
    includedMinutes: 15,
    perMinuteRate: 8,
    isPerMinute: false,
  },
  {
    name: "Double",
    basePrice: 200,
    includedMinutes: 15,
    perMinuteRate: 16,
    isPerMinute: false,
  },
  {
    name: "Fifty",
    basePrice: 0,
    includedMinutes: 0,
    perMinuteRate: 10,
    isPerMinute: true,
  },
  {
    name: "Century",
    basePrice: 0,
    includedMinutes: 0,
    perMinuteRate: 12,
    isPerMinute: true,
  },
];

export function snookerOptionFor(gameType?: string | null): SnookerGameTypeOption | null {
  const key = String(gameType ?? "").trim().toLowerCase();
  if (!key) return null;
  return SNOOKER_GAME_TYPE_OPTIONS.find((o) => o.name.toLowerCase() === key) ?? null;
}

export type SessionClockOrder = {
  createdAt: string;
  sessionMinutes?: number | null;
  sessionPausedAt?: string | null;
  sessionPausedMs?: number | null;
};

export function scheduledEndAt(order: SessionClockOrder, now: Date | string = new Date()): Date {
  const minutes = Number(order.sessionMinutes ?? 0);
  const start = new Date(order.createdAt);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return new Date(now);
  }
  const end = new Date(start.getTime() + minutes * 60_000);
  const clock = new Date(now);
  let pausedMs = Number(order.sessionPausedMs ?? 0);
  if (order.sessionPausedAt) {
    pausedMs += Math.max(0, clock.getTime() - new Date(order.sessionPausedAt).getTime());
  }
  if (pausedMs < 0) pausedMs = 0;
  return new Date(end.getTime() + pausedMs);
}

export function hasTimedTableSession(order: {
  gameType?: string | null;
  sessionMinutes?: number | null;
}): boolean {
  return Boolean(String(order.gameType ?? "").trim()) && order.sessionMinutes != null;
}

export function isOpenEndedSession(order: {
  sessionMinutes?: number | null;
}): boolean {
  return Number(order.sessionMinutes ?? 0) <= 0;
}

export function playedDurationMs(order: SessionClockOrder, now: Date | string = new Date()): number {
  const start = new Date(order.createdAt);
  const clock = new Date(now);
  let pausedMs = Number(order.sessionPausedMs ?? 0);
  if (order.sessionPausedAt) {
    pausedMs += Math.max(0, clock.getTime() - new Date(order.sessionPausedAt).getTime());
  }
  const elapsed = clock.getTime() - start.getTime() - pausedMs;
  return elapsed > 0 ? elapsed : 0;
}

export function billablePlayedMinutes(order: SessionClockOrder, now: Date | string = new Date()): number {
  const secs = Math.floor(playedDurationMs(order, now) / 1000);
  if (secs <= 0) return 0;
  return Math.ceil(secs / 60);
}

export function estimatePackageCharge(opt: SnookerGameTypeOption, minutes: number): number {
  if (opt.isPerMinute) {
    const m = minutes < 1 ? 1 : minutes;
    return m * opt.perMinuteRate;
  }
  const m = minutes < 1 ? 1 : minutes;
  if (m <= opt.includedMinutes) {
    return opt.basePrice;
  }
  const extra = m - opt.includedMinutes;
  return opt.basePrice + extra * opt.perMinuteRate;
}

export type TimedSessionOrder = SessionClockOrder & {
  gameType?: string | null;
  sessionMinutes?: number | null;
};

/** Minutes past package included time (Single/Double) — drives OT billing like the app. */
export function packageOvertimeMinutes(
  order: TimedSessionOrder,
  now: Date | string = new Date(),
): number {
  const opt = snookerOptionFor(order.gameType);
  if (!opt || opt.isPerMinute || isOpenEndedSession(order)) return 0;
  const playedFloor = Math.floor(playedDurationMs(order, now) / 60000);
  return Math.max(0, playedFloor - opt.includedMinutes);
}

export function liveSessionCharge(order: TimedSessionOrder, now: Date | string = new Date()): number {
  const opt = snookerOptionFor(order.gameType);
  if (!opt) return 0;

  if (isOpenEndedSession(order) || opt.isPerMinute) {
    const played = billablePlayedMinutes(order, now);
    return estimatePackageCharge(opt, played <= 0 ? 0 : played);
  }

  const playedFloor = Math.floor(playedDurationMs(order, now) / 60000);
  if (playedFloor <= opt.includedMinutes) {
    return opt.basePrice;
  }
  const extra = playedFloor - opt.includedMinutes;
  return opt.basePrice + extra * opt.perMinuteRate;
}

export type OrderItemLike = {
  total?: number | string | null;
  quantity?: number | null;
  productName?: string | null;
  product?: { isSessionService?: boolean | null; name?: string | null } | null;
};

export function isSessionTableLineItem(item: OrderItemLike): boolean {
  if (item.product?.isSessionService) return true;
  const name = String(item.productName ?? item.product?.name ?? "").toUpperCase();
  return name.includes("TABLE");
}

/** Live amount shown on active-order chips (table line uses session charge, not SKU price). */
export function orderItemDisplayTotal(
  order: TimedSessionOrder & {
    Items?: OrderItemLike[] | null;
    items?: OrderItemLike[] | null;
  },
  item: OrderItemLike & { price?: number | string | null },
  now?: Date,
): number {
  if (hasTimedTableSession(order) && isSessionTableLineItem(item)) {
    return liveSessionCharge(order, now);
  }
  const lineTotal = Number(item.total ?? 0);
  if (lineTotal > 0) return lineTotal;
  const qty = Math.max(1, Number(item.quantity ?? 1));
  return Number(item.price ?? 0) * qty;
}

export function resolveTimedOrderTotal(args: {
  order: TimedSessionOrder & {
    deliveryCharges?: number | string | null;
    packagingPrice?: number | string | null;
    totalPrice?: number | string | null;
    Items?: OrderItemLike[] | null;
    items?: OrderItemLike[] | null;
  };
  now?: Date;
}): number {
  const { order, now } = args;
  const items = order.Items ?? order.items ?? [];
  const isTableLine = isSessionTableLineItem;

  const retailSubtotal = items
    .filter((item) => !isTableLine(item))
    .reduce((sum, item) => sum + Number(item.total ?? 0), 0);

  const hasSession = hasTimedTableSession(order);

  const sessionSubtotal = hasSession
    ? liveSessionCharge(order, now)
    : items.filter((item) => isTableLine(item)).reduce((sum, item) => sum + Number(item.total ?? 0), 0);

  const delivery = Number(order.deliveryCharges ?? 0);
  const packaging = Number(order.packagingPrice ?? 0);
  return retailSubtotal + sessionSubtotal + delivery + packaging;
}
