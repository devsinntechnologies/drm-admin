import type { Product, ProductVariant } from "@/hooks/useProducts";

const DEFAULT_LOW_STOCK_PERCENT = 20;
const DEFAULT_LOW_STOCK_MIN = 5;

export type StockStatus = "untracked" | "out" | "low" | "ok";

export function isStockTracked(
  product: Pick<Product, "isStockEnabled" | "inStock" | "stockCount" | "variants">,
): boolean {
  // Only the Track inventory switch counts. Leftover on-hand numbers must not
  // keep a product limited after tracking is turned off.
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
  if (hasVariants(product)) return getTotalVariantStock(product);
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

export type CatalogAttentionItem = {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  inStock: number;
};

export type CatalogStockSummary = {
  total: number;
  tracked: number;
  ok: number;
  low: number;
  out: number;
  untracked: number;
  attention: number;
  inventoryValue: number;
  attentionItems: CatalogAttentionItem[];
};

type CatalogRow = {
  id: string;
  productId: string;
  productName: string;
  tracked: boolean;
  status: StockStatus;
  onHand: number;
  unitPrice: number;
};

function catalogRows(products: Product[]): CatalogRow[] {
  return products
    .filter((product) => String(product.status ?? "").toUpperCase() === "ACTIVE")
    .flatMap((product) => {
      if (hasVariants(product)) {
        return getActiveVariants(product).map((variant) => {
          const tracked = isStockTracked(product);
          return {
            id: `${product.id}:${variant.id}`,
            productId: product.id,
            productName: variant.name ? `${product.name} (${variant.name})` : product.name,
            tracked,
            status: getStockStatus(product, variant),
            onHand: tracked ? (variant.inStock ?? 0) : 0,
            unitPrice: Number(variant.price ?? product.price) || 0,
          };
        });
      }

      const tracked = isStockTracked(product);
      return [
        {
          id: product.id,
          productId: product.id,
          productName: product.name,
          tracked,
          status: getStockStatus(product),
          onHand: tracked ? (product.inStock ?? 0) : 0,
          unitPrice: Number(product.price) || 0,
        },
      ];
    });
}

export function summarizeCatalogStock(products: Product[]): CatalogStockSummary {
  const rows = catalogRows(products);
  const trackedRows = rows.filter((row) => row.tracked);
  const low = trackedRows.filter((row) => row.status === "low");
  const out = trackedRows.filter((row) => row.status === "out");
  const attentionItems = [...low, ...out]
    .sort((a, b) => a.onHand - b.onHand)
    .map((row) => ({
      id: row.id,
      productId: row.productId,
      productName: row.productName,
      currentStock: row.onHand,
      inStock: row.onHand,
    }));

  return {
    total: rows.length,
    tracked: trackedRows.length,
    ok: trackedRows.filter((row) => row.status === "ok").length,
    low: low.length,
    out: out.length,
    untracked: rows.filter((row) => row.status === "untracked").length,
    attention: low.length + out.length,
    inventoryValue: trackedRows.reduce(
      (sum, row) => sum + row.unitPrice * Math.max(0, row.onHand),
      0,
    ),
    attentionItems,
  };
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
