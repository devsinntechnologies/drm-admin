import { describe, expect, it } from "vitest";
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
    expect(totals.subtotal).toBe(858);
    expect(totals.total).toBe(858);
  });

  it("falls back to API subtotal when items are missing", () => {
    const totals = resolveInvoiceTotals({
      totalPrice: 523,
      subtotal: 858,
      Items: [],
    });
    expect(totals.total).toBe(858);
  });
});
