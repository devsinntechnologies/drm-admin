import { describe, expect, it } from "vitest";
import { parseMoneyInput, priceCartProduct } from "./cart-line-pricing";

describe("priceCartProduct", () => {
  it("keeps list prices without override or discount", () => {
    const r = priceCartProduct([{ price: 50, quantity: 2 }], null, null);
    expect(r.total).toBe(100);
    expect(r.linePrices).toEqual([50]);
  });

  it("spreads an override across sizes by their prices", () => {
    const r = priceCartProduct(
      [{ price: 100, quantity: 1 }, { price: 50, quantity: 2 }],
      150,
      null,
    );
    expect(r.linePrices).toEqual([75, 37.5]);
    expect(r.linePrices[0] * 1 + r.linePrices[1] * 2).toBe(150);
    expect(r.total).toBe(150);
  });

  it("subtracts the line discount and never goes negative", () => {
    expect(priceCartProduct([{ price: 40, quantity: 1 }], null, 15).total).toBe(25);
    expect(priceCartProduct([{ price: 40, quantity: 1 }], null, 90).total).toBe(0);
  });

  it("splits an override evenly when the list price is zero", () => {
    expect(priceCartProduct([{ price: 0, quantity: 4 }], 100, null).linePrices).toEqual([25]);
  });

  it("parses money input", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("-5")).toBeNull();
    expect(parseMoneyInput("12.5")).toBe(12.5);
  });
});
