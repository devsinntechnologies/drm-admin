import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
    assert.equal(total, 100 + 250 + 80);
  });

  it("shows live session charge on table line, not full order total", () => {
    const table = baseOrder.Items[0];
    assert.equal(orderItemDisplayTotal(baseOrder, table), 100);
    assert.equal(orderItemDisplayTotal(baseOrder, baseOrder.Items[1]), 250);
  });
});
