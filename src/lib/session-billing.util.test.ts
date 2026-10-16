import { describe, expect, it } from "vitest";
import { orderItemDisplayTotal, resolveTimedOrderTotal } from "./session-billing.util";

describe("timed session billing", () => {
  const baseOrder = {
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    gameType: "Single",
    sessionMinutes: 15,
    sessionPausedAt: null,
    sessionPausedMs: 0,
    deliveryCharges: 0,
    packagingPrice: 0,
    Items: [
      { productName: "TABLE NO 6", quantity: 1, total: 100, price: 100 },
      { productName: "velo", quantity: 1, total: 250, price: 250 },
      { productName: "sooper", quantity: 1, total: 80, price: 80 },
    ],
  };

  it("sums session charge + retail for order total (not table SKU total)", () => {
    const total = resolveTimedOrderTotal({ order: baseOrder });
    expect(total).toBe(100 + 250 + 80);
  });

  it("shows live session charge on table line, not full order total", () => {
    const table = baseOrder.Items[0];
    expect(orderItemDisplayTotal(baseOrder, table)).toBe(100);
    expect(orderItemDisplayTotal(baseOrder, baseOrder.Items[1])).toBe(250);
  });
});
