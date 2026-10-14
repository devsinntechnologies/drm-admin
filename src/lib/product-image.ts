import { resolveMediaUrl } from "@/lib/media-url";

const FALLBACK_PRODUCT_IMAGE = "/business/pic1.jpeg";

/** Product images from API / mobile uploads (uploads/products/…). */
export function resolveProductImageUrl(imagePath?: string | null): string {
  return resolveMediaUrl(imagePath, "products") ?? FALLBACK_PRODUCT_IMAGE;
}

export function resolveCategoryImageUrl(imagePath?: string | null): string {
  return resolveMediaUrl(imagePath, "categories") ?? FALLBACK_PRODUCT_IMAGE;
}
