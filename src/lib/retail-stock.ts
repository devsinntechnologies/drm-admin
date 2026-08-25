import type { Product, ProductVariant } from "@/hooks/useProducts";

const DEFAULT_LOW_STOCK_PERCENT = 20;
const DEFAULT_LOW_STOCK_MIN = 5;

export type StockStatus = "untracked" | "out" | "low" | "ok";

export function isStockTracked(product: Pick<Product, "isStockEnabled">): boolean {
  return product.isStockEnabled === true;
}

export function getActiveVariants(product: Product): ProductVariant[] {
  return product.variants ?? [];
}

export function hasVariants(product: Product): boolean {
  return getActiveVariants(product).length > 0;
}

export function getLowStockThreshold(product: Product): number {
  if (product.stockCount != null && product.stockCount > 0) {
    return Math.floor(product.stockCount * (DEFAULT_LOW_STOCK_PERCENT / 100));
  }
  return DEFAULT_LOW_STOCK_MIN;
}

/** Raw on-hand units. null when stock is not tracked at this level. */
export function getOnHandStock(product: Product, variant?: ProductVariant): number | null {
  if (!isStockTracked(product)) return null;
  if (variant) return variant.inStock ?? null;
  if (hasVariants(product)) return null;
  return product.inStock ?? null;
}

export function getTotalVariantStock(product: Product): number {
  return getActiveVariants(product).reduce((sum, variant) => sum + (Number(variant.inStock) || 0), 0);
}

/** Units still available after items already in cart. null = unlimited (not tracked). */
export function getRemainingStock(
  product: Product,
  cartQtyByKey: Readonly<Record<string, number>>,
  variant?: ProductVariant,
): number | null {
  if (!isStockTracked(product)) return null;

  if (variant) {
    const onHand = variant.inStock ?? 0;
    const inCart = cartQtyByKey[`${product.id}:${variant.id}`] ?? 0;
    return Math.max(0, onHand - inCart);
  }

  if (hasVariants(product)) {
    return getActiveVariants(product).reduce((sum, v) => {
      const onHand = v.inStock ?? 0;
      const inCart = cartQtyByKey[`${product.id}:${v.id}`] ?? 0;
      return sum + Math.max(0, onHand - inCart);
    }, 0);
  }

  const onHand = product.inStock ?? 0;
  const inCart = cartQtyByKey[`${product.id}:base`] ?? 0;
  return Math.max(0, onHand - inCart);
}

export function isVariantSellable(
  product: Product,
  variant: ProductVariant,
  cartQtyByKey: Readonly<Record<string, number>> = {},
): boolean {
  if (product.status !== "ACTIVE") return false;
  if (!isStockTracked(product)) return true;
  return (getRemainingStock(product, cartQtyByKey, variant) ?? 0) > 0;
}

/** Whether the product can be tapped on POS (any sellable variant, or base stock). */
export function isProductSellable(
  product: Product,
  cartQtyByKey: Readonly<Record<string, number>> = {},
): boolean {
  if (product.status !== "ACTIVE") return false;
  if (!isStockTracked(product)) return true;
  return (getRemainingStock(product, cartQtyByKey) ?? 0) > 0;
}

export function getStockStatus(product: Product, variant?: ProductVariant): StockStatus {
  if (!isStockTracked(product)) return "untracked";

  const onHand = variant
    ? (variant.inStock ?? 0)
    : hasVariants(product)
      ? getTotalVariantStock(product)
      : (product.inStock ?? 0);

  if (onHand <= 0) return "out";
  if (onHand <= getLowStockThreshold(product)) return "low";
  return "ok";
}

export function stockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "untracked":
      return "Not tracked";
    case "out":
      return "Out of stock";
    case "low":
      return "Low stock";
    default:
      return "In stock";
  }
}

export function formatStockLabel(product: Product, variant?: ProductVariant): string {
  if (!isStockTracked(product)) return "Stock not tracked";
  const onHand = variant ? (variant.inStock ?? 0) : hasVariants(product) ? getTotalVariantStock(product) : (product.inStock ?? 0);
  if (variant) return `${onHand} in stock`;
  if (hasVariants(product)) {
    const count = getActiveVariants(product).length;
    return `${count} variant${count === 1 ? "" : "s"} · ${onHand} total`;
  }
  return `${onHand} in stock`;
}

export function buildCartQtyMap(
  cart: ReadonlyArray<{ productId: string; variantId?: string; quantity: number }>,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const line of cart) {
    const key = `${line.productId}:${line.variantId ?? "base"}`;
    map[key] = (map[key] ?? 0) + line.quantity;
  }
  return map;
}
