/**
 * Cart pricing shared by the web POS: same rules as the mobile app cart.
 * An override is the product's total across all its sizes, spread over the
 * lines in proportion to their prices; a line discount sits on the first line.
 * Baking both into the line items keeps the order total correct after edits.
 */

export type CartPricingLine = { price: number; quantity: number };

export function parseMoneyInput(value?: string | null): number | null {
  if (value === undefined || value === null || value.trim() === "") return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function priceCartProduct(
  lines: CartPricingLine[],
  override: number | null,
  discount: number | null,
) {
  const baseTotal = lines.reduce((sum, l) => sum + Number(l.price) * Number(l.quantity), 0);
  const quantity = lines.reduce((sum, l) => sum + Number(l.quantity), 0);
  const target = override ?? baseTotal;
  const linePrices = lines.map((l) => {
    if (override == null) return Number(l.price);
    if (baseTotal > 0) return (Number(l.price) * override) / baseTotal;
    return quantity > 0 ? override / quantity : 0;
  });
  const lineDiscount = Math.min(Math.max(0, discount ?? 0), target);
  return {
    baseTotal,
    total: Math.max(0, target - lineDiscount),
    linePrices,
    lineDiscount,
  };
}
