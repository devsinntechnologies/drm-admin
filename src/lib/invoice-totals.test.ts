import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveInvoiceTotals } from "./invoice-totals";

describe("resolveInvoiceTotals", () => {
  it("uses line items when stored total is session-only", () => {
    const totals = resolveInvoiceTotals({
      totalPrice: 523,
      subtotal: 858,
      Items: [
        { productname: "TABLE NO 2", quantity: 1, price: 523, total: 523 },
        { productname: "velo", quantity: 1, price: 280, total: 280 },
        { productname: "bubbles", quantity: 1, price: 5, total: 5 },
        { productname: "sooper", quantity: 1, price: 50, total: 50 },
      ],
    });
    assert.equal(totals.subtotal, 858);
    assert.equal(totals.total, 858);
  });

  it("trusts checkout total when table line is inflated vs header", () => {
    const totals = resolveInvoiceTotals({
      totalPrice: 1700,
      gameType: "Single",
      sessionMinutes: 15,
      Items: [
        { productname: "TABLE NO 6", quantity: 1, price: 15000, total: 15000, isSessionService: true },
        { productname: "velo", quantity: 1, price: 250, total: 250 },
        { productname: "sooper", quantity: 1, price: 80, total: 80 },
      ],
    });
    assert.equal(totals.total, 1700);
  });

  it("falls back to API subtotal when items are missing", () => {
    const totals = resolveInvoiceTotals({
      totalPrice: 523,
      subtotal: 858,
      Items: [],
    });
    assert.equal(totals.total, 858);
  });

  it("trusts checkout header when retail lines were stamped with session charge", () => {
    const totals = resolveInvoiceTotals({
      totalPrice: 1770,
      Items: [
        { productname: "cheetos", quantity: 1, price: 1330, total: 1330, isSessionService: true },
        { productname: "Mirinda", quantity: 1, price: 1330, total: 1330, isSessionService: true },
        { productname: "velo 5 dot", quantity: 1, price: 150, total: 150 },
        { productname: "fix", quantity: 1, price: 10, total: 10 },
      ],
    });
    expect(totals.total).toBe(1770);
  });
});
