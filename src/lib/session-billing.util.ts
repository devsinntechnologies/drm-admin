/** Snooker timed-table pricing — keep in sync with vendor_backend and Flutter SessionTimer. */

export type SnookerGameTypeOption = {
  name: string;
  basePrice: number;
  includedMinutes: number;
  perMinuteRate: number;
  isPerMinute: boolean;
  maxDurationMinutes?: number | null;
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
    return Math.max(0, minutes) * opt.perMinuteRate;
  }
  const m = minutes < 1 ? 1 : minutes;
  if (m <= opt.includedMinutes) {
    return opt.basePrice;
  }
  const extra = m - opt.includedMinutes;
  return opt.basePrice + extra * opt.perMinuteRate;
}

export type TimedSessionOrder = SessionClockOrder & {
  sessionPricing?: SnookerGameTypeOption | null;
  gameType?: string | null;
  sessionMinutes?: number | null;
};

/** Minutes past package included time (Single/Double) — drives OT billing like the app. */
export function packageOvertimeMinutes(
  order: TimedSessionOrder,
  now: Date | string = new Date(),
): number {
  const opt = order.sessionPricing ?? snookerOptionFor(order.gameType);
  if (!opt || opt.isPerMinute || isOpenEndedSession(order)) return 0;
  return Math.max(0, Math.ceil((playedDurationMs(order, now) - Number(order.sessionMinutes ?? 0) * 60000) / 60000));
}

export function liveSessionCharge(order: TimedSessionOrder, now: Date | string = new Date()): number {
  const opt = order.sessionPricing ?? snookerOptionFor(order.gameType);
  if (!opt) return 0;

  if (isOpenEndedSession(order)) {
    return estimatePackageCharge(opt, billablePlayedMinutes(order, now));
  }

  // Reserve the selected duration immediately. Derive overtime from the
  // paused session clock, never from a previously accumulated total.
  const booked = Math.max(0, Number(order.sessionMinutes ?? 0));
  const overtime = Math.max(0, Math.ceil(
    (playedDurationMs(order, now) - booked * 60_000) / 60_000,
  ));
  return estimatePackageCharge(opt, booked) + overtime * opt.perMinuteRate;
}

export type OrderItemLike = {
  price?: number | string | null;
  unitPriceSnapshot?: number | string | null;
  discount?: number | string | null;
  total?: number | string | null;
  quantity?: number | null;
  productName?: string | null;
  isSessionService?: boolean | null;
  product?: { isSessionService?: boolean | null; name?: string | null } | null;
};

export function isSessionTableLineItem(item: OrderItemLike): boolean {
  if (item.isSessionService || item.product?.isSessionService) return true;
  const name = String(item.productName ?? item.product?.name ?? "").toUpperCase();
  return /\bTABLE\b/.test(name);
}

/** Match the app and backend: a line discount applies once to price × quantity. */
function storedItemTotal(item: OrderItemLike): number {
  const unitPrice = item.price ?? item.unitPriceSnapshot;
  if (unitPrice != null && item.quantity != null &&
      Number.isFinite(Number(unitPrice)) && Number.isFinite(Number(item.quantity))) {
    return Math.max(0,
      Number(unitPrice) * Number(item.quantity) - Number(item.discount ?? 0));
  }
  return Math.max(0, Number(item.total ?? 0));
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
  if (hasTimedTableSession(order) && (order.sessionPricing || snookerOptionFor(order.gameType)) && isSessionTableLineItem(item)) {
    return liveSessionCharge(order, now);
  }
  return storedItemTotal(item);
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
  // Legacy orders can retain timer fields after their item records are gone.
  // Keep their recorded amount until a complete pricing snapshot is available.
  if (!items.length) {
    const persisted = Number(order.totalPrice ?? 0);
    return Number.isFinite(persisted) ? persisted : 0;
  }
  const isTableLine = isSessionTableLineItem;

  const retailSubtotal = items
    .filter((item) => !isTableLine(item))
    .reduce((sum, item) => sum + orderItemDisplayTotal(order, item, now), 0);

  const hasSession = hasTimedTableSession(order);

  const sessionSubtotal = hasSession && (order.sessionPricing || snookerOptionFor(order.gameType))
    ? liveSessionCharge(order, now)
    : items.filter((item) => isTableLine(item)).reduce((sum, item) => sum + storedItemTotal(item), 0);

  const delivery = Number(order.deliveryCharges ?? 0);
  const packaging = Number(order.packagingPrice ?? 0);
  return Math.round((retailSubtotal + sessionSubtotal + delivery + packaging) * 100) / 100;
}
