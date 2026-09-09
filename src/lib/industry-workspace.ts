import { getIndustryById } from "@/templates/industries";
import type { IndustryFamily } from "@/templates/types";

export function industryFamilyOf(industryId?: string | null): IndustryFamily | null {
  if (!industryId) return null;
  return getIndustryById(industryId)?.family ?? null;
}

export function isPharmacyIndustry(industryId?: string | null): boolean {
  return industryId === "pharmacy";
}

export function isSnookerIndustry(industryId?: string | null): boolean {
  return industryId === "snooker-pos";
}

/**
 * POS / catalog businesses that share the Flutter Inventory screen:
 * on-hand product stock, not pharmacy batches or kitchen ingredients.
 */
export function usesProductCatalogInventory(industryId?: string | null): boolean {
  if (isPharmacyIndustry(industryId) || isSnookerIndustry(industryId)) {
    return false;
  }
  return true;
}

export function usesRetailWorkspace(industryId?: string | null): boolean {
  if (isPharmacyIndustry(industryId) || isSnookerIndustry(industryId)) {
    return false;
  }
  if (industryId === "retail-store") return true;
  const family = industryFamilyOf(industryId);
  return (
    family === "general-retail" ||
    family === "high-volume-retail" ||
    family === "fashion-retail" ||
    family === "production" ||
    family === "service-business"
  );
}
