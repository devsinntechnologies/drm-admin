import { resolveMediaUrl } from "@/lib/media-url";

const FALLBACK_PRODUCT_IMAGE = "/business/pic1.jpeg";

/** Product images from API / mobile uploads (uploads/products/…). */
export function resolveProductImageUrl(imagePath?: string | null): string {
  return resolveMediaUrl(imagePath, "products") ?? FALLBACK_PRODUCT_IMAGE;
}

export function resolveCategoryImageUrl(imagePath?: string | null): string {
  return resolveMediaUrl(imagePath, "categories") ?? FALLBACK_PRODUCT_IMAGE;
}

/** Active order / complete-order line item thumbnails. */
export function resolveOrderItemImage(
  productId: string,
  image?: string | null,
  catalogImage?: string | null,
): string {
  const trimmed = image?.trim();
  if (trimmed && !trimmed.includes("/business/pic1")) {
    return resolveProductImageUrl(trimmed);
  }
  const fromCatalog = catalogImage?.trim();
  if (fromCatalog && !fromCatalog.includes("/business/pic1")) {
    return resolveProductImageUrl(fromCatalog);
  }
  if (productId) {
    return resolveProductImageUrl(trimmed ?? fromCatalog ?? null);
  }
  return FALLBACK_PRODUCT_IMAGE;
}
